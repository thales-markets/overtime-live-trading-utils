export interface OddsPapiResolvedMarket {
    opticOddsMarketName: string;
    handicap: number;
    outcomeNameByOutcomeId: Map<number, string>;
    participantSlot?: 1 | 2;
}

export type ResolveOddsPapiMarketDefinition = (
    oddsPapiSportId: number,
    marketId: number
) => OddsPapiResolvedMarket | null;

export interface OddsPapiParticipants {
    participant1Name?: string;
    participant2Name?: string;
}

export interface OddsPapiLeagueInfo {
    oddsPapiSportId: number;
    oddsPapiTournamentIds: number[];
}

export type OddsPapiLeaguesMap = Map<number, OddsPapiLeagueInfo>;

// Raw row shape of the RISK_MANAGEMENT_ODDS_PAPI_LEAGUES_DATA CSV, before buildOddsPapiLeaguesMap parses it
// into an OddsPapiLeaguesMap.
export interface OddsPapiLeagueCsvRow {
    sportId: string | number;
    oddspapiSportId: string | number;
    oddspapiTournamentId?: string;
}

// Raw row shape of the RISK_MANAGEMENT_ODDS_PAPI_MARKETS_MAP_DATA CSV, before buildOddsPapiMarketNameMap
// parses it into a "oddsPapiSportId:marketType:period" -> our marketName lookup.
export interface OddsPapiMarketMapCsvRow {
    oddspapiSportId: string | number;
    oddspapiMarketType?: string;
    oddspapiPeriod?: string;
    opticOddsMarketName?: string;
}

// One row of OddsPapi's own /markets catalog response (per oddsPapiSportId) - the reference data
// resolveOddsPapiMarketDefinition resolves a marketId against.
export interface OddsPapiMarketCatalogEntry {
    sportId: number;
    marketId: number;
    marketType: string;
    period?: string | null;
    handicap: number;
    outcomes?: { outcomeId: number; outcomeName: string }[];
}

// snake_case shape matching OpticOdds' own SSE stream-event convention, so both vendors' stream events
// can be folded through one vendor-agnostic pipeline by a consuming repo.
export interface OddsPapiStreamEvent {
    id: string;
    fixture_id: string;
    sportsbook: string;
    name: string | undefined;
    price: number;
    timestamp: number;
    points: number;
    is_main: boolean;
    is_live: boolean;
    market: string;
    player_id: string;
    selection: string | undefined;
    selection_line: string | null;
}
