import { OddsPapiLeaguesMap, OddsPapiResolvedMarket, ResolveOddsPapiMarketDefinition } from '../../types/oddsPapi';
import {
    getOddsPapiLeagueInfo,
    getOddsPapiSportId,
    mapOddsPapiApiFixtureOdds,
    mapOddsPapiOutcomeFields,
    mapOddsPapiStreamOutcomeToEvent,
    orientOddsPapiParticipants,
} from '../../utils/oddsPapi';

const MONEYLINE_DEFINITION: OddsPapiResolvedMarket = {
    opticOddsMarketName: 'Moneyline',
    handicap: 0,
    outcomeNameByOutcomeId: new Map([
        [1, '1'],
        [2, '2'],
    ]),
};

const SPREAD_DEFINITION: OddsPapiResolvedMarket = {
    opticOddsMarketName: 'Spread',
    handicap: 1.5,
    outcomeNameByOutcomeId: new Map([
        [20, '1'],
        [21, '2'],
    ]),
};

const TOTAL_DEFINITION: OddsPapiResolvedMarket = {
    opticOddsMarketName: 'Total',
    handicap: 2.5,
    outcomeNameByOutcomeId: new Map([
        [10, 'Over'],
        [11, 'Under'],
    ]),
};

const resolveMarketDefinitionStub: ResolveOddsPapiMarketDefinition = (_oddsPapiSportId, marketId) => {
    if (marketId === 100) return MONEYLINE_DEFINITION;
    if (marketId === 200) return TOTAL_DEFINITION;
    if (marketId === 300) return SPREAD_DEFINITION;
    return null;
};

const participants = { participant1Name: 'home-team', participant2Name: 'away-team' };

describe('OddsPapi', () => {
    describe('mapOddsPapiOutcomeFields', () => {
        it('maps outcome "1" to the home participant name with no selectionLine', () => {
            const fields = mapOddsPapiOutcomeFields(
                { marketId: 100, outcomeId: 1 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(fields).toEqual({
                marketName: 'moneyline',
                points: 0,
                name: '1',
                selection: 'home-team',
                selectionLine: null,
            });
        });

        it('maps outcome "2" to the away participant name with no selectionLine', () => {
            const fields = mapOddsPapiOutcomeFields(
                { marketId: 100, outcomeId: 2 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(fields).toEqual({
                marketName: 'moneyline',
                points: -0,
                name: '2',
                selection: 'away-team',
                selectionLine: null,
            });
        });

        it('maps "Over"/"Under" outcomes to selectionLine with an undefined selection', () => {
            const overFields = mapOddsPapiOutcomeFields(
                { marketId: 200, outcomeId: 10 },
                1,
                participants,
                resolveMarketDefinitionStub
            );
            const underFields = mapOddsPapiOutcomeFields(
                { marketId: 200, outcomeId: 11 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(overFields).toEqual({
                marketName: 'total',
                points: 2.5,
                name: 'Over',
                selection: undefined,
                selectionLine: 'over',
            });
            expect(underFields).toEqual({
                marketName: 'total',
                points: 2.5,
                name: 'Under',
                selection: undefined,
                selectionLine: 'under',
            });
        });

        it('negates points for the away-side "2" outcome, leaves the home-side "1" outcome untouched', () => {
            const homeFields = mapOddsPapiOutcomeFields(
                { marketId: 300, outcomeId: 20 },
                1,
                participants,
                resolveMarketDefinitionStub
            );
            const awayFields = mapOddsPapiOutcomeFields(
                { marketId: 300, outcomeId: 21 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(homeFields?.points).toBe(1.5);
            expect(awayFields?.points).toBe(-1.5);
        });

        it('returns null (not a throw) when resolveMarketDefinition cannot resolve the market', () => {
            expect(() =>
                mapOddsPapiOutcomeFields({ marketId: 999, outcomeId: 1 }, 1, participants, resolveMarketDefinitionStub)
            ).not.toThrow();
            expect(
                mapOddsPapiOutcomeFields({ marketId: 999, outcomeId: 1 }, 1, participants, resolveMarketDefinitionStub)
            ).toBeNull();
        });
    });

    describe('orientOddsPapiParticipants', () => {
        it('keeps participant1 as the home team when not rotated', () => {
            expect(orientOddsPapiParticipants('Home FC', 'Away FC', false)).toEqual({
                participant1Name: 'Home FC',
                participant2Name: 'Away FC',
            });
        });

        it('swaps participant1/participant2 when rotated', () => {
            expect(orientOddsPapiParticipants('Home FC', 'Away FC', true)).toEqual({
                participant1Name: 'Away FC',
                participant2Name: 'Home FC',
            });
        });
    });

    describe('mapOddsPapiApiFixtureOdds', () => {
        const buildOutcome = (overrides: Record<string, any>) => ({
            bookmaker: 'draftkings',
            marketId: 100,
            outcomeId: 1,
            price: 1.91,
            changedAt: 1700000005,
            mainLine: true,
            active: true,
            marketActive: true,
            playerId: null,
            ...overrides,
        });

        it('maps a fixture-odds response into the flat OddsObject shape, dropping hard-stopped and unresolved outcomes', () => {
            const fixtureOddsResult = {
                gameId: 'game-1',
                homeTeam: 'Home FC',
                awayTeam: 'Away FC',
                participantsRotated: false,
                fixtureOdds: {
                    status: { live: true, statusName: 'live' },
                    sport: { sportId: 1 },
                    tournament: { tournamentId: 55 },
                    startTime: 1700000000,
                    odds: {
                        draftkings: {
                            'outcome-key-1': buildOutcome({ outcomeId: 1 }),
                            'outcome-key-2-inactive': buildOutcome({ outcomeId: 2, active: false }),
                            'outcome-key-3-market-inactive': buildOutcome({ outcomeId: 2, marketActive: false }),
                            'outcome-key-4-unresolved-market': buildOutcome({ marketId: 999 }),
                        },
                    },
                },
            };

            const [mapped] = mapOddsPapiApiFixtureOdds([fixtureOddsResult], resolveMarketDefinitionStub);

            expect(mapped.gameId).toBe('game-1');
            expect(mapped.isLive).toBe(true);
            expect(mapped.status).toBe('live');
            expect(mapped.sport).toBe(1);
            expect(mapped.league).toBe(55);
            expect(mapped.odds).toHaveLength(1);
            expect(mapped.odds[0]).toMatchObject({
                id: 'outcome-key-1',
                sportsBookName: 'draftkings',
                name: '1',
                price: 1.91,
                marketName: 'moneyline',
                selection: 'Home FC',
                selectionLine: null,
                isMain: true,
                isLive: true,
            });
        });

        it('skips falsy entries in the results array', () => {
            expect(mapOddsPapiApiFixtureOdds([null, undefined], resolveMarketDefinitionStub)).toEqual([]);
        });
    });

    describe('mapOddsPapiStreamOutcomeToEvent', () => {
        it('maps a stored outcome to the snake_case OpticOdds-style stream event shape', () => {
            const event = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                {
                    bookmaker: 'draftkings',
                    marketId: 100,
                    outcomeId: 2,
                    price: 2.05,
                    changedAt: 1700000010,
                    mainLine: true,
                    playerId: null,
                },
                'game-1',
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(event).toEqual({
                id: 'outcome-key-1',
                fixture_id: 'game-1',
                sportsbook: 'draftkings',
                name: '2',
                price: 2.05,
                timestamp: 1700000010,
                points: -0,
                is_main: true,
                is_live: true,
                market: 'moneyline',
                player_id: null,
                selection: 'away-team',
                selection_line: null,
            });
        });

        it('returns null when the market cannot be resolved', () => {
            const event = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                { marketId: 999, outcomeId: 1 },
                'game-1',
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(event).toBeNull();
        });
    });

    describe('getOddsPapiLeagueInfo / getOddsPapiSportId', () => {
        const leaguesMap: OddsPapiLeaguesMap = new Map([[4, { oddsPapiSportId: 1, oddsPapiTournamentIds: [55, 56] }]]);

        it('returns the mapped league info and sportId', () => {
            expect(getOddsPapiLeagueInfo(4, leaguesMap)).toEqual({ oddsPapiSportId: 1, oddsPapiTournamentIds: [55, 56] });
            expect(getOddsPapiSportId(4, leaguesMap)).toBe(1);
        });

        it('returns null for a league with no OddsPapi mapping', () => {
            expect(getOddsPapiLeagueInfo(999, leaguesMap)).toBeNull();
            expect(getOddsPapiSportId(999, leaguesMap)).toBeNull();
        });

        it('returns null when the leagues map itself is undefined', () => {
            expect(getOddsPapiLeagueInfo(4, undefined)).toBeNull();
            expect(getOddsPapiSportId(4, undefined)).toBeNull();
        });
    });
});
