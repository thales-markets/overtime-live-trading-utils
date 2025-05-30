
export type LeagueConfigInfo = {
    sportId: number;
    typeId: number;
    marketName: string;
    type: string;
    enabled: string;
    minOdds: number;
    maxOdds: number;
    addedSpread?: number;
};

export type ChildMarket = {
    leagueId: number;
    typeId: number;
    type: string;
    line: number;
    odds: Array<number>;
};
