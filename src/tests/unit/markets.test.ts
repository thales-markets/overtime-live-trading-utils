import { NO_MARKETS_FOR_LEAGUE_ID } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockOnlyMoneyline, MockOpticSoccer } from '../mock/MockOpticSoccer';
import { MockOpticSoccerNoDrawOdds } from '../mock/MockOpticSoccerNoDrawOdds';
import { mockSoccer } from '../mock/MockSoccerRedis';
import { MockNbaData, MockOddsOnlyOver } from '../mock/OpticOddsMock/MockNBA';
import { MockRedisNba } from '../mock/OpticOddsMock/MockRedisNba';
import {
    getLastPolledDataForBookmakers,
    getPlayersMap,
    MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
    MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
} from '../utils/helper';

const lastPolledData = getLastPolledDataForBookmakers();
const playersMap = getPlayersMap();

describe('Markets', () => {
    describe('LeagueMap configuration', () => {
        it('Should return an empty array for child markets when they are not added to list', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));

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

            expect(market.childMarkets).toHaveLength(0);
        });

        it('Should return an empty array for child markets when they are disabled', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.leagueInfoMockDisabledChilds,
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(market.childMarkets).toHaveLength(0);
        });

        it('Should return only spread child markets without total child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.leagueInfoEnabledSpreadDisabledTotals,
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(false);
        });

        it('Should return both totals and spread child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
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

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);
        });

        it('Should return all child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.leagueInfoEnabledAll,
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');
            const containsChildMoneyline = market.childMarkets.some(
                (child: any) => child.type === 'secondPeriodWinner'
            );
            const containsChildCorrectScore = market.childMarkets.some((child: any) => child.type === 'correctScore');
            const containsChildDoubleChance = market.childMarkets.some((child: any) => child.type === 'doubleChance');
            const containsChildGG = market.childMarkets.some((child: any) => child.type === 'bothTeamsToScore');
            const containsChildGG1stHalf = market.childMarkets.some(
                (child: any) => child.type === 'firstPeriodBothTeamsToScore'
            );
            const containsChildGG2ndHalf = market.childMarkets.some(
                (child: any) => child.type === 'secondPeriodBothTeamsToScore'
            );
            const containsChildDrawNoBet = market.childMarkets.some((child: any) => child.type === 'drawNoBet');
            const containsWillThereBeOvertime = market.childMarkets.some(
                (child: any) => child.type === 'willThereBeOvertime'
            );

            const containsTeamTotalHome = market.childMarkets.some((child: any) => child.type === 'totalHomeTeam');
            const containsTeamTotalAway = market.childMarkets.some((child: any) => child.type === 'totalAwayTeam');

            expect(containsChildGG).toBe(true);
            expect(containsChildGG1stHalf).toBe(true);
            expect(containsChildGG2ndHalf).toBe(true);
            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);
            expect(containsChildMoneyline).toBe(true);
            expect(containsChildCorrectScore).toBe(true);
            expect(containsChildDoubleChance).toBe(true);
            expect(containsChildGG).toBe(true);
            expect(containsChildDrawNoBet).toBe(true);
            expect(containsWillThereBeOvertime).toBe(true);
            expect(containsTeamTotalHome).toBe(true);
            expect(containsTeamTotalAway).toBe(true);
        });

        it('Should return warning message that there are is no configuration available in league map csv', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.leagueInfoOnlyParentDiffSportId,
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            expect(warnSpy).toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(`${NO_MARKETS_FOR_LEAGUE_ID}: ${Number(mockSoccer.leagueId)}`);

            // Restore the original implementation
            warnSpy.mockRestore();
        });

        it('Should return child markets with player props', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(MockRedisNba));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockNbaData));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['bovada', 'draftkings'], // this will be ignored as primaryBookmaker is defined in LeagueMap
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.PlayerAssist, // league map with player props configured
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            market.childMarkets.forEach((child: any) => {
                expect(child.playerProps).toBeDefined();
                expect(child.playerProps.playerId).toBeDefined();
                expect(child.playerProps.playerName).toBeDefined();
            });
        });

        it('Should return child markets with player props that have some over odds', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(MockRedisNba));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsOnlyOver));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['bovada', 'draftkings'], // this will be ignored as primaryBookmaker is defined in LeagueMap
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.PlayerAssist, // league map with player props configured
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            market.childMarkets.forEach((child: any) => {
                expect(child.playerProps).toBeDefined();
                expect(child.playerProps.playerId).toBeDefined();
                expect(child.playerProps.playerName).toBeDefined();
            });
        });
    });

    describe('Three-positional sport with missing draw odds', () => {
        it('Should handle when bookmaker only provides 2 odds (home and away) for a 3-positional sport', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccerNoDrawOdds));

            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                ODDS_THRESHOLD_ANCHORS,
                LeagueMocks.leagueInfoEnabledAll,
                lastPolledData,
                MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
                playersMap,
                MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK
            );

            // Parent market (moneyline) should have odds array with 3 positions
            expect(market.odds).toHaveLength(3);

            // First two odds should be valid (home and away)
            expect(market.odds[0].american).not.toBe(0);
            expect(market.odds[0].decimal).not.toBe(0);
            expect(market.odds[1].american).not.toBe(0);
            expect(market.odds[1].decimal).not.toBe(0);

            // Third odd (draw) should be zero since it's missing from bookmaker
            expect(market.odds[2].american).toBe(0);
            expect(market.odds[2].decimal).toBe(0);
            expect(market.odds[2].normalizedImplied).toBe(0);
        });

        it('Should still process child markets correctly when parent market has missing draw odds', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccerNoDrawOdds));

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

            // Parent market should have zero draw odds
            expect(market.odds[2].american).toBe(0);
            expect(market.odds[2].decimal).toBe(0);

            // Child markets should still be processed
            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);

            // Child markets should have valid odds
            const spreadMarket = market.childMarkets.find((child: any) => child.type === 'spread');
            expect(spreadMarket).toBeDefined();
            expect(spreadMarket.odds.length).toBeGreaterThan(0);
            expect(spreadMarket.odds[0].american).not.toBe(0);
        });

        it('Should return only parent odds with missing draw when no child markets enabled', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccerNoDrawOdds));

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

            // No child markets
            expect(market.childMarkets).toHaveLength(0);

            // Parent market should have 3 odds with draw being zero
            expect(market.odds).toHaveLength(3);
            expect(market.odds[0].american).not.toBe(0);
            expect(market.odds[1].american).not.toBe(0);
            expect(market.odds[2].american).toBe(0);
            expect(market.odds[2].decimal).toBe(0);
            expect(market.odds[2].normalizedImplied).toBe(0);
        });
    });
});
