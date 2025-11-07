import {
    PeriodResolutionData,
    PeriodScores,
    OpticOddsEvent,
    SportPeriodType,
    HALVES_PERIOD_TYPE_ID_MAPPING,
    QUARTERS_PERIOD_TYPE_ID_MAPPING,
    INNINGS_PERIOD_TYPE_ID_MAPPING,
    PERIOD_BASED_TYPE_ID_MAPPING,
    FULL_GAME_TYPE_IDS,
} from '../types/resolution';

/**
 * Detects completed periods for a game based on OpticOdds API event data
 * A period is considered complete if the next period (period + 1) exists in the scores
 * @param event - Event object from OpticOdds API
 * @returns PeriodResolutionData with completed periods, readiness status, and period scores
 */
export const detectCompletedPeriods = (
    event: OpticOddsEvent
): PeriodResolutionData | null => {
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

    // Check if game is at halftime (period 1 is complete)
    const isAtHalftime = (status === 'half' || status === 'halftime') ||
        (inPlayPeriod && inPlayPeriod.toLowerCase() === 'half');

    // For each period, check if it's complete
    for (const periodNum of periodKeys) {
        const key = `period_${periodNum}`;
        const homeScore = homePeriods[key];
        const awayScore = awayPeriods[key];

        // Add this period's score
        if (homeScore !== undefined && awayScore !== undefined && !isNaN(homeScore) && !isNaN(awayScore)) {
            periodScores[`period${periodNum}`] = { home: homeScore, away: awayScore };

            // Period is complete if:
            // 1. Game is completed (status = completed/finished), OR
            // 2. Game is live AND in_play.period is GREATER than this period, OR
            // 3. Game is in overtime (all regulation periods are complete), OR
            // 4. Game is at halftime AND this is period 1
            //
            // Note: We do NOT check if next period exists in data, as OpticOdds may include
            //       future periods with scores (including zeros). Only in_play.period is
            //       the source of truth for live games.
            const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';
            const isCompletedInLiveGame = isLive && currentLivePeriod !== null && currentLivePeriod > periodNum;
            const isFirstPeriodAtHalftime = isAtHalftime && periodNum === 1;

            if (isCompleted || isCompletedInLiveGame || isInOvertime || isFirstPeriodAtHalftime) {
                completedPeriods.push(periodNum);
            }
        }
    }

    // Determine current period
    // For live games with numeric in_play period, use that as the authoritative current period
    // Otherwise use highest period number from the data
    const highestPeriodInData = periodKeys.length > 0 ? Math.max(...periodKeys) : undefined;
    const currentPeriod = isLive && currentLivePeriod !== null
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
 * Maps a numeric value to a SportPeriodType enum
 * @param sportTypeNum - Numeric representation of sport type (0 = halves, 1 = quarters, 2 = innings, 3 = period)
 * @returns SportPeriodType enum value
 * @throws Error if invalid number provided
 */
export function mapNumberToSportPeriodType(sportTypeNum: number): SportPeriodType {
    switch (sportTypeNum) {
        case 0:
            return SportPeriodType.HALVES_BASED;
        case 1:
            return SportPeriodType.QUARTERS_BASED;
        case 2:
            return SportPeriodType.INNINGS_BASED;
        case 3:
            return SportPeriodType.PERIOD_BASED;
        default:
            throw new Error(`Invalid sport type number: ${sportTypeNum}. Must be 0 (halves), 1 (quarters), 2 (innings), or 3 (period).`);
    }
}

/**
 * Selects the appropriate period-to-typeId mapping based on sport type
 * @param sportType - Sport period structure type
 * @returns Period-to-typeId mapping for the specified sport type
 */
function selectMappingForSportType(sportType: SportPeriodType): { [period: number]: number[] } {
    switch (sportType) {
        case SportPeriodType.HALVES_BASED:
            return HALVES_PERIOD_TYPE_ID_MAPPING;
        case SportPeriodType.QUARTERS_BASED:
            return QUARTERS_PERIOD_TYPE_ID_MAPPING;
        case SportPeriodType.INNINGS_BASED:
            return INNINGS_PERIOD_TYPE_ID_MAPPING;
        case SportPeriodType.PERIOD_BASED:
            return PERIOD_BASED_TYPE_ID_MAPPING;
    }
}

/**
 * Checks if a specific market type can be resolved based on completed periods (Enum version)
 *
 * @example
 * // Check single typeId for NFL (quarters-based)
 * const canResolve = canResolveMarketsForEvent(event, 10021, SportPeriodType.QUARTERS_BASED);
 *
 * // Check with period-based (no halves/secondary moneyline)
 * const canResolve = canResolveMarketsForEvent(event, 10021, SportPeriodType.PERIOD_BASED);
 *
 * @param event - OpticOdds event object containing fixture data
 * @param typeId - The market type identifier
 * @param sportType - The sport period type enum
 * @returns true if the market can be resolved based on completed periods
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeId: number,
    sportType: SportPeriodType
): boolean {
    const periodData = detectCompletedPeriods(event);
    if (!periodData) return false;

    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';

    // Full game typeIds can only be resolved when game is completed
    if (FULL_GAME_TYPE_IDS.includes(typeId)) {
        return isCompleted;
    }

    // Select appropriate mapping based on sport type
    const mapping = selectMappingForSportType(sportType);

    const resolvableTypeIds = new Set<number>();
    for (const period of periodData.completedPeriods) {
        const typeIdsForPeriod = mapping[period] || [];
        typeIdsForPeriod.forEach((id) => resolvableTypeIds.add(id));
    }

    return resolvableTypeIds.has(typeId);
}

/**
 * Checks if a specific market type can be resolved based on completed periods (Number version)
 *
 * @example
 * // Check single typeId for NFL (quarters-based)
 * const canResolve = canResolveMarketsForEventNumber(event, 10021, 1);
 *
 * @param event - OpticOdds event object containing fixture data
 * @param typeId - The market type identifier
 * @param sportTypeNumber - Numeric value representing the sport period type
 * @returns true if the market can be resolved based on completed periods
 */
export function canResolveMarketsForEventNumber(
    event: OpticOddsEvent,
    typeId: number,
    sportTypeNumber: number
): boolean {
    const sportTypeEnum = mapNumberToSportPeriodType(sportTypeNumber);
    return canResolveMarketsForEvent(event, typeId, sportTypeEnum);
}


/**
 * Checks if multiple market types can be resolved, returning a boolean for each
 *
 * @example
 * // Check multiple typeIds for MLB (innings-based)
 * const canResolve = canResolveMultipleTypeIdsForEvent(event, [10021, 10051], SportPeriodType.INNINGS_BASED);
 * // Returns: [true, false] if only 10021 can be resolved
 */
export function canResolveMultipleTypeIdsForEvent(
    event: OpticOddsEvent,
    typeIds: number[],
    sportType: SportPeriodType | number
): boolean[] {
    // Get completed periods
    const periodData = detectCompletedPeriods(event);
    if (!periodData) {
        return typeIds.map(() => false);
    }

    // Check if game is fully completed
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';

    // Convert number to SportPeriodType if needed
    const sportTypeEnum = typeof sportType === 'number' ? mapNumberToSportPeriodType(sportType) : sportType;

    // Select appropriate mapping based on sport type
    const mapping = selectMappingForSportType(sportTypeEnum);

    // Collect all resolvable typeIds based on completed periods
    const resolvableTypeIds = new Set<number>();

    for (const period of periodData.completedPeriods) {
        const typeIdsForPeriod = mapping[period] || [];
        typeIdsForPeriod.forEach((id) => resolvableTypeIds.add(id));
    }

    // Map each typeId to a boolean
    return typeIds.map((id) => {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(id)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(id);
    });
}

/**
 * Filters a list of market types to only those that can be resolved
 *
 * @example
 * // Filter typeIds for MLB (innings-based)
 * const resolvable = filterMarketsThatCanBeResolved(event, [10021, 10051, 10061], SportPeriodType.INNINGS_BASED);
 * // Returns: [10021] if only period 1-4 complete, [10021, 10051] if period 5 complete
 */
export function filterMarketsThatCanBeResolved(
    event: OpticOddsEvent,
    typeIds: number[],
    sportType: SportPeriodType | number
): number[] {
    // Get completed periods
    const periodData = detectCompletedPeriods(event);
    if (!periodData) {
        return [];
    }

    // Check if game is fully completed
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';

    // Convert number to SportPeriodType if needed
    const sportTypeEnum = typeof sportType === 'number' ? mapNumberToSportPeriodType(sportType) : sportType;

    // Select appropriate mapping based on sport type
    const mapping = selectMappingForSportType(sportTypeEnum);

    // Collect all resolvable typeIds based on completed periods
    const resolvableTypeIds = new Set<number>();

    for (const period of periodData.completedPeriods) {
        const typeIdsForPeriod = mapping[period] || [];
        typeIdsForPeriod.forEach((id) => resolvableTypeIds.add(id));
    }

    // Filter typeIds to only those that can be resolved
    return typeIds.filter((id) => {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(id)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(id);
    });
}
