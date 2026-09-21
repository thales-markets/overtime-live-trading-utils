import { DIFF_BETWEEN_BOOKMAKERS_MESSAGE, NO_MATCHING_BOOKMAKERS_MESSAGE } from '../../constants/errors';
import { LiveMarketType } from '../../enums/sports';
import { LeagueConfigInfo } from '../../types/sports';
import { checkOdds } from '../../utils/bookmakers';
import { processMarket } from '../../utils/markets';
import { filterOdds } from '../../utils/odds';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsGoodOdds,
    MockOddsChildMarketsOddsCut,
    MockOnlyMoneyline,
    MockOpticSoccer,
    MockOpticSoccerOneSidePlayerProps,
    MockZeroOdds,
} from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import {
    getLastPolledDataForBookmakers,
    getPlayersMap,
    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
} from '../utils/helper';

const lastPolledData = getLastPolledDataForBookmakers();
const playersMap = getPlayersMap();

describe('Odds', () => {
    it('Should return odds for moneyline', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(true);
    });

    it('Should return zero odds for moneyline', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockZeroOdds));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasZeros = market.odds.some(
            (odd: any) => odd.american === 0 || odd.decimal === 0 || odd.normalizedImplied === 0
        );

        expect(hasZeros).toBe(true);
    });

    it('Should contain child markets for good odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsGoodOdds));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasChildMarkets = market.childMarkets.length > 0;
        expect(hasChildMarkets).toBe(true);
    });

    it('Should return empty array for child child markets after odds cut', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsOddsCut));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        expect(market.childMarkets).toHaveLength(0);
    });

    it('Should return appropriate double chance odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledDoubleChance,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const doubleChanceTypeIds = LeagueMocks.leagueInfoEnabledDoubleChance.map((info) => Number(info.typeId));
        const doubleChanceMarkets = market.childMarkets.filter((childMarket: any) =>
            doubleChanceTypeIds.includes(childMarket.typeId)
        );

        expect(doubleChanceMarkets).toHaveLength(2);

        LeagueMocks.leagueInfoEnabledDoubleChance.forEach((info) => {
            const actualMarketOdds = doubleChanceMarkets
                .find((childMarket: any) => childMarket.typeId === Number(info.typeId))
                ?.odds.map((odd: any) => odd.decimal);

            const expectedMarketOdds = freshMockOpticSoccer.odds
                .filter((odd: any) => odd.market === info.marketName)
                .map((odd: any) => odd.price);

            expect(actualMarketOdds).toHaveLength(3);
            expect(actualMarketOdds[0]).toBe(expectedMarketOdds[0]);
            expect(actualMarketOdds[1]).toBe(expectedMarketOdds[1]);
            expect(actualMarketOdds[2]).toBe(expectedMarketOdds[2]);
        });
    });

    it('Should return appropriate odd/even odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const oddEvenMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === 10081);

        expect(oddEvenMarket).toBeDefined();
        // odds order is [odd, even]
        const expectedOddPrice = freshMockOpticSoccer.odds.find(
            (odd: any) => odd.market === '1st Half Total Goals Odd/Even' && odd.selection === 'Odd'
        ).price;
        const expectedEvenPrice = freshMockOpticSoccer.odds.find(
            (odd: any) => odd.market === '1st Half Total Goals Odd/Even' && odd.selection === 'Even'
        ).price;

        expect(oddEvenMarket.odds).toHaveLength(2);
        expect(oddEvenMarket.odds[0].decimal).toBe(expectedOddPrice);
        expect(oddEvenMarket.odds[1].decimal).toBe(expectedEvenPrice);
    });

    it('Should return appropriate team total odd/even odds per team', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const homeTeam = freshMockOpticSoccer.home_team_display;
        const awayTeam = freshMockOpticSoccer.away_team_display;

        // home team market keeps the configured typeId, away team market typeId is increased by 1
        [
            { typeId: 10139, team: homeTeam },
            { typeId: 10140, team: awayTeam },
        ].forEach(({ typeId, team }) => {
            const teamOddEvenMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === typeId);

            expect(teamOddEvenMarket).toBeDefined();

            // odds order is [odd, even]
            const expectedOddPrice = freshMockOpticSoccer.odds.find(
                (odd: any) =>
                    odd.market === 'Team Total Odd/Even' && odd.selection === team && odd.selection_line === 'odd'
            ).price;
            const expectedEvenPrice = freshMockOpticSoccer.odds.find(
                (odd: any) =>
                    odd.market === 'Team Total Odd/Even' && odd.selection === team && odd.selection_line === 'even'
            ).price;

            expect(teamOddEvenMarket.odds).toHaveLength(2);
            expect(teamOddEvenMarket.odds[0].decimal).toBeCloseTo(expectedOddPrice, 8);
            expect(teamOddEvenMarket.odds[1].decimal).toBeCloseTo(expectedEvenPrice, 8);
        });
    });

    it('Should return appropriate halftime/fulltime odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const halftimeFulltimeMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === 10040);

        expect(halftimeFulltimeMarket).toBeDefined();
        expect(halftimeFulltimeMarket.odds).toHaveLength(9);

        // odds are in fixed position order: halftimeOutcomeIndex * 3 + fulltimeOutcomeIndex, outcomes are [home, away, draw]
        const homeTeam = freshMockOpticSoccer.home_team_display;
        const awayTeam = freshMockOpticSoccer.away_team_display;
        const outcomes = [homeTeam, awayTeam, 'Draw'];
        const expectedSelections = outcomes.flatMap((halftime) =>
            outcomes.map((fulltime) => `${halftime} :: ${fulltime}`)
        );

        expectedSelections.forEach((selection, position) => {
            const expectedPrice = freshMockOpticSoccer.odds.find(
                (odd: any) => odd.market === 'Halftime / Fulltime' && odd.selection === selection
            ).price;
            expect(halftimeFulltimeMarket.odds[position].decimal).toBeCloseTo(expectedPrice, 8);
        });
    });

    it('Should return appropriate one side player props odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccerOneSidePlayerProps));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const cardReceiverMarkets = market.childMarkets.filter((childMarket: any) => childMarket.typeId === 11234);
        const scoreOrAssistMarkets = market.childMarkets.filter((childMarket: any) => childMarket.typeId === 11303);

        // player with ID not present in playersMap is filtered out
        expect(cardReceiverMarkets).toHaveLength(2);
        expect(scoreOrAssistMarkets).toHaveLength(2);

        [...cardReceiverMarkets, ...scoreOrAssistMarkets].forEach((playerPropsMarket: any) => {
            const expectedOdd = freshMockOpticSoccer.odds.find(
                (odd: any) => odd.selection === playerPropsMarket.playerProps.playerName
            );

            expect(playerPropsMarket.isPlayerPropsMarket).toBe(true);
            expect(playerPropsMarket.playerProps.playerId).toBe(playersMap.get(expectedOdd.player_id));
            expect(playerPropsMarket.odds).toHaveLength(1);
            expect(playerPropsMarket.odds[0].decimal).toBe(expectedOdd.price);
        });
    });

    describe('same bookmaker from two vendors', () => {
        const info = (primaryBookmaker: string, secondaryBookmaker: string): LeagueConfigInfo[] => [
            {
                sportId: '153',
                enabled: 'true',
                marketName: 'Moneyline',
                typeId: '0',
                type: LiveMarketType.MONEYLINE,
                maxOdds: '0.25',
                minOdds: '0.75',
                primaryBookmaker,
                secondaryBookmaker,
            },
        ];
        const line = (vendor: string | undefined, selection: string, price: number) =>
            ({
                sportsBookName: 'Pinnacle',
                marketName: 'moneyline',
                selection,
                selectionLine: null,
                price,
                points: 0,
                isMain: true,
                playerId: null,
                vendor,
            }) as any;
        const polled = [
            { sportsbook: 'pinnacle', timestamp: Date.now() },
            { sportsbook: 'pinnacle', timestamp: Date.now(), vendor: 'oddspapi' },
        ];
        const run = (papiPrices: [number, number], opticPrices: [number, number]) => {
            const leagueInfos = info('pinnacle oddspapi', 'pinnacle');
            return checkOdds(
                filterOdds(
                    [
                        line('oddspapi', 'Home', papiPrices[0]),
                        line('oddspapi', 'Away', papiPrices[1]),
                        line(undefined, 'Home', opticPrices[0]),
                        line(undefined, 'Away', opticPrices[1]),
                    ],
                    leagueInfos,
                    playersMap
                ),
                leagueInfos,
                ['pinnacle'],
                polled,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );
        };

        it('keeps only the primary vendor lines and compares them with the other vendor (no key collision)', () => {
            const result = run([1.5, 2.6], [1.5, 2.6]);
            expect(result.errorsMap.size).toBe(0);
            // one line per selection, all from the primary (OddsPapi) feed - not duplicated by the Optic feed
            expect(result.odds).toHaveLength(2);
            expect(result.odds.every((odd: any) => odd.vendor === 'oddspapi')).toBe(true);
        });

        it('blocks when the two vendors disagree beyond the anchors (a bookmaker compared with itself never would)', () => {
            const result = run([1.5, 4.0], [1.5, 2.0]);
            expect(result.errorsMap.get(0)).toBe(DIFF_BETWEEN_BOOKMAKERS_MESSAGE);
            // blocking is per line: the agreeing Home line survives, the diverging Away line is dropped
            expect(result.odds.map((odd: any) => odd.selection)).toEqual(['Home']);
        });

        it('reports no matching bookmakers when the other vendor has no line for that bookmaker', () => {
            const leagueInfos = info('pinnacle oddspapi', 'pinnacle');
            const result = checkOdds(
                filterOdds([line('oddspapi', 'Home', 1.5)], leagueInfos, playersMap),
                leagueInfos,
                ['pinnacle'],
                polled,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );
            expect(result.errorsMap.get(0)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE);
        });
    });

    describe('filterOdds selection normalization', () => {
        // whole-match total: OpticOdds sends selection "", OddsPapi leaves it undefined
        const totalInfo: LeagueConfigInfo[] = [
            {
                sportId: '153',
                enabled: 'true',
                marketName: 'Total Games',
                typeId: '10002',
                type: LiveMarketType.TOTAL,
                maxOdds: '0.25',
                minOdds: '0.75',
                primaryBookmaker: 'pinnacle oddspapi',
                secondaryBookmaker: 'unibet',
            },
        ];
        const line = (
            sportsBookName: string,
            vendor: string | undefined,
            selection: string | undefined,
            side: string
        ) =>
            ({
                sportsBookName,
                marketName: 'total games',
                selection,
                selectionLine: side,
                price: 1.9,
                points: 22.5,
                isMain: true,
                playerId: null,
                vendor,
            }) as any;
        const polled = [
            { sportsbook: 'pinnacle', timestamp: Date.now(), vendor: 'oddspapi' },
            { sportsbook: 'unibet', timestamp: Date.now() },
        ];

        it('matches an OddsPapi total (selection undefined) against an OpticOdds total (selection "")', () => {
            const result = checkOdds(
                filterOdds(
                    [
                        line('pinnacle', 'oddspapi', undefined, 'over'),
                        line('pinnacle', 'oddspapi', undefined, 'under'),
                        line('Unibet', undefined, '', 'over'),
                        line('Unibet', undefined, '', 'under'),
                    ],
                    totalInfo,
                    playersMap
                ),
                totalInfo,
                ['pinnacle'],
                polled,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(10002)).toBe(false);
            expect(result.odds).toHaveLength(2);
        });
    });

    describe('filterOdds points normalization', () => {
        // OpticOdds sends points null for moneyline, OddsPapi sends 0 (catalog handicap)
        const moneylineInfo: LeagueConfigInfo[] = [
            {
                sportId: '153',
                enabled: 'true',
                marketName: 'Moneyline',
                typeId: '0',
                type: LiveMarketType.MONEYLINE,
                maxOdds: '0.25',
                minOdds: '0.75',
                primaryBookmaker: 'pinnacle',
                secondaryBookmaker: 'unibet',
            },
        ];
        const line = (sportsBookName: string, selection: string, price: number, points: number | null) =>
            ({
                sportsBookName,
                marketName: 'moneyline',
                selection,
                selectionLine: null,
                price,
                points,
                isMain: true,
                playerId: null,
            }) as any;
        const polled = [
            { sportsbook: 'pinnacle', timestamp: Date.now() },
            { sportsbook: 'unibet', timestamp: Date.now() },
        ];
        const run = (pinnaclePoints: number | null, unibetPoints: number | null) =>
            checkOdds(
                filterOdds(
                    [
                        line('pinnacle', 'Home', 1.5, pinnaclePoints),
                        line('pinnacle', 'Away', 2.6, pinnaclePoints),
                        line('unibet', 'Home', 1.5, unibetPoints),
                        line('unibet', 'Away', 2.6, unibetPoints),
                    ],
                    moneylineInfo,
                    playersMap
                ),
                moneylineInfo,
                ['pinnacle', 'unibet'],
                polled,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

        it('matches a primary with points 0 against a secondary with points null (and the reverse)', () => {
            [
                [0, null],
                [null, 0],
                [null, null],
                [0, 0],
            ].forEach(([pinnaclePoints, unibetPoints]) => {
                const result = run(pinnaclePoints, unibetPoints);
                expect(result.errorsMap.has(0)).toBe(false);
                expect(result.odds).toHaveLength(2);
            });
        });

        it('still reports no matching bookmakers when the secondary is really missing', () => {
            const result = checkOdds(
                filterOdds([line('pinnacle', 'Home', 1.5, 0)], moneylineInfo, playersMap),
                moneylineInfo,
                ['pinnacle', 'unibet'],
                polled,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );
            expect(result.errorsMap.get(0)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE);
        });
    });
});
