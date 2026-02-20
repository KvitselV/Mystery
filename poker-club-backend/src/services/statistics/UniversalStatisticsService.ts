import {
  MetricCalculator,
  StatisticsContext,
  StatisticsResult,
} from './types';

export type DataFetcher<TEntity> = (context: StatisticsContext) => Promise<TEntity[]>;

/**
 * Универсальный сервис статистики.
 * Загружает данные один раз, разрешает зависимости метрик, вычисляет только запрошенные.
 */
export class UniversalStatisticsService<TEntity> {
  private calculators = new Map<string, MetricCalculator<TEntity>>();
  private entityName: string;
  private fetchData: DataFetcher<TEntity>;

  constructor(
    entityName: string,
    fetchData: DataFetcher<TEntity>
  ) {
    this.entityName = entityName;
    this.fetchData = fetchData;
  }

  registerCalculator(calculator: MetricCalculator<TEntity>): void {
    this.calculators.set(calculator.name, calculator);
  }

  registerCalculators(calculators: MetricCalculator<TEntity>[]): void {
    for (const calc of calculators) {
      this.registerCalculator(calc);
    }
  }

  getRegisteredMetrics(): string[] {
    return Array.from(this.calculators.keys());
  }

  /**
   * Разрешает зависимости метрик — топологическая сортировка.
   * Зависимости включаются в вычисление автоматически, даже если не запрошены.
   */
  resolveDependencies(requestedMetrics: string[]): string[] {
    const toCompute = new Set<string>();
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const addWithDeps = (name: string): void => {
      if (!this.calculators.has(name)) return;
      if (toCompute.has(name)) return;

      toCompute.add(name);
      const calc = this.calculators.get(name);
      if (calc?.dependencies) {
        for (const dep of calc.dependencies) {
          addWithDeps(dep);
        }
      }
    };

    for (const name of requestedMetrics) {
      addWithDeps(name);
    }

    const visit = (name: string): void => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency in metrics: ${name}`);
      }
      if (visited.has(name)) return;

      temp.add(name);
      const calc = this.calculators.get(name);
      if (calc?.dependencies) {
        for (const dep of calc.dependencies) {
          if (toCompute.has(dep)) visit(dep);
        }
      }
      temp.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of toCompute) {
      visit(name);
    }

    return order;
  }

  /**
   * Вычисляет статистику по контексту
   */
  async calculateStatistics(
    context: StatisticsContext,
    requestedMetrics?: string[]
  ): Promise<StatisticsResult> {
    const metricsToCompute = requestedMetrics && requestedMetrics.length > 0
      ? requestedMetrics.filter((m) => this.calculators.has(m))
      : Array.from(this.calculators.keys());

    const sortedMetrics = this.resolveDependencies([...metricsToCompute]);

    const data = await this.fetchData(context);

    const computed: Record<string, unknown> = {};
    for (const name of sortedMetrics) {
      const calc = this.calculators.get(name);
      if (calc) {
        computed[name] = calc.calculate(data, context, computed);
      }
    }

    return {
      metrics: computed,
      metadata: {
        calculatedAt: new Date(),
        dataPoints: data.length,
        timeRange: context.timeRange,
      },
    };
  }

  /**
   * Пакетное вычисление статистики для нескольких контекстов
   */
  async calculateBatchStatistics(
    contexts: Array<{ key: string; context: StatisticsContext }>,
    requestedMetrics?: string[]
  ): Promise<Map<string, StatisticsResult>> {
    const results = new Map<string, StatisticsResult>();
    for (const { key, context } of contexts) {
      const result = await this.calculateStatistics(context, requestedMetrics);
      results.set(key, result);
    }
    return results;
  }
}
