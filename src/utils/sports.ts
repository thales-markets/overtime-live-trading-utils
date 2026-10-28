import { League } from 'overtime-utils';
import { LeagueConfigInfo } from '../types/sports';

// League rows grouped by sportId, per config array. The config is a fresh array on every refresh and called with the
// same one many times per processing loop (per league, market and odds vendor), so indexing it once replaces a scan
// of the whole config on every call. A config array mutated in place after its first lookup isn't seen.
const leagueInfosBySportIdCache = new WeakMap<LeagueConfigInfo[], Map<number, LeagueConfigInfo[]>>();

const getLeagueInfosBySportId = (leagueInfoArray: LeagueConfigInfo[]) => {
    let leagueInfosBySportId = leagueInfosBySportIdCache.get(leagueInfoArray);
    if (!leagueInfosBySportId) {
        leagueInfosBySportId = new Map();
        for (const leagueInfo of leagueInfoArray) {
            const sportId = Number(leagueInfo.sportId);
            if (Number.isNaN(sportId)) continue; // never equal to any league, NaN included
            const leagueInfos = leagueInfosBySportId.get(sportId);
            if (leagueInfos) leagueInfos.push(leagueInfo);
            else leagueInfosBySportId.set(sportId, [leagueInfo]);
        }
        leagueInfosBySportIdCache.set(leagueInfoArray, leagueInfosBySportId);
    }
    return leagueInfosBySportId;
};

// The cached rows themselves, for read-only use within this module
const getCachedLeagueInfos = (league: number, leagueInfoArray: LeagueConfigInfo[]) =>
    getLeagueInfosBySportId(leagueInfoArray).get(league) || [];

// Methods are using data from live-markets-map.csv
export const getLiveSupportedLeagues = (leagueInfoArray: LeagueConfigInfo[]) => {
    const uniqueId = new Set<number>();
    leagueInfoArray
        .filter((leagueInfo) => leagueInfo.enabled === 'true')
        .map((league) => uniqueId.add(Number(league.sportId)));
    return Array.from(uniqueId);
};

export const getBetTypesForLeague = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const uniqueMarketNames = new Set();
    getCachedLeagueInfos(Number(league), leagueInfoArray)
        .filter((leagueInfo) => leagueInfo.enabled === 'true')
        .map((leagueInfo) => uniqueMarketNames.add(leagueInfo.marketName));

    return Array.from(uniqueMarketNames) as string[];
};

export const getLeagueInfo = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    // a copy, as callers may modify the returned array
    return [...getCachedLeagueInfos(league, leagueInfoArray)];
};

const leagueInfoByMarketNameCache = new WeakMap<LeagueConfigInfo[], Map<string, LeagueConfigInfo>>();

// League rows of one league by lowercase market name, the first one for a repeated name (as .find() would), for
// lookups per odds line. Cached per array, so e.g. filterOdds and checkOdds called with the same leagueInfos share it.
export const getLeagueInfoByMarketName = (leagueInfos: LeagueConfigInfo[]) => {
    let leagueInfoByMarketName = leagueInfoByMarketNameCache.get(leagueInfos);
    if (!leagueInfoByMarketName) {
        leagueInfoByMarketName = new Map();
        for (const leagueInfo of leagueInfos) {
            const marketName = leagueInfo.marketName.toLowerCase();
            if (!leagueInfoByMarketName.has(marketName)) leagueInfoByMarketName.set(marketName, leagueInfo);
        }
        leagueInfoByMarketNameCache.set(leagueInfos, leagueInfoByMarketName);
    }
    return leagueInfoByMarketName;
};

export const getLeagueSpreadTypes = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const betTypes = getCachedLeagueInfos(Number(league), leagueInfoArray)
        .filter((leagueInfo) => leagueInfo.type === 'Spread' && leagueInfo.enabled === 'true')
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};

export const getLeagueTotalTypes = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const betTypes = getCachedLeagueInfos(Number(league), leagueInfoArray)
        .filter((leagueInfo) => leagueInfo.type === 'Total' && leagueInfo.enabled === 'true')
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};
