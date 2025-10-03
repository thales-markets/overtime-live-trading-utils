export type PeriodScores = {
    [key: string]: { home: number; away: number };
};

export type PeriodResolutionData = {
    completedPeriods: number[];
    readyForResolution: boolean;
    periodScores: PeriodScores;
    currentPeriod?: number;
};

/**
 * OpticOdds Event type from their API response
 * Uses 'any' for flexibility as API structure may vary
 */
export type OpticOddsEvent = any;

/**
 * Maps period number to the type IDs that should be resolved when that period completes
 * Period 1 = First period/quarter/half
 * Period 2 = Second period/quarter/half
 * etc.
 */
export const PERIOD_TYPE_ID_MAPPING: { [period: number]: number[] } = {
    1: [10021, 10031, 10041, 10051, 10061, 10071, 10081, 10111, 10112, 10121, 10163],
    2: [10022, 10032, 10042, 10052, 10062, 10072, 10082, 10211, 10212, 10122],
    3: [10023, 10033, 10043, 10053, 10063, 10073, 10083, 10311, 10312, 10123],
    4: [10024, 10034, 10044, 10054, 10064, 10074, 10084, 10411, 10412, 10124],
    5: [10025, 10035, 10045, 10055, 10065, 10075, 10085, 10511, 10512],
    6: [10026, 10036, 10046, 10056, 10066, 10076, 10086, 10611, 10612],
    7: [10027, 10037, 10047, 10057, 10067, 10077, 10087, 10711, 10712],
    8: [10028, 10038, 10048, 10058, 10068, 10078, 10088, 10811, 10812],
    9: [10029, 10039, 10049, 10059, 10069, 10079, 10089],
};

/**
 * Full game type IDs that should NOT be resolved during live games
 * These can only be resolved when the game status is "completed"
 */
export const FULL_GAME_TYPE_IDS: number[] = [0, 10001, 10002, 10003, 10004, 10010, 10011, 10012];
