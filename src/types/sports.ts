import { LiveMarketType } from '../enums/sports';

export type LeagueConfigInfo = {
    sportId: number;
    typeId: number;
    marketName: string;
    type: LiveMarketType;
    enabled: string;
    minOdds: number;
    maxOdds: number;
    addedSpread?: number;
    primaryBookmaker?: string;
    secondaryBookmaker?: string;
    percentageDiffForLines?: number;
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
