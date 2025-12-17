import { DIFF_BETWEEN_BOOKMAKERS_MESSAGE, ZERO_ODDS_MESSAGE } from '../../constants/errors';
import { __test__ } from '../../utils/bookmakers';
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
    PERCENTAGE_DIFF_FOR_PP_LINES,
} from '../utils/helper';

const lastPolledData = getLastPolledDataForBookmakers();
const playersMap = getPlayersMap();

describe('Bookmakers', () => {
    it('Should return zero odds for moneyline when one of the bookmakers has no odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings', 'bovada'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE);
    });

    it('Should return zero odds for moneyline when there is quote diff between bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneylineWithDifferentSportsbook));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings', 'bovada'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(DIFF_BETWEEN_BOOKMAKERS_MESSAGE);
    });

    it('Should return zero odds for moneyline as no matching bookmaker was provided', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['bovada', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE); // should be no matching bookmakers mesage
    });

    it('Should return odds that have both bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakers));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['bovada', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        expect(market.childMarkets.length).toBe(2);
    });

    it('Should return all odds from draftkings', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakers));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['bovada', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leaguInfoDifferentPrimaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        expect(market.childMarkets.length).toBe(3);
    });

    it('Should cut odds that are different between bookmakers', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsDifferentBookmakersPercentageDiff));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['bovada', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

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

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

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

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

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

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

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

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        // Check that the player props were NOT matched (5 point difference is too large for 25.5 points)
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 44556);
        expect(playerPropsMarket).toBeUndefined();
    });

    it('Should find matching line with low point values using appropriate step calculation', () => {
        const freshMockRedis = JSON.parse(JSON.stringify(MockRedisNbaPlayerPropsAdjustment));
        const freshMockOptic = JSON.parse(JSON.stringify(MockPlayerPropsWithLowPoints));

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet', 'draftkings'],
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssistWithSecondaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

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

        const market = processMarket(
            freshMockRedis,
            mapOpticOddsApiFixtureOdds([freshMockOptic])[0],
            ['superbet'], // Only primary bookmaker
            true,
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.PlayerAssist, // Config without secondary bookmaker
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            PERCENTAGE_DIFF_FOR_PP_LINES
        );

        // Should still have child markets for player props
        expect(market.childMarkets.length).toBeGreaterThan(0);

        // Check that the player props were included (no adjustment logic needed)
        const playerPropsMarket = market.childMarkets.find((child: any) => child.playerProps?.playerId === 54321);
        expect(playerPropsMarket).toBeDefined();
    });
});
