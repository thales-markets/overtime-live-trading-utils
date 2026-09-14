import { VENDOR_ODDS_PAPI, VENDOR_OPTIC_ODDS } from '../constants/oddsVendors';
import { BookmakersConfig, MarketVendorIndex } from '../types/bookmakers';
import { LeagueConfigInfo } from '../types/sports';
import { getBookmakersArray, getBookmakersForTypeId, parseBookmakerCell } from './bookmakers';
import { getLeagueInfo } from './sports';

const BOOKMAKER_FIELDS = ['primaryBookmaker', 'secondaryBookmaker', 'tertiaryBookmaker'] as const;

// Parses a row's bookmaker cells into a Map<bookmakerLower, vendor> (primary/secondary/tertiary, stopping at
// the first empty slot - same truncation rule getBookmakersForTypeId applies, so this only ever records
// vendors for bookmakers that function would actually resolve).
const parseBookmakerVendorsForRow = (row: {
    primaryBookmaker?: string;
    secondaryBookmaker?: string;
    tertiaryBookmaker?: string;
}): Map<string, string> => {
    const vendorByBookmaker = new Map<string, string>();
    for (const field of BOOKMAKER_FIELDS) {
        const cell = row[field];
        if (!cell) break;
        const { name, vendor } = parseBookmakerCell(cell);
        if (!name) break;
        vendorByBookmaker.set(name.toLowerCase(), vendor);
    }
    return vendorByBookmaker;
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
    const sportDefaultVendorByBookmaker = new Map<number, Map<string, string>>();
    rawBookmakersData.forEach((row) => {
        sportDefaultVendorByBookmaker.set(Number(row.sportId), parseBookmakerVendorsForRow(row));
    });

    const marketVendorByBookmaker = new Map<string, Map<string, string>>();
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
export const resolveVendorForBookmaker = (
    sportId: number | string,
    typeId: number | string,
    bookmakerLower: string,
    marketVendorIndex: MarketVendorIndex | undefined,
    isVendorRoutingDisabled = false
): string => {
    if (isVendorRoutingDisabled || !marketVendorIndex) return VENDOR_OPTIC_ODDS;

    const marketVendors = marketVendorIndex.marketVendorByBookmaker.get(`${Number(sportId)}:${typeId}`);
    if (marketVendors && marketVendors.has(bookmakerLower)) return marketVendors.get(bookmakerLower) as string;

    return (
        marketVendorIndex.sportDefaultVendorByBookmaker.get(Number(sportId))?.get(bookmakerLower) || VENDOR_OPTIC_ODDS
    );
};

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
                const vendor = resolveVendorForBookmaker(
                    leagueId,
                    row.typeId,
                    bookmakerLower,
                    marketVendorIndex,
                    isVendorRoutingDisabled
                );
                const pairKey = `${marketNameLower}:${bookmakerLower}`;
                if (vendor === VENDOR_ODDS_PAPI) {
                    oddsPapiBookmakers.add(bookmakerLower);
                    oddsPapiPairSet.add(pairKey);
                } else {
                    opticOddsBookmakers.add(bookmakerLower);
                    opticOddsPairSet.add(pairKey);
                }
            });
        });

    return {
        opticOddsBookmakers: Array.from(opticOddsBookmakers),
        oddsPapiBookmakers: Array.from(oddsPapiBookmakers),
        opticOddsPairSet,
        oddsPapiPairSet,
    };
};
