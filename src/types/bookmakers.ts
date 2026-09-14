export type BookmakersConfig = {
    sportName: string;
    sportId: number;
    primaryBookmaker: string;
    secondaryBookmaker: string;
    tertiaryBookmaker: string;
};

export type BookmakerWithVendor = { name: string; vendor: string };

export interface MarketVendorIndex {
    sportDefaultVendorByBookmaker: Map<number, Map<string, string>>; // bookmakerLower -> vendor
    marketVendorByBookmaker: Map<string, Map<string, string>>; // "sportId:typeId" -> bookmakerLower -> vendor
}
