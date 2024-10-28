import { LeagueMap } from '../constants/sports';
import { League, Sport } from '../enums/sports';
import { LeagueInfo } from '../types/sports';

export const getLeagueSport = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.sport : Sport.EMPTY;
};

export const getLeagueLabel = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.label : '';
};

export const getLeagueProvider = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.provider : '';
};

export const getLeagueIsDrawAvailable = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.isDrawAvailable : false;
};

export const getLiveSupportedLeagues = (leagueMap: LeagueInfo[]) => {
    return leagueMap.filter((leagueInfo) => leagueInfo.enabled === 'true').map((league) => Number(league.sportId));
};
export const getBetTypesForLeague = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter((leagueInfo) => Number(leagueInfo.sportId) === Number(league) && leagueInfo.enabled === 'true')
        .map((leagueInfo) => leagueInfo.marketName);

    return betTypes;
};

export const getLeagueInfo = (league: League, leagueMap: LeagueInfo[]) => {
    const leagueInfos = leagueMap.filter((leagueInfo) => Number(leagueInfo.sportId) === league);
    return leagueInfos;
};

export const getLeagueOpticOddsName = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.opticOddsName : undefined;
};

export const getLeaguePeriodType = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.periodType : '';
};

export const getLeagueSpreadTypes = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Spread' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};

export const getLeagueTotalTypes = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Total' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};
