import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { ODDS_THRESHOLD_ANCHORS } from '../mock/MockAnchors';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    MockOddsChildMarketsGoodOdds,
    MockOddsChildMarketsOddsCut,
    MockOnlyMoneyline,
    MockOpticSoccer,
    MockOpticSoccerOneSidePlayerProps,
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
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoOnlyParent,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasOdds = market.odds.some(
            (odd: any) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
        );

        expect(hasOdds).toBe(true);
    });

    it('Should return zero odds for moneyline', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockZeroOdds));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasZeros = market.odds.some(
            (odd: any) => odd.american === 0 || odd.decimal === 0 || odd.normalizedImplied === 0
        );

        expect(hasZeros).toBe(true);
    });

    it('Should contain child markets for good odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsGoodOdds));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const hasChildMarkets = market.childMarkets.length > 0;
        expect(hasChildMarkets).toBe(true);
    });

    it('Should return empty array for child child markets after odds cut', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOddsChildMarketsOddsCut));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledSpeadAndTotals,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        expect(market.childMarkets).toHaveLength(0);
    });

    it('Should return appropriate double chance odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoEnabledDoubleChance,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const doubleChanceTypeIds = LeagueMocks.leagueInfoEnabledDoubleChance.map((info) => Number(info.typeId));
        const doubleChanceMarkets = market.childMarkets.filter((childMarket: any) =>
            doubleChanceTypeIds.includes(childMarket.typeId)
        );

        expect(doubleChanceMarkets).toHaveLength(2);

        LeagueMocks.leagueInfoEnabledDoubleChance.forEach((info) => {
            const actualMarketOdds = doubleChanceMarkets
                .find((childMarket: any) => childMarket.typeId === Number(info.typeId))
                ?.odds.map((odd: any) => odd.decimal);

            const expectedMarketOdds = freshMockOpticSoccer.odds
                .filter((odd: any) => odd.market === info.marketName)
                .map((odd: any) => odd.price);

            expect(actualMarketOdds).toHaveLength(3);
            expect(actualMarketOdds[0]).toBe(expectedMarketOdds[0]);
            expect(actualMarketOdds[1]).toBe(expectedMarketOdds[1]);
            expect(actualMarketOdds[2]).toBe(expectedMarketOdds[2]);
        });
    });

    it('Should return appropriate odd/even odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const oddEvenMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === 10081);

        expect(oddEvenMarket).toBeDefined();
        // odds order is [odd, even]
        const expectedOddPrice = freshMockOpticSoccer.odds.find(
            (odd: any) => odd.market === '1st Half Total Goals Odd/Even' && odd.selection === 'Odd'
        ).price;
        const expectedEvenPrice = freshMockOpticSoccer.odds.find(
            (odd: any) => odd.market === '1st Half Total Goals Odd/Even' && odd.selection === 'Even'
        ).price;

        expect(oddEvenMarket.odds).toHaveLength(2);
        expect(oddEvenMarket.odds[0].decimal).toBe(expectedOddPrice);
        expect(oddEvenMarket.odds[1].decimal).toBe(expectedEvenPrice);
    });

    it('Should return appropriate team total odd/even odds per team', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const homeTeam = freshMockOpticSoccer.home_team_display;
        const awayTeam = freshMockOpticSoccer.away_team_display;

        // home team market keeps the configured typeId, away team market typeId is increased by 1
        [
            { typeId: 10139, team: homeTeam },
            { typeId: 10140, team: awayTeam },
        ].forEach(({ typeId, team }) => {
            const teamOddEvenMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === typeId);

            expect(teamOddEvenMarket).toBeDefined();

            // odds order is [odd, even]
            const expectedOddPrice = freshMockOpticSoccer.odds.find(
                (odd: any) =>
                    odd.market === 'Team Total Odd/Even' && odd.selection === team && odd.selection_line === 'odd'
            ).price;
            const expectedEvenPrice = freshMockOpticSoccer.odds.find(
                (odd: any) =>
                    odd.market === 'Team Total Odd/Even' && odd.selection === team && odd.selection_line === 'even'
            ).price;

            expect(teamOddEvenMarket.odds).toHaveLength(2);
            expect(teamOddEvenMarket.odds[0].decimal).toBeCloseTo(expectedOddPrice, 8);
            expect(teamOddEvenMarket.odds[1].decimal).toBeCloseTo(expectedEvenPrice, 8);
        });
    });

    it('Should return appropriate halftime/fulltime odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const halftimeFulltimeMarket = market.childMarkets.find((childMarket: any) => childMarket.typeId === 10040);

        expect(halftimeFulltimeMarket).toBeDefined();
        expect(halftimeFulltimeMarket.odds).toHaveLength(9);

        // odds are in fixed position order: halftimeOutcomeIndex * 3 + fulltimeOutcomeIndex, outcomes are [home, away, draw]
        const homeTeam = freshMockOpticSoccer.home_team_display;
        const awayTeam = freshMockOpticSoccer.away_team_display;
        const outcomes = [homeTeam, awayTeam, 'Draw'];
        const expectedSelections = outcomes.flatMap((halftime) =>
            outcomes.map((fulltime) => `${halftime} :: ${fulltime}`)
        );

        expectedSelections.forEach((selection, position) => {
            const expectedPrice = freshMockOpticSoccer.odds.find(
                (odd: any) => odd.market === 'Halftime / Fulltime' && odd.selection === selection
            ).price;
            expect(halftimeFulltimeMarket.odds[position].decimal).toBeCloseTo(expectedPrice, 8);
        });
    });

    it('Should return appropriate one side player props odds', () => {
        const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
        const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccerOneSidePlayerProps));
        const market = processMarket({
            market: freshMockSoccer,
            apiResponseWithOdds: mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
            liveOddsProviders: ['draftkings'],
            anchors: ODDS_THRESHOLD_ANCHORS,
            leagueMap: LeagueMocks.leagueInfoNewSoccerMarkets,
            lastPolledData,
            maxAllowedProviderDataStaleDelay: MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST,
            playersMap,
            maxPercentageDiffForLines: MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK,
        });

        const cardReceiverMarkets = market.childMarkets.filter((childMarket: any) => childMarket.typeId === 11234);
        const scoreOrAssistMarkets = market.childMarkets.filter((childMarket: any) => childMarket.typeId === 11303);

        // player with ID not present in playersMap is filtered out
        expect(cardReceiverMarkets).toHaveLength(2);
        expect(scoreOrAssistMarkets).toHaveLength(2);

        [...cardReceiverMarkets, ...scoreOrAssistMarkets].forEach((playerPropsMarket: any) => {
            const expectedOdd = freshMockOpticSoccer.odds.find(
                (odd: any) => odd.selection === playerPropsMarket.playerProps.playerName
            );

            expect(playerPropsMarket.isPlayerPropsMarket).toBe(true);
            expect(playerPropsMarket.playerProps.playerId).toBe(playersMap.get(expectedOdd.player_id));
            expect(playerPropsMarket.odds).toHaveLength(1);
            expect(playerPropsMarket.odds[0].decimal).toBe(expectedOdd.price);
        });
    });
});
