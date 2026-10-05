export type BookmakersConfig = {
    sportName: string;
    sportId: number;
    primaryBookmaker: string;
    secondaryBookmaker: string;
    tertiaryBookmaker: string;
};

export type BookmakerWithVendor = { name: string; vendor: string };

// Relaxes the last-polled (provider data freshness) check - see getLastPolledInvalidBookmakers. Omitted or
// empty keeps the check on for every configured bookmaker. The options combine: a bookmaker is checked only
// when none of them exempts it.
export type LastPolledCheckConfig = {
    disabled?: boolean; // skip the check entirely
    primaryOnly?: boolean; // check only the primary (first) bookmaker - secondary/tertiary are exempt
    disabledVendors?: string[]; // skip the check for bookmakers routed to these vendors (e.g. "oddspapi")
};

export interface MarketVendorIndex {
    // bookmakerLower -> every vendor it is configured with: the same bookmaker can sit in two slots of one row
    // under different vendors (e.g. primary "pinnacle oddspapi" + secondary "pinnacle")
    sportDefaultVendorByBookmaker: Map<number, Map<string, string[]>>;
    marketVendorByBookmaker: Map<string, Map<string, string[]>>; // "sportId:typeId" -> bookmakerLower -> vendors
}
