"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalStatisticsService = void 0;
/**
 * Универсальный сервис статистики.
 * Загружает данные один раз, разрешает зависимости метрик, вычисляет только запрошенные.
 */
class UniversalStatisticsService {
    constructor(entityName, fetchData) {
        this.calculators = new Map();
        this.entityName = entityName;
        this.fetchData = fetchData;
    }
    registerCalculator(calculator) {
        this.calculators.set(calculator.name, calculator);
    }
    registerCalculators(calculators) {
        for (const calc of calculators) {
            this.registerCalculator(calc);
        }
    }
    getRegisteredMetrics() {
        return Array.from(this.calculators.keys());
    }
    /**
     * Разрешает зависимости метрик — топологическая сортировка.
     * Зависимости включаются в вычисление автоматически, даже если не запрошены.
     */
    resolveDependencies(requestedMetrics) {
        const toCompute = new Set();
        const visited = new Set();
        const temp = new Set();
        const order = [];
        const addWithDeps = (name) => {
            if (!this.calculators.has(name))
                return;
            if (toCompute.has(name))
                return;
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
        const visit = (name) => {
            if (temp.has(name)) {
                throw new Error(`Circular dependency in metrics: ${name}`);
            }
            if (visited.has(name))
                return;
            temp.add(name);
            const calc = this.calculators.get(name);
            if (calc?.dependencies) {
                for (const dep of calc.dependencies) {
                    if (toCompute.has(dep))
                        visit(dep);
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
    async calculateStatistics(context, requestedMetrics) {
        const metricsToCompute = requestedMetrics && requestedMetrics.length > 0
            ? requestedMetrics.filter((m) => this.calculators.has(m))
            : Array.from(this.calculators.keys());
        const sortedMetrics = this.resolveDependencies([...metricsToCompute]);
        const data = await this.fetchData(context);
        const computed = {};
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
    async calculateBatchStatistics(contexts, requestedMetrics) {
        const results = new Map();
        for (const { key, context } of contexts) {
            const result = await this.calculateStatistics(context, requestedMetrics);
            results.set(key, result);
        }
        return results;
    }
}
exports.UniversalStatisticsService = UniversalStatisticsService;
//# sourceMappingURL=UniversalStatisticsService.js.map