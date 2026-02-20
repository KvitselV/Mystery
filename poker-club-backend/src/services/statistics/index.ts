export * from './types';
export { UniversalStatisticsService } from './UniversalStatisticsService';
export * from './calculators/BaseCalculators';
import { PokerStatisticsService } from './PokerStatisticsService';
export { PokerStatisticsService, POKER_METRIC_NAMES } from './PokerStatisticsService';
export type { PokerMetricName } from './PokerStatisticsService';

/** Единственный экземпляр PokerStatisticsService (singleton) */
export const pokerStatisticsService = PokerStatisticsService.getInstance();
