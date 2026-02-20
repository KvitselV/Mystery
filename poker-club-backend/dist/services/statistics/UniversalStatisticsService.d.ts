import { MetricCalculator, StatisticsContext, StatisticsResult } from './types';
export type DataFetcher<TEntity> = (context: StatisticsContext) => Promise<TEntity[]>;
/**
 * Универсальный сервис статистики.
 * Загружает данные один раз, разрешает зависимости метрик, вычисляет только запрошенные.
 */
export declare class UniversalStatisticsService<TEntity> {
    private calculators;
    private entityName;
    private fetchData;
    constructor(entityName: string, fetchData: DataFetcher<TEntity>);
    registerCalculator(calculator: MetricCalculator<TEntity>): void;
    registerCalculators(calculators: MetricCalculator<TEntity>[]): void;
    getRegisteredMetrics(): string[];
    /**
     * Разрешает зависимости метрик — топологическая сортировка.
     * Зависимости включаются в вычисление автоматически, даже если не запрошены.
     */
    resolveDependencies(requestedMetrics: string[]): string[];
    /**
     * Вычисляет статистику по контексту
     */
    calculateStatistics(context: StatisticsContext, requestedMetrics?: string[]): Promise<StatisticsResult>;
    /**
     * Пакетное вычисление статистики для нескольких контекстов
     */
    calculateBatchStatistics(contexts: Array<{
        key: string;
        context: StatisticsContext;
    }>, requestedMetrics?: string[]): Promise<Map<string, StatisticsResult>>;
}
//# sourceMappingURL=UniversalStatisticsService.d.ts.map