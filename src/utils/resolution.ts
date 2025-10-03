import {
    PeriodResolutionData,
    PeriodScores,
    OpticOddsEvent,
    PERIOD_TYPE_ID_MAPPING,
    FULL_GAME_TYPE_IDS,
} from '../types/resolution';

/**
 * Detects completed periods for a game based on OpticOdds API event data
 * A period is considered complete if the next period (period + 1) exists in the scores
 * @param event - Event object from OpticOdds API
 * @param sportName - Optional sport name override (will use event.sport.name if not provided)
 * @returns PeriodResolutionData with completed periods, readiness status, and period scores
 */
export const detectCompletedPeriods = (
    event: OpticOddsEvent,
    sportName?: string
): PeriodResolutionData | null => {
    const sport = (sportName || event.sport?.name || '').toLowerCase();
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isLive = event.fixture?.is_live ?? event.is_live ?? false;

    // Extract period scores from the event
    const homePeriods = event.scores?.home?.periods || {};
    const awayPeriods = event.scores?.away?.periods || {};

    const periodScores: PeriodScores = {};
    const completedPeriods: number[] = [];

    // Parse all available periods
    const periodKeys = Object.keys(homePeriods)
        .filter((key) => key.startsWith('period_'))
        .map((key) => parseInt(key.replace('period_', '')))
        .sort((a, b) => a - b);

    if (periodKeys.length === 0) {
        return null; // No period data available
    }

    // Get current period from in_play if available (only use if numeric)
    const inPlayPeriod = event.in_play?.period;
    const currentLivePeriod = inPlayPeriod && !isNaN(parseInt(inPlayPeriod)) ? parseInt(inPlayPeriod) : null;

    // Check if game is in overtime/extra time (non-numeric period indicator)
    const isInOvertime = inPlayPeriod &&
        (inPlayPeriod.toLowerCase().includes('overtime') ||
         inPlayPeriod.toLowerCase().includes('ot') ||
         inPlayPeriod.toLowerCase().includes('extra'));

    // For each period, check if it's complete
    for (const periodNum of periodKeys) {
        const key = `period_${periodNum}`;
        const homeScore = homePeriods[key];
        const awayScore = awayPeriods[key];

        // Add this period's score
        if (homeScore !== undefined && awayScore !== undefined && !isNaN(homeScore) && !isNaN(awayScore)) {
            periodScores[`period${periodNum}`] = { home: homeScore, away: awayScore };

            // Period is complete if:
            // 1. Next period exists in periods data, OR
            // 2. Game is completed, OR
            // 3. Game is live with numeric period AND current live period is greater than this period, OR
            // 4. Game is in overtime (all regulation periods are complete)
            const nextPeriodKey = `period_${periodNum + 1}`;
            const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';
            const hasNextPeriod = homePeriods[nextPeriodKey] !== undefined && awayPeriods[nextPeriodKey] !== undefined;
            const isCompletedInLiveGame = isLive && currentLivePeriod !== null && currentLivePeriod > periodNum;

            if (hasNextPeriod || isCompleted || isCompletedInLiveGame || isInOvertime) {
                completedPeriods.push(periodNum);
            }
        }
    }

    // Determine current period
    // If we have a numeric in_play period and it's greater than highest period in data, use it
    // Otherwise use highest period number from the data
    const highestPeriodInData = periodKeys.length > 0 ? Math.max(...periodKeys) : undefined;
    const currentPeriod = currentLivePeriod && currentLivePeriod > (highestPeriodInData || 0)
        ? currentLivePeriod
        : highestPeriodInData;

    return completedPeriods.length > 0
        ? {
              completedPeriods,
              readyForResolution: true,
              periodScores,
              currentPeriod,
          }
        : null;
};

/**
 * Checks if a market can be resolved based on game and sport
 * @param gameId - The game/fixture ID
 * @param event - Event object from OpticOdds API
 * @param sportName - Optional sport name override
 * @returns boolean indicating if market can be resolved
 */
export const canResolveMarketForGameIdAndSport = (
    gameId: string,
    event: OpticOddsEvent,
    sportName?: string
): boolean => {
    const eventId = event.fixture?.id || event.id || '';
    if (eventId !== gameId) {
        return false;
    }

    const periodData = detectCompletedPeriods(event, sportName);
    return periodData !== null && periodData.readyForResolution;
};

/**
 * Convenience function to check resolution status via OpticOdds API event
 * @param event - Event object from OpticOdds API
 * @param sportName - Optional sport name override
 * @returns PeriodResolutionData if periods are complete, null otherwise
 */
export const canResolveMarketViaOpticOddsApi = (
    event: OpticOddsEvent,
    sportName?: string
): PeriodResolutionData | null => {
    return detectCompletedPeriods(event, sportName);
};

/**
 * Checks if a single market type can be resolved based on completed periods
 * @param event - Event object from OpticOdds API
 * @param typeId - Single market type ID to check
 * @param sportName - Optional sport name override
 * @returns boolean indicating if that typeId can be resolved
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeId: number,
    sportName?: string
): boolean;

/**
 * Checks which market types can be resolved from a batch based on completed periods
 * @param event - Event object from OpticOdds API
 * @param typeIds - Array of market type IDs to check
 * @param sportName - Optional sport name override
 * @returns Array of typeIds that can be resolved
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeIds: number[],
    sportName?: string
): number[];

/**
 * Implementation - checks if specific market type(s) can be resolved based on completed periods
 *
 * @example
 * // Check single typeId
 * const canResolve = canResolveMarketsForEvent(event, 10021); // true/false
 *
 * // Check batch of typeIds
 * const resolvable = canResolveMarketsForEvent(event, [10021, 10022, 10001]);
 * // Returns: [10021] if only period 1 is complete
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeIdOrTypeIds: number | number[],
    sportName?: string
): boolean | number[] {
    // Get completed periods
    const periodData = detectCompletedPeriods(event, sportName);
    if (!periodData) {
        return Array.isArray(typeIdOrTypeIds) ? [] : false;
    }

    // Check if game is fully completed
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';

    // Collect all resolvable typeIds based on completed periods
    const resolvableTypeIds = new Set<number>();

    for (const period of periodData.completedPeriods) {
        const typeIdsForPeriod = PERIOD_TYPE_ID_MAPPING[period] || [];
        typeIdsForPeriod.forEach((id) => resolvableTypeIds.add(id));
    }

    // Single typeId check
    if (typeof typeIdOrTypeIds === 'number') {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(typeIdOrTypeIds)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(typeIdOrTypeIds);
    }

    // Batch typeIds check
    return typeIdOrTypeIds.filter((id) => {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(id)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(id);
    });
};
