import { LeagueInfo } from '../../../types/sports';

const baseLeagueInfo: LeagueInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Moneyline',
    typeId: 0,
    type: 'moneyline',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const spreadMock: LeagueInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Goal Spread',
    typeId: 10001,
    type: 'Spread',
    maxOdds: 0,
    minOdds: 0,
};

const totalMock: LeagueInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Total Goals',
    typeId: 10002,
    type: 'Total',
    maxOdds: 0,
    minOdds: 0,
};

const baseDiffSportId: LeagueInfo = {
    ...baseLeagueInfo,
    sportId: 4,
};

// Mock Variants
const leagueInfoOnlyParent: LeagueInfo[] = [baseLeagueInfo];
const leagueInfoOnlyParentDiffSportId: LeagueInfo[] = [baseDiffSportId];

const leagueInfoMockDisabledChilds: LeagueInfo[] = [
    baseLeagueInfo,
    { ...spreadMock, enabled: 'false' },
    { ...totalMock, enabled: 'false' },
];

const leagueInfoEnabledSpreadDisabledTotals: LeagueInfo[] = [
    baseLeagueInfo,
    spreadMock,
    { ...totalMock, enabled: 'false' },
];

const leagueInfoEnabledSpeadAndTotals: LeagueInfo[] = [baseLeagueInfo, spreadMock, totalMock];

// Grouped Exports
export const LeagueMocks = {
    leagueInfoOnlyParent,
    leagueInfoOnlyParentDiffSportId,
    leagueInfoMockDisabledChilds,
    leagueInfoEnabledSpreadDisabledTotals,
    leagueInfoEnabledSpeadAndTotals,
};
