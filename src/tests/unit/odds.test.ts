import { ZERO_ODDS_MESSAGE_SINGLE_BOOKMAKER } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsGoodOdds,
    MockOddsChildMarketsOddsCut,
    MockOnlyMoneyline,
    MockZeroOdds,
} from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import { getLastPolledMapForBookmakers, MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST } from '../utils/helper';

const lastPolledMap = getLastPolledMapForBookmakers();

describe('Odds', () => {
    it('Should return odds for moneyline', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoOnlyParent,
            lastPolledMap,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(true);
    });

    it('Should return zero odds for moneyline', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockZeroOdds));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE_SINGLE_BOOKMAKER);
    });

    it('Should contain child markets for good odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsGoodOdds));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
        );

        const hasChildMarkets = market.childMarkets.length > 0;
        expect(hasChildMarkets).toBe(true);
    });

    it('Should return empty array for child child markets after odds cut', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsOddsCut));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            [],
            true,
            undefined,
            undefined,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
        );

        expect(market.childMarkets).toHaveLength(0);
    });
});
