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
    getLastPolledDataForBookmakers,
    getPlayersMap,
    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leaguInfoDifferentPrimaryBookmaker,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap
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
