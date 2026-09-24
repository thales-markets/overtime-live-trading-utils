export type BookmakersConfig = {
    sportName: string;
    sportId: number;
    primaryBookmaker: string;
    secondaryBookmaker: string;
    tertiaryBookmaker: string;
};

export type BookmakerWithVendor = { name: string; vendor: string };

export interface MarketVendorIndex {
    // bookmakerLower -> every vendor it is configured with: the same bookmaker can sit in two slots of one row
    // under different vendors (e.g. primary "pinnacle oddspapi" + secondary "pinnacle")
    sportDefaultVendorByBookmaker: Map<number, Map<string, string[]>>;
    marketVendorByBookmaker: Map<string, Map<string, string[]>>; // "sportId:typeId" -> bookmakerLower -> vendors
}
