import { LeagueConfigInfo } from '../types/sports';

// Live markets config (live-markets-map.csv, live-markets-soccer-map.csv) can be stored in two ways:
//
// 1. Legacy: one row per league and market, with the columns of LIVE_LEAGUE_CONFIG_COLUMNS.
// 2. Templated, in three files:
//    - templates: `template,typeId,marketName,...` - each market set written once, under a template name
//    - leagues:   `name,sportId,template` - one row per league, naming its template (empty for none)
//    - overrides: `sportId,typeId,marketName,...` - only the rows of a league that differ from its template
//
// A league row of a templated league gets a copy of its template's rows, with the league's name and sportId. Then
// each override row with the same sportId and typeId replaces the template row, an override row with a typeId the
// template doesn't have is added, and an override row with enabled=removed drops the market. The league's name always
// comes from the leagues file.
//
// expandLiveLeagueConfigs takes the parsed rows of any mix of these files (e.g. every URL of
// GITHUB_URL_LIVE_LEAGUES_CSVS) and returns the legacy rows, so nothing after the loader changes. It tells the files
// apart by their columns, so the legacy files keep working: their rows are returned as they are, unless a leagues file
// lists the same sportId, in which case they are that league's overrides.

export const LIVE_LEAGUE_CONFIG_COLUMNS = [
    'name',
    'sportId',
    'typeId',
    'marketName',
    'type',
    'enabled',
    'minOdds',
    'maxOdds',
    'addedSpread',
    'primaryBookmaker',
    'secondaryBookmaker',
    'tertiaryBookmaker',
    'percentageDiffForLines',
] as const;

// The market columns of a template or override row, the same as the legacy columns without name and sportId
export const LIVE_LEAGUE_CONFIG_MARKET_COLUMNS = LIVE_LEAGUE_CONFIG_COLUMNS.slice(2);

// enabled value of an override row that drops the template's market from the league
export const LIVE_LEAGUE_CONFIG_REMOVED = 'removed';

export type LiveLeagueCsvRow = Record<string, string | undefined>;

export type LiveLeagueCsvKind = 'templates' | 'leagues' | 'rows';

// The kind of a parsed live leagues CSV, by its columns. An empty file is 'rows' (nothing to expand).
export const getLiveLeagueCsvKind = (rows: LiveLeagueCsvRow[]): LiveLeagueCsvKind => {
    const firstRow = rows[0];
    if (!firstRow || !('template' in firstRow)) return 'rows';
    return 'typeId' in firstRow ? 'templates' : 'leagues';
};

export type ExpandLiveLeagueConfigsOptions = {
    // Called for each problem found (unknown template, repeated league or template market...). Defaults to console.warn.
    onWarning?: (message: string) => void;
};

const str = (value: string | undefined) => (value === undefined || value === null ? '' : String(value));

// A legacy row with the columns in their usual order, so a templated league serializes like a legacy one
const toLeagueConfigRow = (name: string, sportId: string, marketRow: LiveLeagueCsvRow) => {
    const row: Record<string, string> = { name, sportId };
    for (const column of LIVE_LEAGUE_CONFIG_MARKET_COLUMNS) row[column] = str(marketRow[column]);
    return row as unknown as LeagueConfigInfo & { name: string };
};

/**
 * Expands parsed live leagues CSVs (legacy and/or templated, in any order) into legacy league config rows.
 *
 * Rows come out in file order: legacy rows where their file is, and each templated league, in template order followed
 * by its added markets, where its leagues file is. A league with an unknown template is left out (with a warning),
 * rather than going live with a config nobody set.
 */
export const expandLiveLeagueConfigs = (
    csvs: LiveLeagueCsvRow[][],
    options: ExpandLiveLeagueConfigsOptions = {}
): (LeagueConfigInfo & { name?: string })[] => {
    const warn = options.onWarning || ((message: string) => console.warn(`Live league configs: ${message}`));
    const kinds = csvs.map((rows) => getLiveLeagueCsvKind(rows || []));

    // Legacy files only: nothing to expand
    if (!kinds.some((kind) => kind !== 'rows')) return csvs.flatMap((rows) => rows || []) as LeagueConfigInfo[];

    const templates = new Map<string, Map<string, LiveLeagueCsvRow>>();
    const leagues = new Map<string, { name: string; template: string }>();
    csvs.forEach((rows, i) => {
        if (kinds[i] === 'templates') {
            for (const row of rows) {
                const template = str(row.template).trim();
                const typeId = str(row.typeId).trim();
                if (!template || !typeId) continue;
                let templateRows = templates.get(template);
                if (!templateRows) templates.set(template, (templateRows = new Map()));
                if (templateRows.has(typeId)) warn(`template ${template} has typeId ${typeId} more than once`);
                templateRows.set(typeId, row);
            }
        } else if (kinds[i] === 'leagues') {
            for (const row of rows) {
                const sportId = str(row.sportId).trim();
                if (!sportId) continue;
                if (leagues.has(sportId)) warn(`league ${sportId} is listed more than once, the last one is used`);
                leagues.set(sportId, { name: str(row.name), template: str(row.template).trim() });
            }
        }
    });

    // Overrides: rows of the row files whose league is templated, by sportId and typeId, in file order
    const overrides = new Map<string, Map<string, LiveLeagueCsvRow>>();
    csvs.forEach((rows, i) => {
        if (kinds[i] !== 'rows') return;
        for (const row of rows) {
            const sportId = str(row.sportId).trim();
            if (!leagues.has(sportId)) continue;
            const typeId = str(row.typeId).trim();
            let leagueOverrides = overrides.get(sportId);
            if (!leagueOverrides) overrides.set(sportId, (leagueOverrides = new Map()));
            if (leagueOverrides.has(typeId)) warn(`league ${sportId} overrides typeId ${typeId} more than once`);
            leagueOverrides.set(typeId, row);
        }
    });

    const expandLeague = (sportId: string, league: { name: string; template: string }) => {
        const templateRows = league.template ? templates.get(league.template) : new Map<string, LiveLeagueCsvRow>();
        if (!templateRows) {
            warn(`league ${sportId} (${league.name}) uses unknown template ${league.template}, league skipped`);
            return [];
        }
        const leagueOverrides = overrides.get(sportId) || new Map<string, LiveLeagueCsvRow>();
        const expanded: (LeagueConfigInfo & { name: string })[] = [];
        for (const [typeId, templateRow] of templateRows) {
            const row = leagueOverrides.get(typeId) || templateRow;
            if (str(row.enabled).trim() !== LIVE_LEAGUE_CONFIG_REMOVED)
                expanded.push(toLeagueConfigRow(league.name, sportId, row));
        }
        for (const [typeId, row] of leagueOverrides) {
            if (!templateRows.has(typeId) && str(row.enabled).trim() !== LIVE_LEAGUE_CONFIG_REMOVED)
                expanded.push(toLeagueConfigRow(league.name, sportId, row));
        }
        return expanded;
    };

    const result: (LeagueConfigInfo & { name?: string })[] = [];
    const listed = new Set<string>();
    csvs.forEach((rows, i) => {
        if (kinds[i] === 'leagues') {
            for (const row of rows) {
                const sportId = str(row.sportId).trim();
                if (!sportId || listed.has(sportId)) continue;
                listed.add(sportId);
                result.push(...expandLeague(sportId, leagues.get(sportId) as { name: string; template: string }));
            }
        } else if (kinds[i] === 'rows') {
            for (const row of rows) {
                if (!leagues.has(str(row.sportId).trim())) result.push(row as unknown as LeagueConfigInfo);
            }
        }
    });
    return result;
};
