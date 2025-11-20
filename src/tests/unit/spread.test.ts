import { MAX_IMPLIED_PERCENTAGE_DIFF } from '../../constants/common';
import { ZERO_ODDS_AFTER_SPREAD_ADJUSTMENT } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockAfterSpreadZeroOdds1, MockOnlyMoneylineFavorite, MockOpticSoccer } from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';
import { getLastPolledMapForBookmakers, MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST } from '../utils/helper';

const lastPolledMap = getLastPolledMapForBookmakers();

describe('Spread configuration', () => {
    it('Should return zero odds for quotes that sum up total probability above 1', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockAfterSpreadZeroOdds1));
        const market = processMarket(
            freshMockSoccer,
            mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            ['draftkings'],
            [],
            false,
            undefined,
            MAX_IMPLIED_PERCENTAGE_DIFF,
            LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledMap,
            MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
        );

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(false);
        expect(market).toHaveProperty('errorMessage');
        expect(market.errorMessage).toBe(ZERO_ODDS_AFTER_SPREAD_ADJUSTMENT); // should be no matching bookmakers mesage
    });

    it('Should have diff between odds equal to 3%', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    [],
                    true,
                    undefined,
                    MAX_IMPLIED_PERCENTAGE_DIFF,
                    LeagueMocks.leagueInfoOnlyParent,
                    lastPolledMap,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
                )
            )
        );

        const marketWithAddedSpread = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    [],
                    true,
                    undefined,
                    MAX_IMPLIED_PERCENTAGE_DIFF,
                    LeagueMocks.leagueInfoOnlyParentWithSpreadAdded,
                    lastPolledMap,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
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
                    [],
                    true,
                    undefined,
                    MAX_IMPLIED_PERCENTAGE_DIFF,
                    LeagueMocks.leagueInfoOnlyParent,
                    lastPolledMap,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
                )
            )
        );

        const marketWithAddedSpread = JSON.parse(
            JSON.stringify(
                processMarket(
                    freshMockSoccer,
                    mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                    ['draftkings'],
                    [],
                    true,
                    undefined,
                    MAX_IMPLIED_PERCENTAGE_DIFF,
                    LeagueMocks.leagueInfoOnlyParentWithSpreadAdded,
                    lastPolledMap,
                    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST
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
