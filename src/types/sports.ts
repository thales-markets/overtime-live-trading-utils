import { LiveMarketType } from '../enums/sports';

export type LeagueConfigInfo = {
    sportId: string;
    typeId: string;
    marketName: string;
    type: LiveMarketType;
    enabled: string;
    minOdds: string;
    maxOdds: string;
    addedSpread?: string;
    primaryBookmaker?: string;
    secondaryBookmaker?: string;
    percentageDiffForLines?: string;
};

export type ChildMarket = {
    leagueId: number;
    typeId: number;
    type: string;
    line: number;
    odds: Array<number>;
    playerProps: {
        playerId: number;
        playerName: string;
    };
    isPlayerPropsMarket: boolean;
    positionNames?: string[];
};

export type LastPolledArray = { sportsbook: string; timestamp: number }[];
