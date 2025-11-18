import { DIFF_BETWEEN_BOOKMAKERS_MESSAGE, ZERO_ODDS_MESSAGE } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsDifferentBookmakers,
    MockOddsChildMarketsDifferentBookmakersPercentageDiff,
    MockOnlyMoneyline,
    MockOnlyMoneylineWithDifferentSportsbook,
} from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import { getLastPolledMapForBookmakers } from '../utils/helper';

const lastPolledMap = getLastPolledMapForBookmakers();

describe('Bookmakers', () => {
    it('Should return zero odds for moneyline when one of the bookmakers has no odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings', 'bovada'],
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap
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
            [],
            true,
            undefined,
            5,
            LeagueMocks.leagueInfoOnlyParent,
            lastPolledMap
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
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap
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
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap
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
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leaguInfoDifferentPrimaryBookmaker,
            lastPolledMap
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
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap
        );

        expect(market.childMarkets.length).toBe(1);
    });
});
