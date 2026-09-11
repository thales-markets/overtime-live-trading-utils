import { Odd, OddsObject } from '../types/odds';
import {
    OddsPapiLeagueInfo,
    OddsPapiLeaguesMap,
    OddsPapiParticipants,
    OddsPapiStreamEvent,
    ResolveOddsPapiMarketDefinition,
} from '../types/oddsPapi';

// Returns {oddsPapiSportId, oddsPapiTournamentIds} for a league, or null when the league has no
// RISK_MANAGEMENT_ODDS_PAPI_LEAGUES_DATA row (not routed to OddsPapi).
export const getOddsPapiLeagueInfo = (
    leagueId: number | string,
    oddsPapiLeaguesMap: OddsPapiLeaguesMap | undefined
): OddsPapiLeagueInfo | null => (oddsPapiLeaguesMap && oddsPapiLeaguesMap.get(Number(leagueId))) || null;

// Convenience accessor for callers that only need the sportId (returns null, same as getOddsPapiLeagueInfo,
// when unmapped).
export const getOddsPapiSportId = (
    leagueId: number | string,
    oddsPapiLeaguesMap: OddsPapiLeaguesMap | undefined
): number | null => {
    const info = getOddsPapiLeagueInfo(leagueId, oddsPapiLeaguesMap);
    return info ? info.oddsPapiSportId : null;
};

// Best-effort selection mapping from an OddsPapi outcome name to this repo's {selection, selectionLine}
// convention: "1"/"2" -> home/away participant name (moneyline/spread-style markets), "Over"/"Under" ->
// selectionLine, everything else (e.g. "Yes"/"No", correct-score outcomes) passes through as selection
// verbatim. `participants` is expected pre-oriented to the CALLER's home/away convention (see
// orientOddsPapiParticipants below) - callers must not pass OddsPapi's own participants object directly,
// since neither OddsPapi's docs nor any bookmaker guarantee "1"/participant1 lines up with any particular
// provider's home team (see participantsRotated in OddsPapi's own docs).
const mapOddsPapiSelection = (
    outcomeName: string | undefined,
    participants: OddsPapiParticipants | undefined
): { selection: string | undefined; selectionLine: string | null } => {
    if (outcomeName === '1') return { selection: participants?.participant1Name, selectionLine: null };
    if (outcomeName === '2') return { selection: participants?.participant2Name, selectionLine: null };
    if (outcomeName === 'Over' || outcomeName === 'Under') {
        return { selection: undefined, selectionLine: outcomeName.toLowerCase() };
    }
    return { selection: outcomeName, selectionLine: null };
};

// Builds the {participant1Name, participant2Name} shape mapOddsPapiSelection expects, using the CALLER's own
// home/away team name strings (so displayed selections stay consistent regardless of vendor) rather than
// OddsPapi's own participants object. participantsRotated is resolved once per fixture by the caller (by
// matching OddsPapi's /fixtures/live participant1Name/participant2Name against its own home/away team names)
// - true means OddsPapi's participant1 is actually the away team.
export const orientOddsPapiParticipants = (
    homeTeam: string,
    awayTeam: string,
    participantsRotated: boolean
): OddsPapiParticipants => ({
    participant1Name: participantsRotated ? awayTeam : homeTeam,
    participant2Name: participantsRotated ? homeTeam : awayTeam,
});

// Shared marketId/outcomeId -> {marketName, points, name, selection, selectionLine} resolution, used by both
// the REST snapshot mapper and a WS stream normalizer, so there is exactly one place that interprets
// OddsPapi's market taxonomy. Returns null when the market isn't resolved to a marketName - callers must
// drop the line in that case. resolveMarketDefinition is the caller's own marketId -> definition lookup
// (CSV/catalog-backed in the consuming repo - out of scope for this library).
export const mapOddsPapiOutcomeFields = (
    outcome: any,
    oddsPapiSportId: number,
    participants: OddsPapiParticipants | undefined,
    resolveMarketDefinition: ResolveOddsPapiMarketDefinition
): { marketName: string; points: number; name: string | undefined; selection: string | undefined; selectionLine: string | null } | null => {
    const definition = resolveMarketDefinition(oddsPapiSportId, outcome.marketId);
    if (!definition) return null;

    const outcomeName = definition.outcomeNameByOutcomeId.get(outcome.outcomeId);
    const { selection, selectionLine } = mapOddsPapiSelection(outcomeName, participants);

    // Adjust to OpticOdds convention where away has opposite sign
    let points = definition.handicap;
    if (outcomeName === '2') points = -1 * definition.handicap;

    return {
        marketName: definition.opticOddsMarketName.toLowerCase(),
        points,
        name: outcomeName,
        selection,
        selectionLine,
    };
};

// Per OddsPapi's own integration guidance, active:false or marketActive:false is a hard stop for an outcome -
// dropped here rather than mapped, since a REST snapshot has no "previous" state to reconcile against (a
// streaming caller should instead treat this as locking/removing an existing price).
const isOddsPapiOutcomeHardStopped = (outcome: any): boolean => !outcome.active || !outcome.marketActive;

const mapOddsPapiOddsLine = (
    outcomeKey: string,
    outcome: any,
    isLive: boolean,
    oddsPapiSportId: number,
    participants: OddsPapiParticipants | undefined,
    resolveMarketDefinition: ResolveOddsPapiMarketDefinition
): Odd | null => {
    if (isOddsPapiOutcomeHardStopped(outcome)) return null;

    const fields = mapOddsPapiOutcomeFields(outcome, oddsPapiSportId, participants, resolveMarketDefinition);
    if (!fields) return null;

    return {
        id: outcomeKey,
        sportsBookName: outcome.bookmaker,
        name: fields.name,
        price: outcome.price,
        timestamp: outcome.changedAt,
        points: fields.points,
        isMain: outcome.mainLine,
        isLive,
        marketName: fields.marketName,
        playerId: outcome.playerId,
        selection: fields.selection,
        selectionLine: fields.selectionLine,
    } as Odd;
};

// Maps one OddsPapi /fixtures/odds response (odds keyed by bookmaker then by a composite outcome key) into a
// flat-odds-array shape, so downstream processing stays vendor-agnostic once odds are mapped. gameId/
// homeTeam/awayTeam/participantsRotated are the caller's own internal data, threaded through by the caller
// from its own game record - used instead of this response's own `participants` field, see
// orientOddsPapiParticipants.
export const mapOddsPapiApiFixtureOdds = (
    fixtureOddsResults: any[],
    resolveMarketDefinition: ResolveOddsPapiMarketDefinition
): OddsObject[] =>
    fixtureOddsResults.filter(Boolean).map(({ gameId, fixtureOdds, homeTeam, awayTeam, participantsRotated }) => {
        const isLive = !!fixtureOdds.status?.live;
        const oddsPapiSportId = fixtureOdds.sport?.sportId;
        const participants = orientOddsPapiParticipants(homeTeam, awayTeam, participantsRotated);

        const odds = Object.values(fixtureOdds.odds || {})
            .flatMap((outcomesByKey: any) =>
                Object.entries(outcomesByKey).map(([outcomeKey, outcome]) =>
                    mapOddsPapiOddsLine(outcomeKey, outcome, isLive, oddsPapiSportId, participants, resolveMarketDefinition)
                )
            )
            .filter(Boolean);

        const startDate: any =
            typeof fixtureOdds.startTime === 'number' ? new Date(fixtureOdds.startTime * 1000).toISOString() : null;

        return {
            gameId,
            startDate,
            homeTeam,
            awayTeam,
            isLive,
            status: fixtureOdds.status?.statusName,
            sport: oddsPapiSportId,
            league: fixtureOdds.tournament?.tournamentId,
            odds,
        } as OddsObject;
    });

// Maps one raw OddsPapi outcome (as stored by a WS stream writer, one blob per fixtureId:bookmaker) into a
// snake_case stream-event shape matching OpticOdds' own SSE convention, so a caller can fold both vendors'
// stream events through one vendor-agnostic pipeline. gameId/participants are resolved by the caller from its
// own internal game record carrying this outcome's fixtureId. Returns null when the market isn't resolved -
// caller must drop the line.
export const mapOddsPapiStreamOutcomeToEvent = (
    outcomeKey: string,
    storedOutcome: any,
    gameId: string,
    oddsPapiSportId: number,
    participants: OddsPapiParticipants | undefined,
    resolveMarketDefinition: ResolveOddsPapiMarketDefinition
): OddsPapiStreamEvent | null => {
    const fields = mapOddsPapiOutcomeFields(storedOutcome, oddsPapiSportId, participants, resolveMarketDefinition);
    if (!fields) return null;

    return {
        id: outcomeKey,
        fixture_id: gameId,
        sportsbook: storedOutcome.bookmaker,
        name: fields.name,
        price: storedOutcome.price,
        timestamp: storedOutcome.changedAt,
        points: fields.points,
        is_main: storedOutcome.mainLine,
        is_live: true,
        market: fields.marketName,
        player_id: storedOutcome.playerId,
        selection: fields.selection,
        selection_line: fields.selectionLine,
    };
};
