import { League } from 'overtime-utils';
import { LeagueConfigInfo } from '../types/sports';

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
    leagueInfoArray
        .filter((leagueInfo) => Number(leagueInfo.sportId) === Number(league) && leagueInfo.enabled === 'true')
        .map((leagueInfo) => uniqueMarketNames.add(leagueInfo.marketName));

    return Array.from(uniqueMarketNames) as string[];
};

export const getLeagueInfo = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const leagueInfos = leagueInfoArray.filter((leagueInfo) => Number(leagueInfo.sportId) === league);
    return leagueInfos;
};

export const getLeagueSpreadTypes = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const betTypes = leagueInfoArray
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Spread' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};

export const getLeagueTotalTypes = (league: League, leagueInfoArray: LeagueConfigInfo[]) => {
    const betTypes = leagueInfoArray
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Total' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};
