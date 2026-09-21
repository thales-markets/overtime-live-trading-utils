import { VENDOR_ODDS_PAPI, VENDOR_OPTIC_ODDS } from '../constants/oddsVendors';
import { BookmakersConfig, MarketVendorIndex } from '../types/bookmakers';
import { LeagueConfigInfo } from '../types/sports';
import { getBookmakersArray, getBookmakersForTypeId, parseBookmakerCell } from './bookmakers';
import { getLeagueInfo } from './sports';

const BOOKMAKER_FIELDS = ['primaryBookmaker', 'secondaryBookmaker', 'tertiaryBookmaker'] as const;

// Strips the vendor suffix from a risk-management CSV row's bookmaker fields, so every existing consumer of
// bookmakersData/leaguesData (getBookmakersForLeague, getBetTypesForLeague, getLeagueInfo, checkOdds, odds
// history persistence, etc.) keeps seeing plain bookmaker names, unaware vendor routing exists. Overloaded
// (rather than generic) since a row is always either one of these two known CSV shapes - never an arbitrary
// caller-defined type - and each overload returns the same concrete row type it was given.
export function stripVendorSuffixFromRow(row: BookmakersConfig): BookmakersConfig;
export function stripVendorSuffixFromRow(row: LeagueConfigInfo): LeagueConfigInfo;
export function stripVendorSuffixFromRow(
    row: BookmakersConfig | LeagueConfigInfo
): BookmakersConfig | LeagueConfigInfo {
    const cleanedRow = { ...row };

    BOOKMAKER_FIELDS.forEach((field) => {
        const cell = row[field];
        if (!cell) return;
        (cleanedRow as any)[field] = parseBookmakerCell(cell).name;
    });

    return cleanedRow;
}

// Parses a row's bookmaker cells into a Map<bookmakerLower, vendors[]> (primary/secondary/tertiary, stopping at
// the first empty slot - same truncation rule getBookmakersForTypeId applies, so this only ever records
// vendors for bookmakers that function would actually resolve). A bookmaker keeps EVERY vendor it appears
// with in the row ("pinnacle oddspapi" + "pinnacle" -> both): they are different feeds, compared to each other.
const parseBookmakerVendorsForRow = (row: {
    primaryBookmaker?: string;
    secondaryBookmaker?: string;
    tertiaryBookmaker?: string;
}): Map<string, string[]> => {
    const vendorsByBookmaker = new Map<string, string[]>();
    for (const field of BOOKMAKER_FIELDS) {
        const cell = row[field];
        if (!cell) break;
        const { name, vendor } = parseBookmakerCell(cell);
        if (!name) break;
        const vendors = vendorsByBookmaker.get(name.toLowerCase()) || [];
        if (!vendors.includes(vendor)) vendors.push(vendor);
        vendorsByBookmaker.set(name.toLowerCase(), vendors);
    }
    return vendorsByBookmaker;
};

// Builds a pure vendor LOOKUP (not a bookmaker-name resolver - that's still getBookmakersForTypeId/
// getBookmakersArray's job, so name resolution/fallback semantics stay identical) from the RAW (pre-strip)
// CSV rows:
//  - sportDefaultVendorByBookmaker: Map<sportId, Map<bookmakerLower, vendor>> from bookmakers-per-sport rows.
//  - marketVendorByBookmaker: Map<"sportId:typeId", Map<bookmakerLower, vendor>> from leagues-data rows that
//    actually specify a primaryBookmaker (an override). Rows without one are simply absent, so lookup falls
//    through to the sport default, and any bookmaker with no vendor info anywhere defaults to OpticOdds - a
//    market row doesn't *conflict* with the sport default, it *overrides* it when present.
export const buildMarketVendorIndex = (
    rawBookmakersData: BookmakersConfig[],
    rawLeaguesData: LeagueConfigInfo[]
): MarketVendorIndex => {
    const sportDefaultVendorByBookmaker = new Map<number, Map<string, string[]>>();
    rawBookmakersData.forEach((row) => {
        sportDefaultVendorByBookmaker.set(Number(row.sportId), parseBookmakerVendorsForRow(row));
    });

    const marketVendorByBookmaker = new Map<string, Map<string, string[]>>();
    rawLeaguesData.forEach((row) => {
        if (!row.primaryBookmaker) return; // no override on this market row - falls through to sport default
        marketVendorByBookmaker.set(`${Number(row.sportId)}:${row.typeId}`, parseBookmakerVendorsForRow(row));
    });

    return { sportDefaultVendorByBookmaker, marketVendorByBookmaker };
};

// Resolves the vendor for one (sportId, typeId, bookmaker) combination: a market-row override wins when the
// CSV's leagues-data row for that market specifies a vendor for this bookmaker, else the sport-level
// bookmakers-per-sport default, else OpticOdds (the same default phase 1 always used - a bookmaker absent
// from marketVendorIndex entirely, e.g. no CSV row ever carried the "oddspapi" suffix for it, is not an
// OddsPapi signal, it just means "no vendor info" and defaults to OpticOdds).
// A bookmaker configured under several vendors in one row (e.g. "pinnacle oddspapi" + "pinnacle") resolves to
// all of them, so each vendor fetches it and the two feeds can be compared.
export const resolveVendorsForBookmaker = (
    sportId: number | string,
    typeId: number | string,
    bookmakerLower: string,
    marketVendorIndex: MarketVendorIndex | undefined,
    isVendorRoutingDisabled = false
): string[] => {
    if (isVendorRoutingDisabled || !marketVendorIndex) return [VENDOR_OPTIC_ODDS];

    const marketVendors = marketVendorIndex.marketVendorByBookmaker.get(`${Number(sportId)}:${typeId}`);
    if (marketVendors && marketVendors.has(bookmakerLower)) return marketVendors.get(bookmakerLower) as string[];

    return (
        marketVendorIndex.sportDefaultVendorByBookmaker.get(Number(sportId))?.get(bookmakerLower) || [VENDOR_OPTIC_ODDS]
    );
};

// Single-vendor view of resolveVendorsForBookmaker (the first configured vendor), kept for callers that only
// ever deal with one vendor per bookmaker.
export const resolveVendorForBookmaker = (
    sportId: number | string,
    typeId: number | string,
    bookmakerLower: string,
    marketVendorIndex: MarketVendorIndex | undefined,
    isVendorRoutingDisabled = false
): string => resolveVendorsForBookmaker(sportId, typeId, bookmakerLower, marketVendorIndex, isVendorRoutingDisabled)[0];

// Resolves per-market vendor routing for every enabled market row of a league in one pass. Bookmaker NAME
// resolution for each market reuses getBookmakersForTypeId/getBookmakersArray (row override with
// priority-truncation, else the sport default, else backupLiveOddsProviders) so this never diverges from what
// every other consumer of the same CSV rows resolves - only the vendor LABEL for each already-resolved
// bookmaker is new here. Produces:
//  - opticOddsBookmakers/oddsPapiBookmakers: deduplicated bookmaker-name lists (lowercase) for each vendor's
//    REST fetch/WS subscription (union across all markets - a bookmaker can legitimately appear in both when
//    it's OpticOdds-sourced for one market and OddsPapi-sourced for another market of the same league)
//  - opticOddsPairSet/oddsPapiPairSet: Set<"marketNameLower:bookmakerLower"> used to filter each vendor's
//    fetched/streamed odds lines down to only the (market, bookmaker) pairs actually assigned to it, since
//    neither vendor's API can be asked to return only specific (market, bookmaker) combinations - both are
//    over-fetched (by bookmaker+market matrix) then filtered down using these sets.
export const resolveLeagueVendorRouting = (
    leagueId: number | string,
    leaguesData: LeagueConfigInfo[],
    bookmakersData: BookmakersConfig[],
    marketVendorIndex: MarketVendorIndex | undefined,
    backupLiveOddsProviders: string[],
    isVendorRoutingDisabled = false
): {
    opticOddsBookmakers: string[];
    oddsPapiBookmakers: string[];
    opticOddsPairSet: Set<string>;
    oddsPapiPairSet: Set<string>;
} => {
    const opticOddsBookmakers = new Set<string>();
    const oddsPapiBookmakers = new Set<string>();
    const opticOddsPairSet = new Set<string>();
    const oddsPapiPairSet = new Set<string>();

    const leagueInfos = getLeagueInfo(Number(leagueId), leaguesData);
    const sportDefaultBookmakers = getBookmakersArray(bookmakersData, leagueId, backupLiveOddsProviders);

    leagueInfos
        .filter((row) => row.enabled === 'true')
        .forEach((row) => {
            const marketNameLower = (row.marketName || '').toLowerCase();
            const bookmakersForMarket = getBookmakersForTypeId(
                sportDefaultBookmakers,
                leagueInfos,
                Number(row.typeId)
            ).map((b) => b.name);

            bookmakersForMarket.forEach((bookmakerLower) => {
                const vendors = resolveVendorsForBookmaker(
                    leagueId,
                    row.typeId,
                    bookmakerLower,
                    marketVendorIndex,
                    isVendorRoutingDisabled
                );
                const pairKey = `${marketNameLower}:${bookmakerLower}`;
                vendors.forEach((vendor) => {
                    if (vendor === VENDOR_ODDS_PAPI) {
                        oddsPapiBookmakers.add(bookmakerLower);
                        oddsPapiPairSet.add(pairKey);
                    } else {
                        opticOddsBookmakers.add(bookmakerLower);
                        opticOddsPairSet.add(pairKey);
                    }
                });
            });
        });

    return {
        opticOddsBookmakers: Array.from(opticOddsBookmakers),
        oddsPapiBookmakers: Array.from(oddsPapiBookmakers),
        opticOddsPairSet,
        oddsPapiPairSet,
    };
};
