import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockAfterSpreadZeroOdds1, MockOnlyMoneyline, MockOnlyMoneylineFavorite } from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import {
    getLastPolledDataForBookmakers,
    getPlayersMap,
    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
} from '../utils/helper';

const lastPolledData = getLastPolledDataForBookmakers();
const playersMap = getPlayersMap();

describe('Spread configuration', () => {
    it('Should return odds even when total probability is below 1 as draw is missing for 3-way sport', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockAfterSpreadZeroOdds1));
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

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(true);
    });

    it('Should have diff between odds equal to 3%', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
        const market = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    ODDS_THRESHOLD_ANCHORS,
                    LeagueMocks.leagueInfoOnlyParent,
                    lastPolledData,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                    playersMap,
                    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
                )
            )
        );

        const marketWithAddedSpread = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    ODDS_THRESHOLD_ANCHORS,
                    LeagueMocks.leagueInfoOnlyParentWithSpreadAdded,
                    lastPolledData,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                    playersMap,
                    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
                )
            )
        );

        const diff1 =
            ((market.odds[0].decimal - marketWithAddedSpread.odds[0].decimal) / marketWithAddedSpread.odds[0].decimal) *
            100;

        const diff2 =
            ((market.odds[1].decimal - marketWithAddedSpread.odds[1].decimal) / marketWithAddedSpread.odds[1].decimal) *
            100;

        const diff3 =
            ((market.odds[2].decimal - marketWithAddedSpread.odds[2].decimal) / marketWithAddedSpread.odds[2].decimal) *
            100;

        expect(Math.round(diff1)).toBe(3);
        expect(Math.round(diff2)).toBe(3);
        expect(Math.round(diff3)).toBe(3);
    });

    it('Should have diff between odds equal to 3%, and one odd should stay the same', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneylineFavorite));
        const market = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    ODDS_THRESHOLD_ANCHORS,
                    LeagueMocks.leagueInfoOnlyParent,
                    lastPolledData,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                    playersMap,
                    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
                )
            )
        );

        const marketWithAddedSpread = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    ODDS_THRESHOLD_ANCHORS,
                    LeagueMocks.leagueInfoOnlyParentWithSpreadAdded,
                    lastPolledData,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                    playersMap,
                    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
                )
            )
        );

        const diff1 =
            ((market.odds[0].decimal - marketWithAddedSpread.odds[0].decimal) / marketWithAddedSpread.odds[0].decimal) *
            100;

        const diff2 =
            ((market.odds[1].decimal - marketWithAddedSpread.odds[1].decimal) / marketWithAddedSpread.odds[1].decimal) *
            100;

        const diff3 =
            ((market.odds[2].decimal - marketWithAddedSpread.odds[2].decimal) / marketWithAddedSpread.odds[2].decimal) *
            100;

        expect(Math.round(diff1)).toBe(0);
        expect(Math.round(diff2)).toBe(3);
        expect(Math.round(diff3)).toBe(3);
    });
});
