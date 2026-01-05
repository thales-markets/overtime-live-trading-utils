import {
    DIFF_BETWEEN_BOOKMAKERS_MESSAGE,
    LAST_POLLED_TOO_OLD,
    NO_MATCHING_BOOKMAKERS_MESSAGE,
    NO_MATCHING_BOOKMAKERS_MESSAGE_ALT_LINES,
} from '../../constants/errors';
import { LiveMarketType } from '../../enums/sports';
import { OddsWithLeagueInfo } from '../../types/odds';
import { LeagueConfigInfo } from '../../types/sports';
import { __test__, checkOdds } from '../../utils/bookmakers';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsDifferentBookmakers,
    MockOddsChildMarketsDifferentBookmakersPercentageDiff,
    MockOnlyMoneyline,
    MockOnlyMoneylineWithDifferentSportsbook,
} from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import {
    MockPlayerPropsWithLowPoints,
    MockPlayerPropsWithNegativeOnePointDiff,
    MockPlayerPropsWithNoMatchingLine,
    MockPlayerPropsWithOnePointDiff,
    MockPlayerPropsWithTwoPointDiff,
} from '../mock/OpticOddsMock/MockNBAPlayerPropsAdjustment';
import { MockRedisNbaPlayerPropsAdjustment } from '../mock/OpticOddsMock/MockRedisNbaPlayerPropsAdjustment';
import {
    getLastPolledDataForBookmakers,
    getPlayersMap,
    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
} from '../utils/helper';

const lastPolledData = getLastPolledDataForBookmakers();
const playersMap = getPlayersMap();

describe('Bookmakers', () => {
    it('Should return zero odds for moneyline when one of the bookmakers has no odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings', 'bovada'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
    });

    it('Should return zero odds for moneyline when there is quote diff between bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneylineWithDifferentSportsbook));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings', 'bovada'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasZeroOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasZeroOdds).toBe(true);
    });

    it('Should return zero odds for moneyline as no matching bookmaker was provided', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['bovada', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
    });

    it('Should return odds that have both bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakers));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['bovada', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        expect(market.childMarkets.length).toBe(2);
    });

    it('Should return all odds from draftkings', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakers));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['bovada', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leaguInfoDifferentPrimaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        expect(market.childMarkets.length).toBe(3);
    });

    it('Should cut odds that are different between bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakersPercentageDiff));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['bovada', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        expect(market.childMarkets.length).toBe(1);
    });
});

describe('Bookmakers', () => {
    it('Should export test only functions', () => {
        const OUR_ODDS = 1.943;
        const OTHER_ODDS = 1.847;

        const THRESHOLDS = [
            { our: 1.02, otherMin: 1.01 },
            { our: 1.05, otherMin: 1.04 },
            { our: 1.1, otherMin: 1.09 },
            { our: 1.2, otherMin: 1.19 },
            { our: 1.3, otherMin: 1.29 },
            { our: 1.4, otherMin: 1.39 },
            { our: 1.5, otherMin: 1.48 },
            { our: 2.0, otherMin: 1.95 },
            { our: 2.5, otherMin: 2.25 },
            { our: 3.0, otherMin: 2.5 },
            { our: 4.0, otherMin: 3.5 },
            { our: 8.0, otherMin: 6.5 },
            { our: 10.0, otherMin: 8.0 },
            { our: 100.0, otherMin: 70.0 },
        ];

        expect(__test__.shouldBlockOdds(OUR_ODDS, OTHER_ODDS, THRESHOLDS)).toBe(true);
    });
});

describe('Bookmakers - Player Props Point Adjustment', () => {
    it('Should find matching line when secondary bookmaker has 1 point higher', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithOnePointDiff));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Should have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);
        // Check that the player props were matched despite the 1 point difference
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId == 54321);
        expect(playerPropsMarket).toBeDefined();
        expect(playerPropsMarket.playerProps.playerName).toContain('James Harden');
    });

    it('Should find matching line when secondary bookmaker has 1 point lower', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithNegativeOnePointDiff));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Should have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);

        // Check that the player props were matched despite the -1 point difference
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 77889);
        expect(playerPropsMarket).toBeDefined();
        expect(playerPropsMarket.playerProps.playerName).toContain('LeBron James');
    });

    it('Should find matching line when secondary bookmaker has 2 points higher', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithTwoPointDiff));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Should have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);

        // Check that the player props were matched despite the 2 point difference
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 99001);
        expect(playerPropsMarket).toBeDefined();
        expect(playerPropsMarket.playerProps.playerName).toContain('Stephen Curry');
    });

    it('Should NOT find matching line when difference is too large (beyond step range)', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithNoMatchingLine));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Check that the player props were NOT matched (5 point difference is too large for 25.5 points)
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 44556);
        expect(playerPropsMarket).toBeUndefined();
    });

    it('Should find matching line with low point values using appropriate step calculation', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithLowPoints));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet', 'draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Should have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);

        // Check that the player props were matched with low points (10.5 vs 11.5)
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 11223);
        expect(playerPropsMarket).toBeDefined();
        expect(playerPropsMarket.playerProps.playerName).toContain('Anthony Davis');
    });

    it('Should work correctly with only primary bookmaker (no adjustment needed)', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithOnePointDiff));

        const market = processMarket({
            market: freshMockRedis,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            liveOddsProviders: ['superbet'], // Only primary bookmaker
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.PlayerAssist, // Config without secondary bookmaker
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        // Should still have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);

        // Check that the player props were included (no adjustment logic needed)
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 54321);
        expect(playerPropsMarket).toBeDefined();
    });

    describe('ErrorsMap Tests', () => {
        const mockLeagueInfos: LeagueConfigInfo[] = [
            {
                sportId: 4,
                enabled: 'true',
                marketName: 'Moneyline',
                typeId: 1001,
                type: LiveMarketType.MONEYLINE,
                maxOdds: 0.25,
                minOdds: 0.75,
                primaryBookmaker: 'draftkings',
                secondaryBookmaker: 'bovada',
            },
            {
                sportId: 4,
                enabled: 'true',
                marketName: 'Spread',
                typeId: 1002,
                type: LiveMarketType.SPREAD,
                maxOdds: 0.25,
                minOdds: 0.75,
                primaryBookmaker: 'draftkings',
                secondaryBookmaker: 'bovada',
                percentageDiffForLines: 10,
            },
            {
                sportId: 4,
                enabled: 'true',
                marketName: 'Total',
                typeId: 1003,
                type: LiveMarketType.TOTAL,
                maxOdds: 0.25,
                minOdds: 0.75,
                primaryBookmaker: 'draftkings',
                secondaryBookmaker: 'bovada',
                percentageDiffForLines: 10,
            },
        ];

        const createMockOddsData = (
            typeId: number,
            marketName: string,
            primaryPrice: number,
            secondaryPrice?: number,
            points = '0',
            selection = 'over',
            selectionLine = '0'
        ): { [key: string]: OddsWithLeagueInfo } => {
            const baseMockOdd: Partial<OddsWithLeagueInfo> = {
                id: '123',
                sportsBookName: 'draftkings',
                name: 'Test Market',
                timestamp: Date.now(),
                points: parseFloat(points),
                isLive: true,
                marketName: marketName,
                playerId: '',
                selection: selection,
                selectionLine: selectionLine,
                typeId: typeId,
                price: primaryPrice,
                isMain: true,
                sportId: 4,
                enabled: 'true',
                type: LiveMarketType.MONEYLINE,
                maxOdds: 0.25,
                minOdds: 0.75,
            };

            const odds: { [key: string]: OddsWithLeagueInfo } = {
                [`draftkings_${marketName.toLowerCase()}_${points}_${selection}_${selectionLine}`]:
                    baseMockOdd as OddsWithLeagueInfo,
            };

            if (secondaryPrice !== undefined) {
                const secondaryMockOdd = {
                    ...baseMockOdd,
                    sportsBookName: 'bovada',
                    price: secondaryPrice,
                } as OddsWithLeagueInfo;

                odds[`bovada_${marketName.toLowerCase()}_${points}_${selection}_${selectionLine}`] = secondaryMockOdd;
            }

            return odds;
        };

        const createOldLastPolledData = () => {
            const oldTimestamp = Math.floor((Date.now() - MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST - 10000) / 1000); // Convert to seconds and make it older than allowed
            return [
                { sportsbook: 'draftkings', timestamp: oldTimestamp },
                { sportsbook: 'bovada', timestamp: oldTimestamp },
            ];
        };

        it('Should add LAST_POLLED_TOO_OLD error when last polled data is stale', () => {
            const odds = createMockOddsData(1001, 'Moneyline', 1.85, 1.9);
            const oldLastPolledData = createOldLastPolledData();

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                oldLastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1001)).toBe(true);
            expect(result.errorsMap.get(1001)).toBe(LAST_POLLED_TOO_OLD);
            expect(result.odds.length).toBe(0);
        });

        it('Should add DIFF_BETWEEN_BOOKMAKERS_MESSAGE error when odds difference exceeds anchor threshold', () => {
            const odds = createMockOddsData(1001, 'Moneyline', 5.0, 1.5); // Large difference that should trigger shouldBlockOdds

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1001)).toBe(true);
            expect(result.errorsMap.get(1001)).toBe(DIFF_BETWEEN_BOOKMAKERS_MESSAGE);
            expect(result.odds.length).toBe(0);
        });

        it('Should add NO_MATCHING_BOOKMAKERS_MESSAGE error when secondary bookmaker not found for non-spread/total markets', () => {
            // Only provide primary bookmaker odds
            const odds = createMockOddsData(1001, 'Moneyline', 1.85);

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1001)).toBe(true);
            expect(result.errorsMap.get(1001)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE);
            expect(result.odds.length).toBe(0);
        });

        it('Should add NO_MATCHING_BOOKMAKERS_MESSAGE_ALT_LINES error when no alt lines found for spread markets', () => {
            // Provide spread odds but only for draftkings with specific points, no matching bovada line
            const odds = createMockOddsData(1002, 'Spread', 1.85, undefined, '2.5', 'over', '0');

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1002)).toBe(true);
            expect(result.errorsMap.get(1002)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE_ALT_LINES);
            expect(result.odds.length).toBe(0);
        });

        it('Should add NO_MATCHING_BOOKMAKERS_MESSAGE_ALT_LINES error when no alt lines found for total markets', () => {
            // Provide total odds but only for draftkings with specific points, no matching bovada line
            const odds = createMockOddsData(1003, 'Total', 1.9, undefined, '45.5', 'over', '0');

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1003)).toBe(true);
            expect(result.errorsMap.get(1003)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE_ALT_LINES);
            expect(result.odds.length).toBe(0);
        });

        it('Should not add errors when odds are valid and within thresholds', () => {
            const odds = createMockOddsData(1001, 'Moneyline', 1.85, 1.9); // Close odds that should pass validation

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1001)).toBe(false);
            expect(result.odds.length).toBe(1);
            expect(result.odds[0].price).toBe(1.85);
        });

        it('Should not overwrite existing error messages for same typeId', () => {
            // Create odds data that will trigger multiple errors for same typeId
            const baseMockOdd: OddsWithLeagueInfo = {
                id: '123',
                sportsBookName: 'draftkings',
                name: 'Test Market',
                timestamp: Date.now(),
                points: 0,
                isLive: true,
                marketName: 'Moneyline',
                playerId: '',
                selection: 'over',
                selectionLine: '0',
                typeId: 1001,
                price: 1.85,
                isMain: true,
                sportId: 4,
                enabled: 'true',
                type: LiveMarketType.MONEYLINE,
                maxOdds: 0.25,
                minOdds: 0.75,
            };

            const odds: { [key: string]: OddsWithLeagueInfo } = {
                draftkings_moneyline_0_over_0: baseMockOdd,
                draftkings_moneyline_1_away_0: {
                    ...baseMockOdd,
                    price: 2.0,
                    selection: 'away',
                    selectionLine: '0',
                },
            };

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            // Should only have one error message for the typeId (the first one encountered)
            expect(result.errorsMap.has(1001)).toBe(true);
            expect(result.errorsMap.get(1001)).toBe(NO_MATCHING_BOOKMAKERS_MESSAGE);
            expect(result.errorsMap.size).toBe(1);
        });

        it('Should handle successful spread line matching with adjusted points', () => {
            // Create spread odds with primary at 2.5 and secondary at 3.0 (within adjustment range)
            const baseMockOdd: OddsWithLeagueInfo = {
                id: '123',
                sportsBookName: 'draftkings',
                name: 'Test Market',
                timestamp: Date.now(),
                points: 2.5,
                isLive: true,
                marketName: 'Spread',
                playerId: '',
                selection: 'over',
                selectionLine: '0',
                typeId: 1002,
                price: 1.85,
                isMain: true,
                sportId: 4,
                enabled: 'true',
                type: LiveMarketType.SPREAD,
                maxOdds: 0.25,
                minOdds: 0.75,
            };

            const odds: { [key: string]: OddsWithLeagueInfo } = {
                'draftkings_spread_2.5_over_0': baseMockOdd,
                // Create secondary bookmaker with exact matching line (not adjusted)
                'bovada_spread_2.5_over_0': {
                    ...baseMockOdd,
                    sportsBookName: 'bovada',
                    points: 2.5,
                    price: 1.9,
                },
            };

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1002)).toBe(false);
            expect(result.odds.length).toBe(1);
            expect(result.odds[0].price).toBe(1.85);
        });

        it('Should match spread lines when secondary bookmaker has adjusted points within tolerance', () => {
            // Create spread odds with primary at 10.5 and secondary at 11.0 (within 10% tolerance)
            const baseMockOdd: OddsWithLeagueInfo = {
                id: '123',
                sportsBookName: 'draftkings',
                name: 'Test Market',
                timestamp: Date.now(),
                points: 10.5,
                isLive: true,
                marketName: 'Spread',
                playerId: '',
                selection: 'over',
                selectionLine: '0',
                typeId: 1002,
                price: 1.85,
                isMain: true,
                sportId: 4,
                enabled: 'true',
                type: LiveMarketType.SPREAD,
                maxOdds: 0.25,
                minOdds: 0.75,
            };

            const odds: { [key: string]: OddsWithLeagueInfo } = {
                'draftkings_spread_10.5_over_0': baseMockOdd,
                // Secondary bookmaker with 11.0 points (within 10% tolerance of 10.5)
                bovada_spread_11_over_0: {
                    ...baseMockOdd,
                    sportsBookName: 'bovada',
                    points: 11.0,
                    price: 1.9,
                },
            };

            const result = checkOdds(
                odds,
                mockLeagueInfos,
                ['draftkings', 'bovada'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1002)).toBe(false);
            expect(result.odds.length).toBe(1);
            expect(result.odds[0].price).toBe(1.85);
        });

        it('Should work with only primary bookmaker (no secondary) without errors', () => {
            const singleBookmakerLeague: LeagueConfigInfo[] = [
                {
                    ...mockLeagueInfos[0],
                    secondaryBookmaker: undefined, // No secondary bookmaker
                },
            ];

            const odds = createMockOddsData(1001, 'Moneyline', 1.85);

            const result = checkOdds(
                odds,
                singleBookmakerLeague,
                ['draftkings'],
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                ODDS_THRESHOLD_ANCHORS,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(result.errorsMap.has(1001)).toBe(false);
            expect(result.odds.length).toBe(1);
            expect(result.odds[0].price).toBe(1.85);
        });
    });
});
