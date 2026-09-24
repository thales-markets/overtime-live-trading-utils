import { VENDOR_ODDS_PAPI, VENDOR_OPTIC_ODDS } from '../../constants/oddsVendors';
import { BookmakersConfig, MarketVendorIndex } from '../../types/bookmakers';
import { LeagueConfigInfo } from '../../types/sports';
import {
    buildMarketVendorIndex,
    resolveLeagueVendorRouting,
    resolveVendorForBookmaker,
    stripVendorSuffixFromRow,
} from '../../utils/oddsVendorRouting';

const toVendorLists = (entries: [string, string][]): Map<string, string[]> => {
    const lists = new Map<string, string[]>();
    entries.forEach(([name, vendor]) => lists.set(name, [...(lists.get(name) || []), vendor]));
    return lists;
};

const buildIndex = ({
    sportDefault = [],
    marketOverrides = [],
}: {
    sportDefault?: [number, [string, string][]][];
    marketOverrides?: [string, [string, string][]][];
} = {}): MarketVendorIndex => ({
    sportDefaultVendorByBookmaker: new Map(sportDefault.map(([sportId, entries]) => [sportId, toVendorLists(entries)])),
    marketVendorByBookmaker: new Map(marketOverrides.map(([key, entries]) => [key, toVendorLists(entries)])),
});

describe('Check odds vendor router', () => {
    describe('resolveVendorForBookmaker', () => {
        it('defaults to OpticOdds when there is no vendor info at all for the bookmaker', () => {
            const index = buildIndex();
            expect(resolveVendorForBookmaker(11, '0', 'draftkings', index)).toBe(VENDOR_OPTIC_ODDS);
        });

        it('falls through to the sport default when no market override exists', () => {
            const index = buildIndex({ sportDefault: [[11, [['draftkings', VENDOR_OPTIC_ODDS]]]] });
            expect(resolveVendorForBookmaker(11, '10001', 'draftkings', index)).toBe(VENDOR_OPTIC_ODDS);
        });

        it('uses the market override instead of the sport default when present', () => {
            // GIVEN a sport default routing pinnacle to OpticOdds, but a market override routing it to OddsPapi
            const index = buildIndex({
                sportDefault: [[11, [['pinnacle', VENDOR_OPTIC_ODDS]]]],
                marketOverrides: [['11:10001', [['pinnacle', VENDOR_ODDS_PAPI]]]],
            });

            // THEN the override applies only to its own market; the other market still uses the sport default
            expect(resolveVendorForBookmaker(11, '10001', 'pinnacle', index)).toBe(VENDOR_ODDS_PAPI);
            expect(resolveVendorForBookmaker(11, '0', 'pinnacle', index)).toBe(VENDOR_OPTIC_ODDS);
        });

        it('defaults to OpticOdds when the kill switch is enabled, even with a matching override', () => {
            const index = buildIndex({ sportDefault: [[11, [['pinnacle', VENDOR_ODDS_PAPI]]]] });

            expect(resolveVendorForBookmaker(11, '0', 'pinnacle', index, true)).toBe(VENDOR_OPTIC_ODDS);
        });
    });

    describe('resolveLeagueVendorRouting', () => {
        const bookmakersData: BookmakersConfig[] = [
            {
                sportName: '',
                sportId: 156,
                primaryBookmaker: 'pinnacle',
                secondaryBookmaker: '',
                tertiaryBookmaker: '',
            },
        ];
        const backupLiveOddsProviders = ['draftkings'];

        it('splits the same bookmaker across two markets of one league between vendors', () => {
            // GIVEN one league with two enabled markets, both defaulting to the sport-level bookmaker "pinnacle":
            // Moneyline has no override (stays OpticOdds via the sport default), Total Games overrides pinnacle to OddsPapi
            const leaguesData: LeagueConfigInfo[] = [
                { sportId: '156', typeId: '0', marketName: 'Moneyline', enabled: 'true' } as LeagueConfigInfo,
                { sportId: '156', typeId: '10002', marketName: 'Total Games', enabled: 'true' } as LeagueConfigInfo,
            ];
            const index = buildIndex({
                sportDefault: [[156, [['pinnacle', VENDOR_OPTIC_ODDS]]]],
                marketOverrides: [['156:10002', [['pinnacle', VENDOR_ODDS_PAPI]]]],
            });

            // WHEN resolving vendor routing for the whole league
            const { opticOddsBookmakers, oddsPapiBookmakers, opticOddsPairSet, oddsPapiPairSet } =
                resolveLeagueVendorRouting(156, leaguesData, bookmakersData, index, backupLiveOddsProviders);

            // THEN pinnacle is a bookmaker for BOTH vendors' subscriptions (needed on both markets)...
            expect(opticOddsBookmakers).toEqual(['pinnacle']);
            expect(oddsPapiBookmakers).toEqual(['pinnacle']);
            // ...but the pair sets correctly scope it to exactly one vendor per market
            expect(opticOddsPairSet.has('moneyline:pinnacle')).toBe(true);
            expect(opticOddsPairSet.has('total games:pinnacle')).toBe(false);
            expect(oddsPapiPairSet.has('total games:pinnacle')).toBe(true);
            expect(oddsPapiPairSet.has('moneyline:pinnacle')).toBe(false);
        });

        it('skips disabled market rows', () => {
            const leaguesData: LeagueConfigInfo[] = [
                { sportId: '156', typeId: '0', marketName: 'Moneyline', enabled: 'false' } as LeagueConfigInfo,
            ];
            const index = buildIndex({ sportDefault: [[156, [['pinnacle', VENDOR_ODDS_PAPI]]]] });

            const { opticOddsBookmakers, oddsPapiBookmakers } = resolveLeagueVendorRouting(
                156,
                leaguesData,
                bookmakersData,
                index,
                backupLiveOddsProviders
            );

            expect(opticOddsBookmakers).toEqual([]);
            expect(oddsPapiBookmakers).toEqual([]);
        });

        it('defaults to OpticOdds for the whole league when marketVendorIndex is missing (no vendor info at all)', () => {
            // Regression guard: an absent/empty vendor index must not mean "no bookmakers" - bookmaker NAME
            // resolution (getBookmakersForTypeId/getBookmakersArray) is independent of vendor routing.
            const leaguesData: LeagueConfigInfo[] = [
                { sportId: '156', typeId: '0', marketName: 'Moneyline', enabled: 'true' } as LeagueConfigInfo,
            ];

            const { opticOddsBookmakers, oddsPapiBookmakers } = resolveLeagueVendorRouting(
                156,
                leaguesData,
                bookmakersData,
                undefined,
                backupLiveOddsProviders
            );

            expect(opticOddsBookmakers).toEqual(['pinnacle']);
            expect(oddsPapiBookmakers).toEqual([]);
        });
    });

    describe('buildMarketVendorIndex', () => {
        it('records the vendor suffix from bookmakers-per-sport rows as the sport default', () => {
            // GIVEN a bookmakers-per-sport row with an OddsPapi-suffixed primary bookmaker and a plain secondary one
            const bookmakersData: BookmakersConfig[] = [
                {
                    sportName: '',
                    sportId: 11,
                    primaryBookmaker: 'pinnacle oddspapi',
                    secondaryBookmaker: 'draftkings',
                    tertiaryBookmaker: '',
                },
            ];

            const index = buildMarketVendorIndex(bookmakersData, []);

            const sport11Defaults = index.sportDefaultVendorByBookmaker.get(11);
            expect(sport11Defaults?.get('pinnacle')).toEqual([VENDOR_ODDS_PAPI]);
            expect(sport11Defaults?.get('draftkings')).toEqual([VENDOR_OPTIC_ODDS]);
        });

        it('records a market row override, matching case-insensitively', () => {
            // GIVEN a leagues-data (per-market) row with an OddsPapi-suffixed bookmaker override
            const leaguesData = [
                {
                    sportId: '12',
                    typeId: '0',
                    primaryBookmaker: 'bovada ODDSPAPI',
                    secondaryBookmaker: '',
                    tertiaryBookmaker: '',
                },
            ] as unknown as LeagueConfigInfo[];

            const index = buildMarketVendorIndex([], leaguesData);

            const sport12MarketOverride = index.marketVendorByBookmaker.get('12:0');
            expect(sport12MarketOverride?.get('bovada')).toEqual([VENDOR_ODDS_PAPI]);
        });

        it('leaves a market row without a bookmaker override absent from marketVendorByBookmaker', () => {
            // GIVEN a sport default and a market row for the same sport with no bookmaker override at all
            const bookmakersData: BookmakersConfig[] = [
                {
                    sportName: '',
                    sportId: 11,
                    primaryBookmaker: 'pinnacle oddspapi',
                    secondaryBookmaker: '',
                    tertiaryBookmaker: '',
                },
            ];
            const leaguesData = [
                { sportId: '11', typeId: '10001', primaryBookmaker: '', secondaryBookmaker: '', tertiaryBookmaker: '' },
            ] as unknown as LeagueConfigInfo[];

            const index = buildMarketVendorIndex(bookmakersData, leaguesData);

            // THEN the market row is absent from the override index, so resolution falls through to the sport default
            expect(index.marketVendorByBookmaker.has('11:10001')).toBe(false);
            expect(index.sportDefaultVendorByBookmaker.get(11)?.get('pinnacle')).toEqual([VENDOR_ODDS_PAPI]);
        });
    });

    describe('the same bookmaker under two vendors in one row', () => {
        const leaguesData = [
            {
                sportId: '12',
                typeId: '0',
                marketName: 'Moneyline',
                enabled: 'true',
                primaryBookmaker: 'pinnacle oddspapi',
                secondaryBookmaker: 'pinnacle',
                tertiaryBookmaker: '',
            },
        ] as unknown as LeagueConfigInfo[];

        it('keeps both vendors in the index instead of the last slot overwriting the first', () => {
            const index = buildMarketVendorIndex([], leaguesData);
            expect(index.marketVendorByBookmaker.get('12:0')?.get('pinnacle')).toEqual([
                VENDOR_ODDS_PAPI,
                VENDOR_OPTIC_ODDS,
            ]);
        });

        it('routes the bookmaker to both vendors for that market', () => {
            const index = buildMarketVendorIndex([], leaguesData);
            // the routing sees plain names (vendor suffix stripped), exactly as thales-api passes them
            const stripped = leaguesData.map((row) => stripVendorSuffixFromRow(row));

            const { opticOddsBookmakers, oddsPapiBookmakers, opticOddsPairSet, oddsPapiPairSet } =
                resolveLeagueVendorRouting(12, stripped, [], index, ['draftkings']);

            expect(opticOddsBookmakers).toEqual(['pinnacle']);
            expect(oddsPapiBookmakers).toEqual(['pinnacle']);
            expect(Array.from(opticOddsPairSet)).toEqual(['moneyline:pinnacle']);
            expect(Array.from(oddsPapiPairSet)).toEqual(['moneyline:pinnacle']);
        });
    });

    describe('stripVendorSuffixFromRow', () => {
        it('strips the vendor suffix from every bookmaker field, case-insensitively', () => {
            const row = {
                sportId: 11,
                sportName: '',
                primaryBookmaker: 'pinnacle oddspapi',
                secondaryBookmaker: 'bovada ODDSPAPI',
                tertiaryBookmaker: 'draftkings',
            } as BookmakersConfig;

            expect(stripVendorSuffixFromRow(row)).toEqual({
                sportId: 11,
                sportName: '',
                primaryBookmaker: 'pinnacle',
                secondaryBookmaker: 'bovada',
                tertiaryBookmaker: 'draftkings',
            });
        });

        it('leaves empty bookmaker fields untouched and does not mutate the input row', () => {
            const row = {
                sportId: 11,
                sportName: '',
                primaryBookmaker: '',
                secondaryBookmaker: '',
                tertiaryBookmaker: '',
            } as BookmakersConfig;

            const cleanedRow = stripVendorSuffixFromRow(row);

            expect(cleanedRow).toEqual(row);
            expect(cleanedRow).not.toBe(row);
        });

        it('preserves fields other than the bookmaker columns', () => {
            const row = {
                sportId: '11',
                typeId: '0',
                marketName: 'Moneyline',
                primaryBookmaker: 'pinnacle oddspapi',
            } as unknown as LeagueConfigInfo;

            expect(stripVendorSuffixFromRow(row)).toEqual({
                sportId: '11',
                typeId: '0',
                marketName: 'Moneyline',
                primaryBookmaker: 'pinnacle',
            });
        });
    });
});
