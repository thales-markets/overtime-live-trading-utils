import { Odd, OddsObject } from '../types/odds';
import {
    OddsPapiLeagueCsvRow,
    OddsPapiLeagueInfo,
    OddsPapiLeaguesMap,
    OddsPapiParticipants,
    OddsPapiStreamEvent,
    ResolveOddsPapiMarketDefinition,
} from '../types/oddsPapi';

// Builds the leagueId -> {oddsPapiSportId, oddsPapiTournamentIds} lookup consumed by getOddsPapiLeagueInfo/
// getOddsPapiSportId, from the raw RISK_MANAGEMENT_ODDS_PAPI_LEAGUES_DATA CSV rows. Rows missing either id
// (leagueId or oddsPapiSportId) are dropped - they carry no usable routing information.
export const buildOddsPapiLeaguesMap = (rawOddsPapiLeaguesData: OddsPapiLeagueCsvRow[]): OddsPapiLeaguesMap => {
    const oddsPapiLeaguesMap: OddsPapiLeaguesMap = new Map();
    rawOddsPapiLeaguesData.forEach((row) => {
        const leagueId = Number(row.sportId);
        const oddsPapiSportId = Number(row.oddspapiSportId);
        if (!leagueId || !oddsPapiSportId) return;

        const oddsPapiTournamentIds = (row.oddspapiTournamentId || '')
            .split(';')
            .map((id) => Number(id.trim()))
            .filter((id) => !!id);

        oddsPapiLeaguesMap.set(leagueId, { oddsPapiSportId, oddsPapiTournamentIds });
    });
    return oddsPapiLeaguesMap;
};

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

// Unicode combining-diacritical-marks block (U+0300-U+036F), built from character codes rather than
// embedded as source text so the file stays plain ASCII.
const COMBINING_DIACRITICS_PATTERN = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

// Accent-stripped slug for cross-feed name matching only.
const looseSlug = (value: unknown): string =>
    String(value ?? '')
        .normalize('NFD')
        .replace(COMBINING_DIACRITICS_PATTERN, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

// Accent-stripped word tokens for cross-feed name matching only.
const looseTokens = (value: unknown): string[] =>
    String(value ?? '')
        .normalize('NFD')
        .replace(COMBINING_DIACRITICS_PATTERN, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

const levenshteinDistance = (a: string, b: string): number => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
        const currentRow = [i + 1];
        for (let j = 0; j < b.length; j++) {
            const insertCost = currentRow[j] + 1;
            const deleteCost = previousRow[j + 1] + 1;
            const substituteCost = previousRow[j] + (a[i] === b[j] ? 0 : 1);
            currentRow.push(Math.min(insertCost, deleteCost, substituteCost));
        }
        previousRow = currentRow;
    }
    return previousRow[b.length];
};

/**
 * OddsPapi sides are positional (participant1/participant2) and there is no guarantee participant1 is the
 * caller's home team - esports fixtures have no real home/away and the feeds can list the teams in opposite
 * order, which would invert every price. When the papi fixture's participant names match the caller's
 * home/away team names in reversed order (and NOT in straight order), the side mapping is rotated.
 *
 * Returns null - not a guessed boolean - when there isn't enough signal to tell "confidently not rotated"
 * apart from "no idea": missing/empty names, or names with no decisive token/fuzzy match on either side.
 * Callers that use this result to gate whether a cross-vendor fixture match can be trusted at all (before
 * attaching prices to it) should treat null as "skip this fixture" rather than coercing it to false -
 * collapsing the two risks silently swapping home/away prices on an unrelated match.
 *
 * Matching is token-overlap based so word order and decorations never hide a side: tennis "Tiafoe, Frances"
 * pairs with "Frances Tiafoe", "Fenerbahce Istanbul" with "Fenerbahçe Spor Kulübü". Tokens shared within one
 * feed's OWN pair carry no side information (both Manchester clubs, both Istanbul clubs) and are dropped
 * before scoring, so a derby can only flip on the distinctive tokens. A single recognizable participant
 * decides by elimination - the fixture is already matched by gameId, so an unmatchable second name must be
 * the remaining team - but only on a distinctive token (4+ chars), so a stray "FC"/"CF" crossing sides can
 * never decide alone. An optional fuzzy (Levenshtein) tier - off unless the caller opts in - catches
 * typos/spelling drift exact tokens can't.
 *
 * teamsMap is an optional CSV-driven alias table (abbreviations, nicknames, spelling variants that
 * word-overlap/fuzzy matching can't infer, e.g. "Bob" -> "Robert") applied as a translation step before any
 * of the above runs: each of the four names is looked up by its trimmed, lowercased form and swapped for its
 * mapped value when present. Both a hit and a miss are normalized (trimmed + lowercased) identically, so a
 * mapped name and an unmapped name still compare equal downstream regardless of the alias table's authored
 * casing.
 *
 * returnNullWhenUnconfident (default true) controls the two cases above where there's no decisive signal.
 * Set it to false to opt back into the legacy behavior of always guessing a true/false from the weakest
 * available signal (whole-name containment, or the positional default when even that finds nothing) instead
 * of reporting null - only for callers not yet updated to handle a null result.
 */
export const isOddsPapiParticipantsRotated = (
    participants: OddsPapiParticipants | undefined,
    homeTeamName: string,
    awayTeamName: string,
    teamsMap?: Map<string, string>,
    fuzzyOrientationEnabled = false,
    fuzzyOrientationThreshold = 0.8,
    returnNullWhenUnconfident = true
): boolean | null => {
    const resolveName = (name: string | undefined): string => {
        const trimmed = (name ?? '').trim();
        const mapped = teamsMap?.get(trimmed.toLowerCase());
        return (mapped ?? trimmed).toLowerCase();
    };

    const participant1Name = resolveName(participants?.participant1Name);
    const participant2Name = resolveName(participants?.participant2Name);
    const resolvedHomeTeamName = resolveName(homeTeamName);
    const resolvedAwayTeamName = resolveName(awayTeamName);

    const p1 = looseSlug(participant1Name);
    const p2 = looseSlug(participant2Name);
    const h = looseSlug(resolvedHomeTeamName);
    const a = looseSlug(resolvedAwayTeamName);
    if (!p1 || !p2 || !h || !a) return returnNullWhenUnconfident ? null : false;

    const dropSharedWithin = (x: string[], y: string[]): [string[], string[]] => {
        const both = new Set(x.filter((t) => y.includes(t)));
        return [x.filter((t) => !both.has(t)), y.filter((t) => !both.has(t))];
    };
    const [tp1, tp2] = dropSharedWithin(looseTokens(participant1Name), looseTokens(participant2Name));
    const [th, ta] = dropSharedWithin(looseTokens(resolvedHomeTeamName), looseTokens(resolvedAwayTeamName));
    const intersect = (x: string[], y: string[]): string[] => {
        const set = new Set(y);
        return x.filter((t) => set.has(t));
    };

    const e1h = intersect(tp1, th);
    const e1a = intersect(tp1, ta);
    const e2h = intersect(tp2, th);
    const e2a = intersect(tp2, ta);

    // which team does each papi participant match, exclusively?
    type Claim = 'home' | 'away' | 'both' | 'none';
    const claim = (hs: string[], as: string[]): Claim =>
        hs.length && !as.length ? 'home' : as.length && !hs.length ? 'away' : hs.length || as.length ? 'both' : 'none';
    const c1 = claim(e1h, e1a);
    const c2 = claim(e2h, e2a);

    if (c1 === 'home' && c2 === 'away') return false;
    if (c1 === 'away' && c2 === 'home') return true;

    const distinctive = (ts: string[]) => ts.some((t) => t.length >= 4);
    if (c1 === 'home' && c2 === 'none' && distinctive(e1h)) return false;
    if (c1 === 'away' && c2 === 'none' && distinctive(e1a)) return true;
    if (c2 === 'away' && c1 === 'none' && distinctive(e2a)) return false;
    if (c2 === 'home' && c1 === 'none' && distinctive(e2h)) return true;

    // colliding or ambiguous claims - decide by magnitude, ties stay positional
    const straightScore = e1h.length + e2a.length;
    const swappedScore = e1a.length + e2h.length;
    if (swappedScore > straightScore && e1a.length > 0 && e2h.length > 0) {
        return true;
    }
    if (straightScore > swappedScore) return false;

    // Optional fuzzy tier: whole-slug Levenshtein similarity catches typos/spelling drift exact tokens
    // can't ("Imapct" vs "Impact"). Same exclusive-claim semantics as the token tier - a side must clear
    // the threshold alone; both sides clearing it is ambiguous and decides nothing.
    if (fuzzyOrientationEnabled) {
        const sim = (x: string, y: string): number => {
            const longest = Math.max(x.length, y.length);
            return longest ? 1 - levenshteinDistance(x, y) / longest : 0;
        };
        const fuzzyClaim = (name: string): Claim => {
            const sh = sim(name, h);
            const sa = sim(name, a);
            if (sh >= fuzzyOrientationThreshold && sa < fuzzyOrientationThreshold) return 'home';
            if (sa >= fuzzyOrientationThreshold && sh < fuzzyOrientationThreshold) return 'away';
            return sh >= fuzzyOrientationThreshold || sa >= fuzzyOrientationThreshold ? 'both' : 'none';
        };
        const f1 = fuzzyClaim(p1);
        const f2 = fuzzyClaim(p2);
        if (f1 === 'home' && f2 === 'away') return false;
        if (f1 === 'away' && f2 === 'home') return true;
        if (f1 === 'home' && f2 === 'none') return false;
        if (f1 === 'away' && f2 === 'none') return true;
        if (f2 === 'away' && f1 === 'none') return false;
        if (f2 === 'home' && f1 === 'none') return true;
    }

    // No branch produced a confident signal. By default this is reported as unknown rather than guessed,
    // since a weaker last-resort check (whole-name containment) can't reliably tell "confidently not
    // rotated" apart from "genuinely unrelated names" - see the null-return contract in the doc comment
    // above. returnNullWhenUnconfident=false opts back into the legacy guess for callers not yet updated to
    // handle null.
    if (!returnNullWhenUnconfident) {
        const matches = (x: string, y: string) => x === y || x.includes(y) || y.includes(x);
        const straight = matches(p1, h) && matches(p2, a);
        const swapped = matches(p1, a) && matches(p2, h);
        return swapped && !straight;
    }
    return null;
};

// Builds the {participant1Name, participant2Name} shape mapOddsPapiSelection expects, using the CALLER's own
// home/away team name strings (so displayed selections stay consistent regardless of vendor) rather than
// OddsPapi's own participants object. participantsRotated is resolved once per fixture by the caller (e.g.
// via isOddsPapiParticipantsRotated, by matching OddsPapi's /fixtures/live participant1Name/participant2Name
// against its own home/away team names) - true means OddsPapi's participant1 is actually the away team.
export const orientOddsPapiParticipants = (
    homeTeam: string,
    awayTeam: string,
    participantsRotated: boolean
): OddsPapiParticipants => ({
    participant1Name: participantsRotated ? awayTeam : homeTeam,
    participant2Name: participantsRotated ? homeTeam : awayTeam,
});

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
): {
    marketName: string;
    points: number;
    name: string | undefined;
    selection: string | undefined;
    selectionLine: string | null;
} | null => {
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
                    mapOddsPapiOddsLine(
                        outcomeKey,
                        outcome,
                        isLive,
                        oddsPapiSportId,
                        participants,
                        resolveMarketDefinition
                    )
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
