import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsGoodOdds,
    MockOddsChildMarketsOddsCut,
    MockOnlyMoneyline,
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
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
        );

        const allZeroes = market.odds.every(
            (odd: any) => odd.american === 0 || odd.decimal === 0 || odd.normalizedImplied === 0
        );

        expect(allZeroes).toBe(true);
    });

    it('Should contain child markets for good odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsGoodOdds));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
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
            ODDS_THRESHOLD_ANCHORS,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
        );

        expect(market.childMarkets).toHaveLength(0);
    });
});
