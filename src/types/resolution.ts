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
 * Sport period structure types
 * Different sports have different period structures that affect how typeIds are resolved
 */
export enum SportPeriodType {
    /** Sports with 2 halves (Soccer, NCAAB) */
    HALVES_BASED = 'halves_based',
    /** Sports with 4 quarters (NFL, NBA) */
    QUARTERS_BASED = 'quarters_based',
    /** Sports with 9+ innings (MLB, NPB, KBO, College Baseball, etc.) */
    INNINGS_BASED = 'innings_based',
    /** Sports with 9 periods without halves or secondary moneyline types */
    PERIOD_BASED = 'period_based',
}

/**
 * Halves-based sports period-to-typeId mapping (Soccer, NCAAB)
 * Period 1 = 1st half
 * Period 2 = 2nd half
 */
export const HALVES_PERIOD_TYPE_ID_MAPPING: { [period: number]: number[] } = {
    1: [10021, 10031, 10041, 10051, 10061, 10071, 10081, 10111, 10112, 10121, 10163, 10200, 10101, 10118, 10119], // 1st half
    2: [10022, 10032, 10042, 10052, 10062, 10072, 10082, 10211, 10212, 10122, 10164, 10201, 10102, 10218, 10219], // 2nd half
};

/**
 * Quarters-based sports period-to-typeId mapping (NFL, NBA)
 * Period 1 = 1st quarter
 * Period 2 = 2nd quarter (also completes 1st half - typeId 10051)
 * Period 3 = 3rd quarter
 * Period 4 = 4th quarter (also completes 2nd half - typeId 10052)
 * Period 5+ = Overtime
 */
export const QUARTERS_PERIOD_TYPE_ID_MAPPING: { [period: number]: number[] } = {
    1: [10021, 10031, 10041, 10081, 10111, 10112, 10121, 10163, 10101], // 1st quarter
    2: [10022, 10032, 10042, 10051, 10061, 10071, 10082, 10091, 10211, 10212, 10122, 10164, 10102, 10118, 10119], // 2nd quarter + 1st half
    3: [10023, 10033, 10043, 10063, 10073, 10083, 10311, 10312, 10123, 10165, 10103], // 3rd quarter
    4: [10024, 10034, 10044, 10052, 10062, 10072, 10064, 10074, 10084, 10092, 10411, 10412, 10124, 10166, 10104, 10218, 10219], // 4th quarter + 2nd half
    5: [], // Overtime/5th period
};

/**
 * Innings-based sports period-to-typeId mapping (MLB, NPB, KBO, College Baseball)
 * Period 1-5 = Innings 1-5 (period 5 completes 1st half - typeId 10051)
 * Period 6-9 = Innings 6-9 (period 9 completes 2nd half - typeId 10052)
 */
export const INNINGS_PERIOD_TYPE_ID_MAPPING: { [period: number]: number[] } = {
    1: [10021, 10031, 10041, 10061, 10071, 10081, 10111, 10112, 10121, 10163, 10101], // 1st inning
    2: [10022, 10032, 10042, 10062, 10072, 10082, 10211, 10212, 10122, 10164, 10102], // 2nd inning
    3: [10023, 10033, 10043, 10063, 10073, 10083, 10311, 10312, 10123, 10165, 10170, 10171, 10172, 10173, 10174, 10201, 10103], // 3rd inning + first 3 innings
    4: [10024, 10034, 10044, 10064, 10074, 10084, 10411, 10412, 10124, 10166, 10104], // 4th inning
    5: [10025, 10035, 10045, 10051, 10065, 10075, 10085, 10511, 10512, 10167, 10200, 10105], // 5th inning + 1st half (first 5 innings)
    6: [10026, 10036, 10046, 10056, 10066, 10076, 10086, 10611, 10612, 10168, 10106], // 6th inning
    7: [10027, 10037, 10047, 10057, 10067, 10077, 10087, 10711, 10712, 10169, 10175, 10176, 10177, 10178, 10179, 10202, 10107], // 7th inning + first 7 innings
    8: [10028, 10038, 10048, 10058, 10068, 10078, 10088, 10811, 10812, 10197, 10108], // 8th inning
    9: [10029, 10039, 10049, 10052, 10069, 10079, 10089, 10198, 10109], // 9th inning
};

/**
 * Period-based sports period-to-typeId mapping (9 periods)
 * Excludes halves types (10051, 10052) and secondary moneyline types (ending in 11/12)
 */
export const PERIOD_BASED_TYPE_ID_MAPPING: { [period: number]: number[] } = {
    1: [10021, 10031, 10041, 10061, 10071, 10081, 10121, 10163, 10101], // 1st period
    2: [10022, 10032, 10042, 10062, 10072, 10082, 10122, 10164, 10102], // 2nd period
    3: [10023, 10033, 10043, 10063, 10073, 10083, 10123, 10165, 10103], // 3rd period
    4: [10024, 10034, 10044, 10064, 10074, 10084, 10124, 10166, 10104], // 4th period
    5: [10025, 10035, 10045, 10065, 10075, 10085, 10167, 10105], // 5th period
    6: [10026, 10036, 10046, 10056, 10066, 10076, 10086, 10168, 10106], // 6th period
    7: [10027, 10037, 10047, 10057, 10067, 10077, 10087, 10169, 10107], // 7th period
    8: [10028, 10038, 10048, 10058, 10068, 10078, 10088, 10197, 10108], // 8th period
    9: [10029, 10039, 10049, 10069, 10079, 10089, 10198, 10109], // 9th period
};

/**
 * Full game type IDs that should NOT be resolved during live games
 * These can only be resolved when the game status is "completed"
 */
export const FULL_GAME_TYPE_IDS: number[] = [0, 10001, 10002, 10003, 10004, 10010, 10011, 10012];
