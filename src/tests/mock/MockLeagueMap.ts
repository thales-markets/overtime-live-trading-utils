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

const baseLeagueInfoNba: LeagueConfigInfo = {
    sportId: 4,
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

const doubleChanceMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Double Chance',
    typeId: 10003,
    type: 'Double Chance',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const correctScoreMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Correct Score',
    typeId: 10100,
    type: 'Correct Score',
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

const bothTeamsToScoreMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Both Teams To Score',
    typeId: 10009,
    type: 'Both Teams To Score',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const bothTeamsToScoreMock1stHalf: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: '1st Half Both Teams To Score',
    typeId: 10101,
    type: 'Both Teams To Score',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const bothTeamsToScoreMock2ndHalf: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: '2nd Half Both Teams To Score',
    typeId: 10102,
    type: 'Both Teams To Score',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const drawNoBetMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Draw No Bet',
    typeId: 10010,
    type: 'Moneyline',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const willThereBeOvertime: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Will There Be Overtime',
    typeId: 10131,
    type: 'Both Teams To Score',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const teamTotal: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Team Total',
    typeId: 10017,
    type: 'Total',
    maxOdds: 0.25,
    minOdds: 0.75,
    primaryBookmaker: 'draftkings',
};

const PlayerAssist: LeagueConfigInfo[] = [
    baseLeagueInfoNba,
    {
        sportId: 4,
        enabled: 'true',
        marketName: 'Player Assists',
        typeId: 11039,
        type: 'Total',
        maxOdds: 0.25,
        minOdds: 0.75,
        primaryBookmaker: 'superbet',
    },
];

const PlayerAssistWithSecondaryBookmaker: LeagueConfigInfo[] = [
    baseLeagueInfoNba,
    {
        sportId: 4,
        enabled: 'true',
        marketName: 'Player Assists',
        typeId: 11039,
        type: 'Total',
        maxOdds: 0.25,
        minOdds: 0.75,
        primaryBookmaker: 'superbet',
        secondaryBookmaker: 'draftkings',
    },
];

const teamTotal2: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Team Total',
    typeId: 10018,
    type: 'Total',
    maxOdds: 0.25,
    minOdds: 0.75,
    primaryBookmaker: 'draftkings',
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
    { ...doubleChanceMock, enabled: 'false' },
    { ...correctScoreMock, enabled: 'false' },
];

const leagueInfoEnabledSpreadDisabledTotals: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    { ...totalMock, enabled: 'false' },
];

const leagueInfoDisabledCorrectScoreAndDoubleChance: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    totalMock,
    { ...doubleChanceMock, enabled: 'false' },
    { ...correctScoreMock, enabled: 'false' },
];

const leagueInfoEnabledSpeadAndTotals: LeagueConfigInfo[] = [baseLeagueInfo, spreadMock, totalMock];
const leagueInfoEnabledAll: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    totalMock,
    childMoneylineMock,
    doubleChanceMock,
    correctScoreMock,
    bothTeamsToScoreMock,
    bothTeamsToScoreMock1stHalf,
    bothTeamsToScoreMock2ndHalf,
    drawNoBetMock,
    willThereBeOvertime,
    teamTotal,
    teamTotal2,
];

const leaguInfoDifferentPrimaryBookmaker: LeagueConfigInfo[] = [
    baseLeagueInfo,
    { ...spreadMock, primaryBookmaker: 'draftkings' },
];

// Grouped Exports
export const LeagueMocks = {
    leagueInfoOnlyParent,
    leagueInfoOnlyParentWithSpreadAdded,
    leagueInfoOnlyParentDiffSportId,
    leagueInfoMockDisabledChilds,
    leagueInfoEnabledSpreadDisabledTotals,
    leagueInfoEnabledSpeadAndTotals,
    leagueInfoEnabledAll,
    leagueInfoDisabledCorrectScoreAndDoubleChance,
    leaguInfoDifferentPrimaryBookmaker,
    PlayerAssist,
    PlayerAssistWithSecondaryBookmaker,
};
