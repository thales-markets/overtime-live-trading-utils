import {
    detectCompletedPeriods,
    canResolveMarketForGameIdAndSport,
    canResolveMarketViaOpticOddsApi,
    canResolveMarketsForEvent,
} from '../../utils/resolution';
import {
    MockSoccerCompletedEvent,
    MockSoccerLiveSecondHalf,
    MockSoccerLiveFirstHalf,
    MockNFLCompletedEvent,
    MockNFLLiveThirdQuarter,
    MockMLBCompletedEvent,
    MockMLBLiveSixthInning,
    MockSoccerLiveFirstHalfInProgress,
    MockNFLCompletedWithOvertime,
} from '../mock/MockOpticOddsEvents';

describe('Resolution Utils', () => {
    describe('detectCompletedPeriods', () => {
        it('Should detect completed periods for real completed soccer game (UEFA Europa League)', () => {
            const result = detectCompletedPeriods(MockSoccerCompletedEvent);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 1.0, away: 0.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 1.0, away: 0.0 });
        });

        it('Should detect completed first half in real live soccer game (2nd half)', () => {
            const result = detectCompletedPeriods(MockSoccerLiveSecondHalf);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 1.0, away: 1.0 });
            expect(result?.currentPeriod).toBe(2);
        });

        it('Should return null for real live soccer game in first half (no completed periods)', () => {
            const result = detectCompletedPeriods(MockSoccerLiveFirstHalf);

            expect(result).toBeNull();
        });

        it('Should detect completed periods for real completed NFL game (Patriots vs Panthers)', () => {
            const result = detectCompletedPeriods(MockNFLCompletedEvent);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 7.0, away: 6.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 21.0, away: 0.0 });
            expect(result?.periodScores['period3']).toEqual({ home: 7.0, away: 0.0 });
            expect(result?.periodScores['period4']).toEqual({ home: 7.0, away: 7.0 });
        });

        it('Should detect completed quarters in real live NFL game (3rd quarter)', () => {
            const result = detectCompletedPeriods(MockNFLLiveThirdQuarter);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 7.0, away: 3.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 14.0, away: 7.0 });
            expect(result?.currentPeriod).toBe(3);
        });

        it('Should detect completed innings for real completed MLB game (Tigers vs Guardians)', () => {
            const result = detectCompletedPeriods(MockMLBCompletedEvent);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 0.0, away: 0.0 });
            expect(result?.periodScores['period3']).toEqual({ home: 0.0, away: 1.0 });
            expect(result?.periodScores['period7']).toEqual({ home: 0.0, away: 4.0 });
            expect(result?.periodScores['period8']).toEqual({ home: 2.0, away: 0.0 });
            expect(result?.periodScores['period9']).toEqual({ home: 0.0, away: 0.0 });
        });

        it('Should detect completed innings in real live MLB game (6th inning)', () => {
            const result = detectCompletedPeriods(MockMLBLiveSixthInning);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4, 5]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 0.0, away: 1.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 2.0, away: 0.0 });
            expect(result?.periodScores['period3']).toEqual({ home: 1.0, away: 0.0 });
            expect(result?.periodScores['period4']).toEqual({ home: 0.0, away: 0.0 });
            expect(result?.periodScores['period5']).toEqual({ home: 1.0, away: 1.0 });
            expect(result?.currentPeriod).toBe(6);
        });

        it('Should return null for real live soccer game with non-numeric period indicator (1H)', () => {
            const result = detectCompletedPeriods(MockSoccerLiveFirstHalfInProgress);

            // Period 1 exists in data but period is "1H" (non-numeric) meaning first half is still in progress
            // Period 1 is NOT complete until we see period_2 in the data or status becomes completed
            expect(result).toBeNull();
        });

        it('Should detect completed periods for completed American Football game', () => {
            const event = {
                sport: {
                    id: 'football',
                    name: 'Football',
                },
                fixture: {
                    id: '20250930BEED03AA',
                    status: 'completed',
                    is_live: false,
                },
                scores: {
                    home: {
                        total: 28.0,
                        periods: {
                            period_1: 7.0,
                            period_2: 14.0,
                            period_3: 0.0,
                            period_4: 7.0,
                        },
                    },
                    away: {
                        total: 3.0,
                        periods: {
                            period_1: 3.0,
                            period_2: 0.0,
                            period_3: 0.0,
                            period_4: 0.0,
                        },
                    },
                },
                in_play: {
                    period: '4',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 7.0, away: 3.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 14.0, away: 0.0 });
            expect(result?.periodScores['period3']).toEqual({ home: 0.0, away: 0.0 });
            expect(result?.periodScores['period4']).toEqual({ home: 7.0, away: 0.0 });
        });

        it('Should detect completed quarters in live American Football game', () => {
            const event = {
                sport: {
                    name: 'Football',
                },
                fixture: {
                    id: 'nfl-live-123',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 21.0,
                        periods: {
                            period_1: 7.0,
                            period_2: 14.0,
                            period_3: 0.0,
                        },
                    },
                    away: {
                        total: 10.0,
                        periods: {
                            period_1: 3.0,
                            period_2: 7.0,
                            period_3: 0.0,
                        },
                    },
                },
                in_play: {
                    period: '3',
                },
            };

            const result = detectCompletedPeriods(event, 'nfl');

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 7.0, away: 3.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 14.0, away: 7.0 });
            expect(result?.currentPeriod).toBe(3);
        });

        it('Should detect all quarters complete in American Football overtime', () => {
            const event = {
                sport: {
                    name: 'American Football',
                },
                fixture: {
                    id: 'nfl-ot-456',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 24.0,
                        periods: {
                            period_1: 7.0,
                            period_2: 7.0,
                            period_3: 3.0,
                            period_4: 7.0,
                        },
                    },
                    away: {
                        total: 24.0,
                        periods: {
                            period_1: 10.0,
                            period_2: 7.0,
                            period_3: 0.0,
                            period_4: 7.0,
                        },
                    },
                },
                in_play: {
                    period: 'overtime',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4]);
            expect(result?.readyForResolution).toBe(true);
        });

        it('Should detect completed first half in live soccer game', () => {
            const event = {
                sport: {
                    name: 'Soccer',
                },
                fixture: {
                    id: 'soccer-123',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 2.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                    away: {
                        total: 1.0,
                        periods: {
                            period_1: 0.0,
                        },
                    },
                },
                in_play: {
                    period: '2',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 1.0, away: 0.0 });
        });

        it('Should detect completed quarters in live basketball game', () => {
            const event = {
                sport: {
                    name: 'Basketball',
                },
                fixture: {
                    id: 'nba-789',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 65.0,
                        periods: {
                            period_1: 25.0,
                            period_2: 20.0,
                        },
                    },
                    away: {
                        total: 62.0,
                        periods: {
                            period_1: 22.0,
                            period_2: 18.0,
                        },
                    },
                },
                in_play: {
                    period: '3',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 25.0, away: 22.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 20.0, away: 18.0 });
        });

        it('Should detect completed sets in live tennis match', () => {
            const event = {
                sport: {
                    name: 'Tennis',
                },
                fixture: {
                    id: 'tennis-101',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 1.0,
                        periods: {
                            period_1: 6.0,
                            period_2: 3.0,
                        },
                    },
                    away: {
                        total: 1.0,
                        periods: {
                            period_1: 4.0,
                            period_2: 6.0,
                        },
                    },
                },
                in_play: {
                    period: '3',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 6.0, away: 4.0 });
            expect(result?.periodScores['period2']).toEqual({ home: 3.0, away: 6.0 });
        });

        it('Should detect completed periods in live hockey game', () => {
            const event = {
                sport: {
                    name: 'Ice Hockey',
                },
                fixture: {
                    id: 'nhl-202',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 2.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                    away: {
                        total: 1.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                },
                in_play: {
                    period: '2',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1]);
            expect(result?.readyForResolution).toBe(true);
            expect(result?.periodScores['period1']).toEqual({ home: 1.0, away: 1.0 });
        });

        it('Should detect all periods complete in hockey overtime', () => {
            const event = {
                sport: {
                    name: 'Hockey',
                },
                fixture: {
                    id: 'nhl-303',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 3.0,
                        periods: {
                            period_1: 1.0,
                            period_2: 1.0,
                            period_3: 1.0,
                        },
                    },
                    away: {
                        total: 3.0,
                        periods: {
                            period_1: 0.0,
                            period_2: 2.0,
                            period_3: 1.0,
                        },
                    },
                },
                in_play: {
                    period: 'overtime',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3]);
            expect(result?.readyForResolution).toBe(true);
        });

        it('Should detect completed innings in live baseball game', () => {
            const event = {
                sport: {
                    name: 'Baseball',
                },
                fixture: {
                    id: 'mlb-404',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 4.0,
                        periods: {
                            period_1: 1.0,
                            period_2: 0.0,
                            period_3: 2.0,
                            period_4: 1.0,
                        },
                    },
                    away: {
                        total: 3.0,
                        periods: {
                            period_1: 0.0,
                            period_2: 1.0,
                            period_3: 1.0,
                            period_4: 1.0,
                        },
                    },
                },
                in_play: {
                    period: '5',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2, 3, 4]);
            expect(result?.readyForResolution).toBe(true);
        });

        it('Should detect completed sets in live volleyball match', () => {
            const event = {
                sport: {
                    name: 'Volleyball',
                },
                fixture: {
                    id: 'volleyball-505',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 1.0,
                        periods: {
                            period_1: 25.0,
                            period_2: 22.0,
                        },
                    },
                    away: {
                        total: 1.0,
                        periods: {
                            period_1: 23.0,
                            period_2: 25.0,
                        },
                    },
                },
                in_play: {
                    period: '3',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1, 2]);
            expect(result?.readyForResolution).toBe(true);
        });

        it('Should return null for game not started', () => {
            const event = {
                sport: {
                    name: 'Soccer',
                },
                fixture: {
                    id: 'future-game',
                    status: 'scheduled',
                    is_live: false,
                },
                scores: {
                    home: {
                        total: 0.0,
                        periods: {},
                    },
                    away: {
                        total: 0.0,
                        periods: {},
                    },
                },
                in_play: {
                    period: null,
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).toBeNull();
        });

        it('Should return null for game in first period with no completed periods', () => {
            const event = {
                sport: {
                    name: 'Basketball',
                },
                fixture: {
                    id: 'early-game',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 12.0,
                        periods: {},
                    },
                    away: {
                        total: 10.0,
                        periods: {},
                    },
                },
                in_play: {
                    period: '1',
                },
            };

            const result = detectCompletedPeriods(event);

            expect(result).toBeNull();
        });
    });

    describe('canResolveMarketForGameIdAndSport', () => {
        it('Should return true when game can be resolved', () => {
            const event = {
                sport: {
                    name: 'Soccer',
                },
                fixture: {
                    id: 'match-123',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 2.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                    away: {
                        total: 1.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                },
                in_play: {
                    period: '2',
                },
            };

            const result = canResolveMarketForGameIdAndSport('match-123', event);

            expect(result).toBe(true);
        });

        it('Should return false when gameId does not match', () => {
            const event = {
                sport: {
                    name: 'Soccer',
                },
                fixture: {
                    id: 'match-456',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 1.0,
                        periods: {
                            period_1: 1.0,
                        },
                    },
                    away: {
                        total: 0.0,
                        periods: {
                            period_1: 0.0,
                        },
                    },
                },
                in_play: {
                    period: '2',
                },
            };

            const result = canResolveMarketForGameIdAndSport('match-999', event);

            expect(result).toBe(false);
        });

        it('Should return false when no periods are completed', () => {
            const event = {
                sport: {
                    name: 'Basketball',
                },
                fixture: {
                    id: 'match-789',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 15.0,
                        periods: {},
                    },
                    away: {
                        total: 12.0,
                        periods: {},
                    },
                },
                in_play: {
                    period: '1',
                },
            };

            const result = canResolveMarketForGameIdAndSport('match-789', event);

            expect(result).toBe(false);
        });
    });

    describe('canResolveMarketViaOpticOddsApi', () => {
        it('Should return period resolution data when available', () => {
            const event = {
                sport: {
                    name: 'Tennis',
                },
                fixture: {
                    id: 'api-test-1',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 1.0,
                        periods: {
                            period_1: 7.0,
                        },
                    },
                    away: {
                        total: 0.0,
                        periods: {
                            period_1: 5.0,
                        },
                    },
                },
                in_play: {
                    period: '2',
                },
            };

            const result = canResolveMarketViaOpticOddsApi(event);

            expect(result).not.toBeNull();
            expect(result?.completedPeriods).toEqual([1]);
            expect(result?.readyForResolution).toBe(true);
        });

        it('Should return null when no periods completed', () => {
            const event = {
                sport: {
                    name: 'Soccer',
                },
                fixture: {
                    id: 'api-test-2',
                    status: 'live',
                    is_live: true,
                },
                scores: {
                    home: {
                        total: 0.0,
                        periods: {},
                    },
                    away: {
                        total: 0.0,
                        periods: {},
                    },
                },
                in_play: {
                    period: '1',
                },
            };

            const result = canResolveMarketViaOpticOddsApi(event);

            expect(result).toBeNull();
        });
    });

    describe('canResolveMarketsForEvent', () => {
        describe('Single typeId checks', () => {
            it('Should return true for 1st period typeId when period 1 is complete (Soccer 2nd half)', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, 10021);
                expect(result).toBe(true);
            });

            it('Should return false for 2nd period typeId when only period 1 is complete', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, 10022);
                expect(result).toBe(false);
            });

            it('Should return false for full game typeId during live game', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, 10001);
                expect(result).toBe(false);
            });

            it('Should return true for full game typeId when game is completed', () => {
                const result = canResolveMarketsForEvent(MockSoccerCompletedEvent, 10001);
                expect(result).toBe(true);
            });

            it('Should return true for 1st quarter typeId when quarter 1 complete (NFL)', () => {
                const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, 10021);
                expect(result).toBe(true);
            });

            it('Should return true for 2nd quarter typeId when quarters 1-2 complete (NFL)', () => {
                const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, 10022);
                expect(result).toBe(true);
            });

            it('Should return false for 3rd quarter typeId during 3rd quarter (NFL)', () => {
                const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, 10023);
                expect(result).toBe(false);
            });

            it('Should return true for all quarter typeIds when game is completed (NFL)', () => {
                expect(canResolveMarketsForEvent(MockNFLCompletedEvent, 10021)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedEvent, 10022)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedEvent, 10023)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedEvent, 10024)).toBe(true);
            });

            it('Should return false when no periods are complete', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveFirstHalf, 10021);
                expect(result).toBe(false);
            });

            it('Should return false for non-existent typeId', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, 99999);
                expect(result).toBe(false);
            });
        });

        describe('Batch typeIds checks', () => {
            it('Should return only resolvable typeIds for live soccer in 2nd half', () => {
                const typeIds = [10021, 10022, 10031, 10001];
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, typeIds);

                expect(result).toEqual([10021, 10031]); // Only period 1 typeIds
            });

            it('Should exclude full game typeIds during live game', () => {
                const typeIds = [10021, 10001, 10002, 10003];
                const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, typeIds);

                expect(result).toEqual([10021]); // Full game typeIds excluded
            });

            it('Should include full game typeIds when game is completed', () => {
                const typeIds = [10021, 10022, 10001, 10002];
                const result = canResolveMarketsForEvent(MockSoccerCompletedEvent, typeIds);

                expect(result).toEqual([10021, 10022, 10001, 10002]);
            });

            it('Should return empty array when no typeIds are resolvable', () => {
                const typeIds = [10022, 10023, 10024];
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, typeIds);

                expect(result).toEqual([]);
            });

            it('Should return multiple period typeIds for NFL game in 3rd quarter', () => {
                const typeIds = [10021, 10022, 10023, 10024, 10031, 10032];
                const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, typeIds);

                // Periods 1 and 2 are complete
                expect(result).toEqual([10021, 10022, 10031, 10032]);
            });

            it('Should handle all 9 periods for completed MLB game', () => {
                const typeIds = [10021, 10022, 10023, 10024, 10025, 10026, 10027, 10028, 10029];
                const result = canResolveMarketsForEvent(MockMLBCompletedEvent, typeIds);

                expect(result).toEqual(typeIds); // All 9 innings complete
            });

            it('Should return empty array when no periods complete', () => {
                const typeIds = [10021, 10022, 10031];
                const result = canResolveMarketsForEvent(MockSoccerLiveFirstHalf, typeIds);

                expect(result).toEqual([]);
            });
        });

        describe('Edge cases', () => {
            it('Should handle event with no completed periods', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveFirstHalfInProgress, 10021);
                expect(result).toBe(false);
            });

            it('Should respect full game typeIds list', () => {
                // Test all full game typeIds
                const fullGameTypeIds = [0, 10001, 10002, 10003, 10004, 10010, 10011, 10012];

                fullGameTypeIds.forEach((typeId) => {
                    const result = canResolveMarketsForEvent(MockNFLLiveThirdQuarter, typeId);
                    expect(result).toBe(false);
                });
            });

            it('Should work with sport name override parameter for single typeId', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, 10021, 'soccer');
                expect(result).toBe(true);
            });

            it('Should work with sport name override parameter for batch typeIds', () => {
                const result = canResolveMarketsForEvent(MockSoccerLiveSecondHalf, [10021, 10022], 'soccer');
                expect(result).toEqual([10021]);
            });
        });

        describe('Real overtime NFL game (Rams vs 49ers)', () => {
            it('Should detect all 5 periods complete including overtime', () => {
                const result = detectCompletedPeriods(MockNFLCompletedWithOvertime);

                expect(result).not.toBeNull();
                expect(result?.completedPeriods).toEqual([1, 2, 3, 4, 5]);
                expect(result?.readyForResolution).toBe(true);
                expect(result?.periodScores['period5']).toEqual({ home: 0.0, away: 3.0 });
            });

            it('Should resolve all quarter typeIds (10021-10024) for completed overtime game', () => {
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10021)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10022)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10023)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10024)).toBe(true);
            });

            it('Should resolve overtime period typeId (10025)', () => {
                const result = canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10025);
                expect(result).toBe(true);
            });

            it('Should resolve full game typeIds for completed overtime game', () => {
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10001)).toBe(true);
                expect(canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10002)).toBe(true);
            });

            it('Should return all resolvable typeIds including overtime in batch check', () => {
                const typeIds = [10021, 10022, 10023, 10024, 10025, 10001];
                const result = canResolveMarketsForEvent(MockNFLCompletedWithOvertime, typeIds);

                expect(result).toEqual(typeIds); // All should be resolvable (game completed with overtime)
            });

            it('Should return false for 8th period typeId (period did not occur)', () => {
                const result = canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10028);
                expect(result).toBe(false);
            });

            it('Should return false for 9th period typeId (period did not occur)', () => {
                const result = canResolveMarketsForEvent(MockNFLCompletedWithOvertime, 10029);
                expect(result).toBe(false);
            });

            it('Should not include non-existent periods in batch check', () => {
                const typeIds = [10021, 10022, 10025, 10028, 10029];
                const result = canResolveMarketsForEvent(MockNFLCompletedWithOvertime, typeIds);

                // Only periods 1, 2, and 5 occurred, so only their typeIds should be returned
                expect(result).toEqual([10021, 10022, 10025]);
            });
        });
    });
});
