import {
    OddsPapiLeagueCsvRow,
    OddsPapiLeaguesMap,
    OddsPapiMarketCatalogEntry,
    OddsPapiMarketMapCsvRow,
    OddsPapiResolvedMarket,
    ResolveOddsPapiMarketDefinition,
} from '../../types/oddsPapi';
import {
    buildOddsPapiLeaguesMap,
    buildOddsPapiMarketNameMap,
    getOddsPapiLeagueInfo,
    getOddsPapiSportId,
    isOddsPapiParticipantsRotated,
    mapOddsPapiApiFixtureOdds,
    mapOddsPapiOutcomeFields,
    mapOddsPapiStreamOutcomeToEvent,
    matchOddsPapiFixture,
    orientOddsPapiParticipants,
    resolveOddsPapiMarketDefinition,
    synthesizeOddsPapiLastPolled,
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

const TEAM1_TOTAL_DEFINITION: OddsPapiResolvedMarket = {
    opticOddsMarketName: 'Team Total',
    handicap: 22.5,
    outcomeNameByOutcomeId: new Map([
        [30, 'Over'],
        [31, 'Under'],
    ]),
    participantSlot: 1,
};

const TEAM2_TOTAL_DEFINITION: OddsPapiResolvedMarket = {
    opticOddsMarketName: 'Team Total',
    handicap: 20.5,
    outcomeNameByOutcomeId: new Map([
        [40, 'Over'],
        [41, 'Under'],
    ]),
    participantSlot: 2,
};

const resolveMarketDefinitionStub: ResolveOddsPapiMarketDefinition = (_oddsPapiSportId, marketId) => {
    if (marketId === 100) return MONEYLINE_DEFINITION;
    if (marketId === 200) return TOTAL_DEFINITION;
    if (marketId === 300) return SPREAD_DEFINITION;
    if (marketId === 400) return TEAM1_TOTAL_DEFINITION;
    if (marketId === 500) return TEAM2_TOTAL_DEFINITION;
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

        it('maps "Over"/"Under" outcomes to the team1 participant name when participantSlot is 1', () => {
            const overFields = mapOddsPapiOutcomeFields(
                { marketId: 400, outcomeId: 30 },
                1,
                participants,
                resolveMarketDefinitionStub
            );
            const underFields = mapOddsPapiOutcomeFields(
                { marketId: 400, outcomeId: 31 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(overFields).toEqual({
                marketName: 'team total',
                points: 22.5,
                name: 'Over',
                selection: 'home-team',
                selectionLine: 'over',
            });
            expect(underFields).toEqual({
                marketName: 'team total',
                points: 22.5,
                name: 'Under',
                selection: 'home-team',
                selectionLine: 'under',
            });
        });

        it('maps "Over"/"Under" outcomes to the team2 participant name when participantSlot is 2', () => {
            const overFields = mapOddsPapiOutcomeFields(
                { marketId: 500, outcomeId: 40 },
                1,
                participants,
                resolveMarketDefinitionStub
            );
            const underFields = mapOddsPapiOutcomeFields(
                { marketId: 500, outcomeId: 41 },
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(overFields).toEqual({
                marketName: 'team total',
                points: 20.5,
                name: 'Over',
                selection: 'away-team',
                selectionLine: 'over',
            });
            expect(underFields).toEqual({
                marketName: 'team total',
                points: 20.5,
                name: 'Under',
                selection: 'away-team',
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

    describe('isOddsPapiParticipantsRotated', () => {
        it('returns false for straight-order participants', () => {
            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Home FC', participant2Name: 'Away FC' },
                    'Home FC',
                    'Away FC'
                )
            ).toBe(false);
        });

        it('returns true when participant1/participant2 are reversed relative to home/away', () => {
            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Away FC', participant2Name: 'Home FC' },
                    'Home FC',
                    'Away FC'
                )
            ).toBe(true);
        });

        it('matches names by token overlap regardless of word order or accents', () => {
            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Tiafoe, Frances', participant2Name: 'Alcaraz, Carlos' },
                    'Carlos Alcaraz',
                    'Frances Tiafoe'
                )
            ).toBe(true);

            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Fenerbahce Istanbul', participant2Name: 'Galatasaray Istanbul' },
                    'Fenerbahçe Spor Kulübü',
                    'Galatasaray Spor Kulübü'
                )
            ).toBe(false);
        });

        it('returns null (not a guessed false) for genuinely unrelated names', () => {
            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Team Alpha', participant2Name: 'Team Beta' },
                    'Unrelated FC',
                    'Another FC'
                )
            ).toBeNull();
        });

        it('returns null (not a guessed false) when participants or team names are missing', () => {
            expect(isOddsPapiParticipantsRotated(undefined, 'Home FC', 'Away FC')).toBeNull();
            expect(isOddsPapiParticipantsRotated({ participant1Name: 'Home FC' }, 'Home FC', 'Away FC')).toBeNull();
        });

        it('only flips via the fuzzy tier when the caller opts in, and stays null (not a guess) on typos otherwise', () => {
            // Both participant names are typo'd (no exact token overlap with either team name), so the
            // token/substring tiers stay fully ambiguous and only the opt-in fuzzy tier can resolve this.
            const participants = { participant1Name: 'Lakesidee FC', participant2Name: 'Riversde FC' };

            expect(isOddsPapiParticipantsRotated(participants, 'Riverside FC', 'Lakeside FC')).toBeNull();
            expect(
                isOddsPapiParticipantsRotated(participants, 'Riverside FC', 'Lakeside FC', undefined, true, 0.85)
            ).toBe(true);
        });

        describe('returnNullWhenUnconfident=false (legacy always-guess mode)', () => {
            it('guesses false instead of null when participants or team names are missing', () => {
                expect(
                    isOddsPapiParticipantsRotated(undefined, 'Home FC', 'Away FC', undefined, false, 0.8, false)
                ).toBe(false);
                expect(
                    isOddsPapiParticipantsRotated(
                        { participant1Name: 'Home FC' },
                        'Home FC',
                        'Away FC',
                        undefined,
                        false,
                        0.8,
                        false
                    )
                ).toBe(false);
            });

            it('guesses a true/false from whole-name containment instead of null when no branch is confident', () => {
                expect(
                    isOddsPapiParticipantsRotated(
                        { participant1Name: 'Team Alpha', participant2Name: 'Team Beta' },
                        'Unrelated FC',
                        'Another FC',
                        undefined,
                        false,
                        0.8,
                        false
                    )
                ).toBe(false);
            });

            it('still returns confident true/false results unchanged (the legacy flag only affects the unconfident cases)', () => {
                expect(
                    isOddsPapiParticipantsRotated(
                        { participant1Name: 'Away FC', participant2Name: 'Home FC' },
                        'Home FC',
                        'Away FC',
                        undefined,
                        false,
                        0.8,
                        false
                    )
                ).toBe(true);
            });
        });

        it('resolves a pairing via teamsMap that plain token/fuzzy matching alone cannot (true alias, not a word-order difference)', () => {
            const teamsMap = new Map([
                ['bob', 'Robert'],
                ['johnny', 'Johnathan'],
            ]);
            const participants = { participant1Name: 'Bob', participant2Name: 'Johnny' };

            // Without the alias table, "Bob"/"Johnny" share no tokens (and aren't close enough for fuzzy
            // matching) with "Robert"/"Johnathan", so there's no confident signal either way.
            expect(isOddsPapiParticipantsRotated(participants, 'Robert', 'Johnathan')).toBeNull();

            // With the alias table, both names resolve to exact matches on their straight-order side.
            expect(isOddsPapiParticipantsRotated(participants, 'Robert', 'Johnathan', teamsMap)).toBe(false);
        });

        it('does not change the result when a teamsMap entry is redundant with what token overlap already resolves', () => {
            const teamsMap = new Map([['home fc', 'Home FC']]);

            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'Home FC', participant2Name: 'Away FC' },
                    'Home FC',
                    'Away FC',
                    teamsMap
                )
            ).toBe(false);
        });

        it('looks up teamsMap aliases case-insensitively regardless of the authored casing of the name or the map', () => {
            const teamsMap = new Map([['bob', 'Robert']]);

            expect(
                isOddsPapiParticipantsRotated(
                    { participant1Name: 'BOB', participant2Name: 'Johnathan' },
                    'Robert',
                    'Johnathan',
                    teamsMap
                )
            ).toBe(false);
        });

        describe('cross-feed team order (real club/player name scenarios)', () => {
            const papi = (p1: string, p2: string) => ({ participant1Name: p1, participant2Name: p2 });

            it('straight order stays straight (plain club names)', () => {
                expect(isOddsPapiParticipantsRotated(papi('Toronto', 'Montreal'), 'Toronto FC', 'CF Montreal')).toBe(
                    false
                );
            });

            it('reversed order flips (word-order-insensitive)', () => {
                expect(isOddsPapiParticipantsRotated(papi('Montreal', 'Toronto FC'), 'FC Toronto', 'CF Montreal')).toBe(
                    true
                );
            });

            it('tennis "Last, First" pairs with "First Last" in both orders', () => {
                const home = 'Frances Tiafoe';
                const away = 'Ben Shelton';
                expect(isOddsPapiParticipantsRotated(papi('Tiafoe, Frances', 'Shelton, Ben'), home, away)).toBe(false);
                expect(isOddsPapiParticipantsRotated(papi('Shelton, Ben', 'Tiafoe, Frances'), home, away)).toBe(true);
            });

            it('decorated club names match on the distinctive token', () => {
                const home = 'Fenerbahçe Spor Kulübü';
                const away = 'Galatasaray SK';
                expect(
                    isOddsPapiParticipantsRotated(papi('Fenerbahce Istanbul', 'Galatasaray Istanbul'), home, away)
                ).toBe(false);
                expect(
                    isOddsPapiParticipantsRotated(papi('Galatasaray Istanbul', 'Fenerbahce Istanbul'), home, away)
                ).toBe(true);
            });

            it('derby: the shared city token carries no side information', () => {
                const home = 'Manchester United';
                const away = 'Manchester City';
                expect(
                    isOddsPapiParticipantsRotated(papi('Manchester United FC', 'Manchester City FC'), home, away)
                ).toBe(false);
                expect(
                    isOddsPapiParticipantsRotated(papi('Manchester City FC', 'Manchester United FC'), home, away)
                ).toBe(true);
            });

            it('an exact token match resolves concatenated/decorated short forms (e.g. "(OLD)" suffixes)', () => {
                expect(
                    isOddsPapiParticipantsRotated(
                        papi('Heretics', 'Movistar KOI'),
                        'Movistar KOI',
                        'Los Heretics (OLD)'
                    )
                ).toBe(true);
            });

            it('one recognizable participant decides by elimination', () => {
                const home = 'Frances Tiafoe';
                const away = 'Ben Shelton';
                // p1 confidently the AWAY player, p2 unrecognizable -> flip
                expect(isOddsPapiParticipantsRotated(papi('Shelton, Ben', 'Qualifier'), home, away)).toBe(true);
                // p1 confidently the HOME player, p2 unrecognizable -> straight
                expect(isOddsPapiParticipantsRotated(papi('Tiafoe, Frances', 'TBD'), home, away)).toBe(false);
                // the decisive side may also be p2
                expect(isOddsPapiParticipantsRotated(papi('Qualifier', 'Tiafoe, Frances'), home, away)).toBe(true);
            });

            it('an extra middle name on one feed cannot block or misdirect the match', () => {
                const home = 'Solana Sierra';
                const away = 'Maria Lourdes Carle';
                expect(isOddsPapiParticipantsRotated(papi('Sierra, Solana', 'Carle, Maria'), home, away)).toBe(false);
                expect(isOddsPapiParticipantsRotated(papi('Carle, Maria', 'Sierra, Solana'), home, away)).toBe(true);
                // both players share a first name -> the shared token is dropped and the surnames decide
                expect(
                    isOddsPapiParticipantsRotated(papi('Carle, Maria', 'Sakkari, Maria'), 'Maria Sakkari', away)
                ).toBe(true);
            });

            it('tennis abbreviated "Surname I" forms pair with full names', () => {
                const home = 'Kaitlin Quevedo';
                const away = 'Sara Sorribes Tormo';
                expect(isOddsPapiParticipantsRotated(papi('Quevedo K', 'Sorribes Tormo S'), home, away)).toBe(false);
                expect(isOddsPapiParticipantsRotated(papi('Sorribes Tormo S', 'Quevedo K'), home, away)).toBe(true);
                // abbreviated on one side only still decides by elimination
                expect(isOddsPapiParticipantsRotated(papi('Qualifier', 'Quevedo K'), home, away)).toBe(true);
            });

            it('whole-name match decides where shared or hyphen-split tokens leave token overlap with no signal', () => {
                const cases: [string, string, string, string][] = [
                    // near-identical hyphenated names
                    ['Lu, Jia-Jing', 'Lu, Jing-Jing', 'Jing-Jing Lu', 'Jia-Jing Lu'],
                    // "Chen-Yu Lu" vs "Yu Chen" collapse to the same tokens
                    ['Lu, Chen-Yu', 'Chen, Yu', 'Yu Chen', 'Chen-Yu Lu'],
                    ['Lin, Yu-Chen', 'Chen, Yu', 'Yu Chen', 'Yu-Chen Lin'],
                    // shared surname + a spelling split ("Seonyong" / "Seon Yong")
                    ['Seonyong Han', 'Han Shi', 'Han Shi', 'Seon Yong Han'],
                    // two different players told apart only by the "(USA)" marker
                    ['Jones, Emerson (USA)', 'Jones, Emerson', 'Emerson Jones', 'Emerson (USA) Jones'],
                ];
                cases.forEach(([p1, p2, home, away]) => {
                    expect(isOddsPapiParticipantsRotated(papi(p1, p2), home, away)).toBe(true);
                    expect(isOddsPapiParticipantsRotated(papi(p2, p1), home, away)).toBe(false);
                });
            });

            it('a rebranded/renamed side (papi-only name) decides by the unchanged side', () => {
                const home = 'CF Montreal';
                const away = 'Toronto FC';
                // papi renamed Toronto to "TRT" -> Montreal alone pins the order
                expect(isOddsPapiParticipantsRotated(papi('CF Montreal', 'TRT'), home, away)).toBe(false);
                expect(isOddsPapiParticipantsRotated(papi('TRT', 'CF Montreal'), home, away)).toBe(true);
            });

            it('a stray generic token (< 4 chars) cannot decide a one-sided flip alone, so it is reported as unknown', () => {
                // p1's only cross-match with the away side is "fc" (< 4 chars, not distinctive), so unlike the
                // ported source (which guessed false here), there is genuinely no confident signal either way
                expect(
                    isOddsPapiParticipantsRotated(papi('FC Unknown', 'Mystery'), 'Copenhagen', 'Midtjylland FC')
                ).toBeNull();
            });

            it('colliding claims (both participants only match the same side) are reported as unknown, not guessed', () => {
                // both participants share a token with the AWAY team only, so no elimination is possible either way
                expect(
                    isOddsPapiParticipantsRotated(papi('FC Kobenhavn', 'Midtjylland'), 'Copenhagen', 'Midtjylland FC')
                ).toBeNull();
            });

            describe('fuzzy tier (fuzzyOrientationEnabled)', () => {
                // pure-typo names: zero exact-token overlap, so only the fuzzy tier can decide
                const home = 'Fenerbahce';
                const away = 'Galatasaray';

                it('off by default - a typo-only match is reported as unknown, not guessed', () => {
                    expect(isOddsPapiParticipantsRotated(papi('Galatasarai', 'Fenerbahge'), home, away)).toBeNull();
                });

                it('enabled - similarity above threshold decides, both orders', () => {
                    expect(
                        isOddsPapiParticipantsRotated(papi('Fenerbahge', 'Galatasarai'), home, away, undefined, true)
                    ).toBe(false);
                    expect(
                        isOddsPapiParticipantsRotated(papi('Galatasarai', 'Fenerbahge'), home, away, undefined, true)
                    ).toBe(true);
                });

                it('enabled - one typo side plus an unrecognizable side decides by elimination', () => {
                    expect(isOddsPapiParticipantsRotated(papi('Fenerbahge', 'XYZ'), home, away, undefined, true)).toBe(
                        false
                    );
                    expect(isOddsPapiParticipantsRotated(papi('XYZ', 'Fenerbahge'), home, away, undefined, true)).toBe(
                        true
                    );
                });

                it('a tighter threshold that no similarity clears is reported as unknown, not guessed', () => {
                    expect(
                        isOddsPapiParticipantsRotated(
                            papi('Galatasarai', 'Fenerbahge'),
                            home,
                            away,
                            undefined,
                            true,
                            0.99
                        )
                    ).toBeNull();
                });
            });

            it('an acronym can still decide by elimination when the other side matches distinctively', () => {
                // "NAVI" doesn't literally match "Natus Vincere", but "Team Spirit" distinctively matches
                // "Spirit" alone, so elimination still confidently resolves this one
                expect(isOddsPapiParticipantsRotated(papi('NAVI', 'Team Spirit'), 'Natus Vincere', 'Spirit')).toBe(
                    false
                );
            });

            it('an empty participant name has no signal at all, so it is reported as unknown', () => {
                expect(isOddsPapiParticipantsRotated(papi('', 'Montreal'), 'Toronto FC', 'CF Montreal')).toBeNull();
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

        it('drops outcomes from a bookmaker flagged staleOdds in the fixture bookmakers metadata', () => {
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
                    bookmakers: {
                        draftkings: { staleOdds: false },
                        pinnacle: { staleOdds: true },
                    },
                    odds: {
                        draftkings: {
                            'outcome-key-1': buildOutcome({ bookmaker: 'draftkings', outcomeId: 1 }),
                        },
                        pinnacle: {
                            'outcome-key-2': buildOutcome({ bookmaker: 'pinnacle', outcomeId: 1 }),
                        },
                    },
                },
            };

            const [mapped] = mapOddsPapiApiFixtureOdds([fixtureOddsResult], resolveMarketDefinitionStub);

            expect(mapped.odds).toHaveLength(1);
            expect(mapped.odds[0]).toMatchObject({ id: 'outcome-key-1', sportsBookName: 'draftkings' });
        });

        it('skips falsy entries in the results array', () => {
            expect(mapOddsPapiApiFixtureOdds([null, undefined], resolveMarketDefinitionStub)).toEqual([]);
        });

        it('converts a Date.now()-scale (ms) changedAt to epoch seconds', () => {
            const nowMillis = Date.now();
            const fixtureOddsResult = {
                gameId: 'game-1',
                homeTeam: 'Home FC',
                awayTeam: 'Away FC',
                participantsRotated: false,
                fixtureOdds: {
                    status: { live: true, statusName: 'live' },
                    sport: { sportId: 1 },
                    tournament: { tournamentId: 55 },
                    odds: {
                        draftkings: {
                            'outcome-key-1': buildOutcome({ changedAt: nowMillis }),
                        },
                    },
                },
            };

            const [mapped] = mapOddsPapiApiFixtureOdds([fixtureOddsResult], resolveMarketDefinitionStub);

            expect(mapped.odds[0].timestamp).toBeCloseTo(nowMillis / 1000, 0);
        });

        it('passes a missing/non-number changedAt through unconverted', () => {
            const fixtureOddsResult = {
                gameId: 'game-1',
                homeTeam: 'Home FC',
                awayTeam: 'Away FC',
                participantsRotated: false,
                fixtureOdds: {
                    status: { live: true, statusName: 'live' },
                    sport: { sportId: 1 },
                    tournament: { tournamentId: 55 },
                    odds: {
                        draftkings: {
                            'outcome-key-1': buildOutcome({ changedAt: undefined }),
                        },
                    },
                },
            };

            const [mapped] = mapOddsPapiApiFixtureOdds([fixtureOddsResult], resolveMarketDefinitionStub);

            expect(mapped.odds[0].timestamp).toBeUndefined();
        });
    });

    describe('mapOddsPapiStreamOutcomeToEvent', () => {
        it('maps a stored outcome to the snake_case OpticOdds-style stream event shape, converting changedAt (ms) to epoch seconds', () => {
            const event = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                {
                    bookmaker: 'draftkings',
                    marketId: 100,
                    outcomeId: 2,
                    price: 2.05,
                    changedAt: 1700000010000,
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
                vendor: 'oddspapi',
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

        it('converts a Date.now()-scale (ms) changedAt to epoch seconds', () => {
            const nowMillis = Date.now();
            const event = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                { bookmaker: 'draftkings', marketId: 100, outcomeId: 1, price: 1.91, changedAt: nowMillis },
                'game-1',
                1,
                participants,
                resolveMarketDefinitionStub
            );

            expect(event?.timestamp).toBeCloseTo(nowMillis / 1000, 0);
        });

        it('passes a missing/non-number changedAt through unconverted', () => {
            const missing = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                { bookmaker: 'draftkings', marketId: 100, outcomeId: 1, price: 1.91 },
                'game-1',
                1,
                participants,
                resolveMarketDefinitionStub
            );
            expect(missing?.timestamp).toBeUndefined();

            const nonNumber = mapOddsPapiStreamOutcomeToEvent(
                'outcome-key-1',
                { bookmaker: 'draftkings', marketId: 100, outcomeId: 1, price: 1.91, changedAt: 'not-a-number' },
                'game-1',
                1,
                participants,
                resolveMarketDefinitionStub
            );
            expect(nonNumber?.timestamp).toBe('not-a-number');
        });
    });

    describe('getOddsPapiLeagueInfo / getOddsPapiSportId', () => {
        const leaguesMap: OddsPapiLeaguesMap = new Map([[4, { oddsPapiSportId: 1, oddsPapiTournamentIds: [55, 56] }]]);

        it('returns the mapped league info and sportId', () => {
            expect(getOddsPapiLeagueInfo(4, leaguesMap)).toEqual({
                oddsPapiSportId: 1,
                oddsPapiTournamentIds: [55, 56],
            });
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

    describe('buildOddsPapiLeaguesMap', () => {
        it('parses the semicolon-delimited tournament ids and maps them by leagueId', () => {
            const rows: OddsPapiLeagueCsvRow[] = [
                { sportId: '4', oddspapiSportId: '1', oddspapiTournamentId: '55; 56' },
            ];

            const map = buildOddsPapiLeaguesMap(rows);

            expect(map.get(4)).toEqual({ oddsPapiSportId: 1, oddsPapiTournamentIds: [55, 56] });
        });

        it('defaults to an empty tournament ids array when the cell is missing', () => {
            const rows: OddsPapiLeagueCsvRow[] = [{ sportId: '4', oddspapiSportId: '1' }];

            const map = buildOddsPapiLeaguesMap(rows);

            expect(map.get(4)).toEqual({ oddsPapiSportId: 1, oddsPapiTournamentIds: [] });
        });

        it('drops rows missing either sportId or oddspapiSportId', () => {
            const rows: OddsPapiLeagueCsvRow[] = [
                { sportId: '', oddspapiSportId: '1' },
                { sportId: '4', oddspapiSportId: '' },
            ];

            const map = buildOddsPapiLeaguesMap(rows);

            expect(map.size).toBe(0);
        });
    });

    describe('buildOddsPapiMarketNameMap', () => {
        it('keys the marketName by oddsPapiSportId:marketType:period', () => {
            const rows: OddsPapiMarketMapCsvRow[] = [
                {
                    oddspapiSportId: '1',
                    oddspapiMarketType: 'moneyline',
                    oddspapiPeriod: 'full',
                    opticOddsMarketName: 'Moneyline',
                },
            ];

            const map = buildOddsPapiMarketNameMap(rows);

            expect(map.get('1:moneyline:full')).toBe('Moneyline');
        });

        it('drops rows missing the sportId, marketType, or marketName', () => {
            const rows: OddsPapiMarketMapCsvRow[] = [
                {
                    oddspapiSportId: '',
                    oddspapiMarketType: 'moneyline',
                    oddspapiPeriod: 'full',
                    opticOddsMarketName: 'Moneyline',
                },
                { oddspapiSportId: '1', oddspapiPeriod: 'full', opticOddsMarketName: 'Moneyline' },
                { oddspapiSportId: '1', oddspapiMarketType: 'moneyline', oddspapiPeriod: 'full' },
            ];

            const map = buildOddsPapiMarketNameMap(rows);

            expect(map.size).toBe(0);
        });

        it('registers a row with an empty/missing oddspapiPeriod under the empty-string sentinel', () => {
            const rows: OddsPapiMarketMapCsvRow[] = [
                { oddspapiSportId: '1', oddspapiMarketType: 'correctscore', opticOddsMarketName: 'Correct Score' },
            ];

            const map = buildOddsPapiMarketNameMap(rows);

            expect(map.get('1:correctscore:')).toBe('Correct Score');
        });
    });

    describe('resolveOddsPapiMarketDefinition', () => {
        const oddsPapiMarketNameMap = new Map([['1:ml:full', 'Moneyline']]);
        const catalogDefinitions: OddsPapiMarketCatalogEntry[] = [
            {
                sportId: 1,
                marketId: 100,
                marketType: 'ml',
                period: 'full',
                handicap: 0,
                outcomes: [
                    { outcomeId: 1, outcomeName: '1' },
                    { outcomeId: 2, outcomeName: '2' },
                ],
            },
        ];

        it('resolves a catalog market by (sportId, marketId), mapping its outcomes', () => {
            const definition = resolveOddsPapiMarketDefinition(1, 100, oddsPapiMarketNameMap, catalogDefinitions);

            expect(definition).toEqual({
                opticOddsMarketName: 'Moneyline',
                handicap: 0,
                outcomeNameByOutcomeId: new Map([
                    [1, '1'],
                    [2, '2'],
                ]),
            });
        });

        it('returns null when the marketId is not in the catalog', () => {
            expect(resolveOddsPapiMarketDefinition(1, 999, oddsPapiMarketNameMap, catalogDefinitions)).toBeNull();
        });

        it('returns null when the catalog entry has no mapped marketName', () => {
            expect(resolveOddsPapiMarketDefinition(1, 100, new Map(), catalogDefinitions)).toBeNull();
        });

        it('resolves a catalog entry with period undefined against a mapping with an empty period', () => {
            const noPeriodMap = new Map([['1:correctscore:', 'Correct Score']]);
            const noPeriodCatalog: OddsPapiMarketCatalogEntry[] = [
                {
                    sportId: 1,
                    marketId: 200,
                    marketType: 'correctscore',
                    period: undefined,
                    handicap: 0,
                },
            ];

            const definition = resolveOddsPapiMarketDefinition(1, 200, noPeriodMap, noPeriodCatalog);

            expect(definition).toEqual({
                opticOddsMarketName: 'Correct Score',
                handicap: 0,
                outcomeNameByOutcomeId: new Map(),
            });
        });

        it('resolves participantSlot: 1 from a -team1 marketType suffix (e.g. teamtotals-games-team1)', () => {
            const teamTotalsMap = new Map([['1:teamtotals-games-team1:full', 'Team Total']]);
            const teamTotalsCatalog: OddsPapiMarketCatalogEntry[] = [
                {
                    sportId: 1,
                    marketId: 400,
                    marketType: 'teamtotals-games-team1',
                    period: 'full',
                    handicap: 22.5,
                    outcomes: [
                        { outcomeId: 30, outcomeName: 'Over' },
                        { outcomeId: 31, outcomeName: 'Under' },
                    ],
                },
            ];

            const definition = resolveOddsPapiMarketDefinition(1, 400, teamTotalsMap, teamTotalsCatalog);

            expect(definition?.participantSlot).toBe(1);
        });

        it('resolves participantSlot: 2 from a -team2 marketType suffix (e.g. exactsets-team2)', () => {
            const exactSetsMap = new Map([['1:exactsets-team2:full', 'Exact Sets']]);
            const exactSetsCatalog: OddsPapiMarketCatalogEntry[] = [
                {
                    sportId: 1,
                    marketId: 500,
                    marketType: 'exactsets-team2',
                    period: 'full',
                    handicap: 0,
                },
            ];

            const definition = resolveOddsPapiMarketDefinition(1, 500, exactSetsMap, exactSetsCatalog);

            expect(definition?.participantSlot).toBe(2);
        });

        it('leaves participantSlot undefined for a marketType with no -team1/-team2 suffix', () => {
            const definition = resolveOddsPapiMarketDefinition(1, 100, oddsPapiMarketNameMap, catalogDefinitions);

            expect(definition?.participantSlot).toBeUndefined();
        });
    });

    describe('matchOddsPapiFixture', () => {
        const fixtures = [
            {
                fixtureId: 'papi-1',
                externalProviders: { opticoddsId: 'game-1' },
                participants: { participant1Name: 'Home FC', participant2Name: 'Away FC' },
            },
        ];

        it('matches by externalProviders.opticoddsId and resolves the rotation flag', () => {
            const match = matchOddsPapiFixture(fixtures, 'game-1', 'Home FC', 'Away FC');

            expect(match).toEqual({ oddsPapiId: 'papi-1', oddsPapiParticipantsRotated: false });
        });

        it('returns null when no fixture matches the gameId', () => {
            expect(matchOddsPapiFixture(fixtures, 'game-unknown', 'Home FC', 'Away FC')).toBeNull();
        });

        it('returns null when the participant-name rotation is unconfident', () => {
            const unmatchableFixtures = [
                {
                    fixtureId: 'papi-2',
                    externalProviders: { opticoddsId: 'game-2' },
                    participants: { participant1Name: 'Team Alpha', participant2Name: 'Team Beta' },
                },
            ];

            expect(matchOddsPapiFixture(unmatchableFixtures, 'game-2', 'Unrelated FC', 'Another FC')).toBeNull();
        });
    });

    describe('synthesizeOddsPapiLastPolled', () => {
        it('converts each bookmaker delay into a now-minus-delay timestamp tagged vendor: oddspapi', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            const delayByBookmakerLower = new Map([['pinnacle', 30]]);

            const [entry] = synthesizeOddsPapiLastPolled(['Pinnacle'], delayByBookmakerLower);

            expect(entry.sportsbook).toBe('pinnacle');
            expect(entry.vendor).toBe('oddspapi');
            expect(entry.timestamp).toBeGreaterThanOrEqual(nowSeconds - 30 - 1);
            expect(entry.timestamp).toBeLessThanOrEqual(nowSeconds - 30 + 1);
        });

        it('omits bookmakers with no published delay', () => {
            const result = synthesizeOddsPapiLastPolled(['pinnacle', 'draftkings'], new Map([['pinnacle', 30]]));

            expect(result.map((entry) => entry.sportsbook)).toEqual(['pinnacle']);
        });

        it('returns an empty array when given no bookmakers', () => {
            expect(synthesizeOddsPapiLastPolled([], new Map())).toEqual([]);
        });
    });
});
