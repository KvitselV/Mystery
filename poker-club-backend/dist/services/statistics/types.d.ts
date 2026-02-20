/**
 * Универсальные типы и интерфейсы для системы статистики
 */
/** Контекст запроса статистики */
export interface StatisticsContext {
    /** ID пользователя (для разрешения в entityId через доменную логику) */
    userId?: string;
    /** ID целевой сущности (например, playerProfileId) */
    entityId?: string;
    /** Временной диапазон */
    timeRange?: {
        from: Date;
        to: Date;
    };
    /** Дополнительные фильтры */
    filters?: Record<string, unknown>;
}
/** Результат вычисления статистики */
export interface StatisticsResult {
    metrics: Record<string, unknown>;
    metadata: {
        calculatedAt: Date;
        dataPoints: number;
        timeRange?: {
            from: Date;
            to: Date;
        };
    };
}
/** Интерфейс калькулятора метрики */
export interface MetricCalculator<TEntity = unknown, TResult = unknown> {
    /** Уникальное имя метрики */
    name: string;
    /** Зависимости от других метрик (имена), которые должны быть вычислены раньше */
    dependencies?: string[];
    /** Функция вычисления метрики */
    calculate: (data: TEntity[], context: StatisticsContext, computed?: Record<string, unknown>) => TResult;
}
//# sourceMappingURL=types.d.ts.map