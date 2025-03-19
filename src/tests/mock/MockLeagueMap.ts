import { LeagueConfigInfo } from '../../types/sports';

const baseLeagueInfo: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Moneyline',
    typeId: 0,
    type: 'moneyline',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const spreadMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Goal Spread',
    typeId: 10001,
    type: 'Spread',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const totalMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Total Goals',
    typeId: 10002,
    type: 'Total',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const childMoneylineMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: '1st Half Moneyline',
    typeId: 10022,
    type: 'Moneyline',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const baseDiffSportId: LeagueConfigInfo = {
    ...baseLeagueInfo,
    sportId: 4,
};

// Mock Variants
const leagueInfoOnlyParent: LeagueConfigInfo[] = [baseLeagueInfo];
const leagueInfoOnlyParentWithSpreadAdded: LeagueConfigInfo[] = [{ ...baseLeagueInfo, addedSpread: 3 }];
const leagueInfoOnlyParentDiffSportId: LeagueConfigInfo[] = [baseDiffSportId];

const leagueInfoMockDisabledChilds: LeagueConfigInfo[] = [
    baseLeagueInfo,
    { ...spreadMock, enabled: 'false' },
    { ...totalMock, enabled: 'false' },
];

const leagueInfoEnabledSpreadDisabledTotals: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    { ...totalMock, enabled: 'false' },
];

const leagueInfoEnabledSpeadAndTotals: LeagueConfigInfo[] = [baseLeagueInfo, spreadMock, totalMock];
const leagueInfoEnabledAll: LeagueConfigInfo[] = [baseLeagueInfo, spreadMock, totalMock, childMoneylineMock];

// Grouped Exports
export const LeagueMocks = {
    leagueInfoOnlyParent,
    leagueInfoOnlyParentWithSpreadAdded,
    leagueInfoOnlyParentDiffSportId,
    leagueInfoMockDisabledChilds,
    leagueInfoEnabledSpreadDisabledTotals,
    leagueInfoEnabledSpeadAndTotals,
    leagueInfoEnabledAll,
};
