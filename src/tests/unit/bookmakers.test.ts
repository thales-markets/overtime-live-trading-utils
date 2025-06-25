import { DIFF_BETWEEN_BOOKMAKERS_MESSAGE, ZERO_ODDS_MESSAGE } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockOnlyMoneyline, MockOnlyMoneylineWithDifferentSportsbook } from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';

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
            LeagueMocks.leagueInfoEnabledSpeadAndTotals
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE);
        expect(market).not.toHaveProperty('childMarkets');
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
            LeagueMocks.leagueInfoOnlyParent
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(DIFF_BETWEEN_BOOKMAKERS_MESSAGE);
        expect(market).not.toHaveProperty('childMarkets');
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
            LeagueMocks.leagueInfoEnabledSpeadAndTotals
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE); // should be no matching bookmakers mesage
    });
});
