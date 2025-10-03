export const MockSoccerCompletedEvent = {
    sport: {
        id: 'soccer',
        name: 'Soccer',
        numerical_id: 21,
    },
    league: {
        id: 'uefa_-_europa_league',
        name: 'UEFA - Europa League',
        numerical_id: 509,
    },
    fixture: {
        id: '20251002AB93FFC5',
        numerical_id: 429108,
        game_id: '16626-12858-2025-10-02',
        start_date: '2025-10-02T19:00:00Z',
        home_competitors: [
            {
                id: 'DC1527777738',
                name: 'Olympique Lyonnais',
                numerical_id: 7382,
                base_id: 5395,
                abbreviation: 'OL',
                logo: 'https://cdn.opticodds.com/team-logos/soccer/5395.png',
            },
        ],
        away_competitors: [
            {
                id: 'C4E90D506D0DA0CF',
                name: 'FC Salzburg',
                numerical_id: 84904,
                base_id: 2909,
                abbreviation: 'RBS',
                logo: 'https://cdn.opticodds.com/team-logos/soccer/2909.png',
            },
        ],
        home_team_display: 'Olympique Lyonnais',
        away_team_display: 'FC Salzburg',
        status: 'completed',
        is_live: false,
        season_type: 'Group Stage',
        season_year: '2025',
        season_week: '2',
        venue_name: 'Groupama Stadium',
        venue_location: 'Lyon, France',
        venue_neutral: false,
    },
    scores: {
        home: {
            total: 2.0,
            periods: {
                period_1: 1.0,
                period_2: 1.0,
            },
            aggregate: null,
        },
        away: {
            total: 0.0,
            periods: {
                period_1: 0.0,
                period_2: 0.0,
            },
            aggregate: null,
        },
    },
    in_play: {
        period: '0',
        clock: null,
    },
};

export const MockSoccerLiveSecondHalf = {
    sport: {
        id: 'soccer',
        name: 'Soccer',
        numerical_id: 21,
    },
    league: {
        id: 'uefa_-_europa_league',
        name: 'UEFA - Europa League',
        numerical_id: 509,
    },
    fixture: {
        id: '20251002AB93FFC6',
        numerical_id: 429109,
        game_id: '16626-12858-2025-10-02-live',
        start_date: '2025-10-02T19:00:00Z',
        home_team_display: 'Manchester United',
        away_team_display: 'Arsenal',
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
        clock: '65',
    },
};

export const MockSoccerLiveFirstHalf = {
    sport: {
        id: 'soccer',
        name: 'Soccer',
        numerical_id: 21,
    },
    league: {
        id: 'premier_league',
        name: 'Premier League',
        numerical_id: 39,
    },
    fixture: {
        id: '20251002AB93FFC7',
        numerical_id: 429110,
        game_id: '16626-12858-2025-10-02-live-1st',
        start_date: '2025-10-02T15:00:00Z',
        home_team_display: 'Liverpool',
        away_team_display: 'Chelsea',
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
        clock: '25',
    },
};

export const MockNFLCompletedEvent = {
    sport: {
        id: 'football',
        name: 'Football',
        numerical_id: 9,
    },
    league: {
        id: 'nfl',
        name: 'NFL',
        numerical_id: 367,
    },
    fixture: {
        id: '202509284609FA09',
        numerical_id: 258642,
        game_id: '18124-37240-25-38',
        start_date: '2025-09-28T17:00:00Z',
        home_competitors: [
            {
                id: '04E3F3D69B89',
                name: 'New England Patriots',
                numerical_id: 104,
                base_id: 102,
                abbreviation: 'NE',
                logo: 'https://cdn.opticodds.com/team-logos/football/102.png',
            },
        ],
        away_competitors: [
            {
                id: 'EB5E972AB475',
                name: 'Carolina Panthers',
                numerical_id: 87,
                base_id: 85,
                abbreviation: 'CAR',
                logo: 'https://cdn.opticodds.com/team-logos/football/85.png',
            },
        ],
        home_team_display: 'New England Patriots',
        away_team_display: 'Carolina Panthers',
        status: 'completed',
        is_live: false,
        season_type: 'Regular Season',
        season_year: '2025',
        season_week: '4',
        venue_name: 'Gillette Stadium',
        venue_location: 'Foxborough, MA, USA',
        venue_neutral: false,
    },
    scores: {
        home: {
            total: 42.0,
            periods: {
                period_1: 7.0,
                period_2: 21.0,
                period_3: 7.0,
                period_4: 7.0,
            },
            aggregate: null,
        },
        away: {
            total: 13.0,
            periods: {
                period_1: 6.0,
                period_2: 0.0,
                period_3: 0.0,
                period_4: 7.0,
            },
            aggregate: null,
        },
    },
    in_play: {
        period: '4',
        clock: null,
    },
};

export const MockNFLLiveThirdQuarter = {
    sport: {
        id: 'football',
        name: 'Football',
        numerical_id: 9,
    },
    league: {
        id: 'nfl',
        name: 'NFL',
        numerical_id: 367,
    },
    fixture: {
        id: '202509284609FA10',
        numerical_id: 258643,
        game_id: '18124-37240-25-39',
        start_date: '2025-09-28T20:00:00Z',
        home_team_display: 'Kansas City Chiefs',
        away_team_display: 'Las Vegas Raiders',
        status: 'live',
        is_live: true,
    },
    scores: {
        home: {
            total: 21.0,
            periods: {
                period_1: 7.0,
                period_2: 14.0,
            },
        },
        away: {
            total: 10.0,
            periods: {
                period_1: 3.0,
                period_2: 7.0,
            },
        },
    },
    in_play: {
        period: '3',
        clock: '8:45',
    },
};

export const MockMLBCompletedEvent = {
    sport: {
        id: 'baseball',
        name: 'Baseball',
        numerical_id: 3,
    },
    league: {
        id: 'mlb',
        name: 'MLB',
        numerical_id: 346,
    },
    fixture: {
        id: '202510021B73729D',
        numerical_id: 470566,
        game_id: '81005-40644-2025-10-02-12',
        start_date: '2025-10-02T19:08:00Z',
        home_competitors: [
            {
                id: 'D4F7181B2181',
                name: 'Cleveland Guardians',
                numerical_id: 25,
                base_id: 25,
                abbreviation: 'CLE',
                logo: 'https://cdn.opticodds.com/team-logos/baseball/25.png',
            },
        ],
        away_competitors: [
            {
                id: 'BF57CF7C7E07',
                name: 'Detroit Tigers',
                numerical_id: 27,
                base_id: 27,
                abbreviation: 'DET',
                logo: 'https://cdn.opticodds.com/team-logos/baseball/27.png',
            },
        ],
        home_team_display: 'Cleveland Guardians',
        away_team_display: 'Detroit Tigers',
        status: 'completed',
        is_live: false,
        season_type: 'Wild Card',
        season_year: '2025',
        season_week: '110',
        venue_name: 'Progressive Field',
        venue_location: 'Cleveland, OH, USA',
        venue_neutral: false,
    },
    scores: {
        home: {
            total: 3.0,
            periods: {
                period_1: 0.0,
                period_2: 0.0,
                period_3: 0.0,
                period_4: 1.0,
                period_5: 0.0,
                period_6: 0.0,
                period_7: 0.0,
                period_8: 2.0,
                period_9: 0.0,
            },
            aggregate: null,
        },
        away: {
            total: 6.0,
            periods: {
                period_1: 0.0,
                period_2: 0.0,
                period_3: 1.0,
                period_4: 0.0,
                period_5: 0.0,
                period_6: 1.0,
                period_7: 4.0,
                period_8: 0.0,
                period_9: 0.0,
            },
            aggregate: null,
        },
    },
    in_play: {
        period: '9',
        clock: null,
    },
};

export const MockMLBLiveSixthInning = {
    sport: {
        id: 'baseball',
        name: 'Baseball',
        numerical_id: 3,
    },
    league: {
        id: 'mlb',
        name: 'MLB',
        numerical_id: 346,
    },
    fixture: {
        id: '202510021B73729E',
        numerical_id: 470567,
        game_id: '81005-40644-2025-10-02-13',
        start_date: '2025-10-02T20:00:00Z',
        home_team_display: 'New York Yankees',
        away_team_display: 'Boston Red Sox',
        status: 'live',
        is_live: true,
    },
    scores: {
        home: {
            total: 4.0,
            periods: {
                period_1: 0.0,
                period_2: 2.0,
                period_3: 1.0,
                period_4: 0.0,
                period_5: 1.0,
            },
        },
        away: {
            total: 2.0,
            periods: {
                period_1: 1.0,
                period_2: 0.0,
                period_3: 0.0,
                period_4: 0.0,
                period_5: 1.0,
            },
        },
    },
    in_play: {
        period: '6',
        clock: null,
    },
};

export const MockSoccerLiveFirstHalfInProgress = {
    sport: {
        id: 'soccer',
        name: 'Soccer',
        numerical_id: 21,
    },
    league: {
        id: 'brazil_-_serie_b',
        name: 'Brazil - Serie B',
        numerical_id: 72,
    },
    fixture: {
        id: '202510027E3BDC35',
        numerical_id: 409114,
        game_id: '51303-41888-2025-10-02',
        start_date: '2025-10-02T22:00:00Z',
        home_team_display: 'Paysandu SC',
        away_team_display: 'Cuiabá EC',
        status: 'live',
        is_live: true,
    },
    scores: {
        home: {
            total: 0.0,
            periods: {
                period_1: 0.0,
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
        period: '1H',
        clock: '46',
    },
};

export const MockNFLCompletedWithOvertime = {
    sport: {
        id: 'football',
        name: 'Football',
        numerical_id: 9,
    },
    league: {
        id: 'nfl',
        name: 'NFL',
        numerical_id: 367,
    },
    fixture: {
        id: '202510038AE3D4E4',
        numerical_id: 258529,
        game_id: '78014-13184-25-39',
        start_date: '2025-10-03T00:15:00Z',
        home_competitors: [
            {
                id: '13AD4FDBEBA8',
                name: 'Los Angeles Rams',
                numerical_id: 101,
                base_id: 99,
                abbreviation: 'LAR',
                logo: 'https://cdn.opticodds.com/team-logos/football/99.png',
            },
        ],
        away_competitors: [
            {
                id: '132B64CEDAC4',
                name: 'San Francisco 49ers',
                numerical_id: 110,
                base_id: 108,
                abbreviation: 'SF',
                logo: 'https://cdn.opticodds.com/team-logos/football/108.png',
            },
        ],
        home_team_display: 'Los Angeles Rams',
        away_team_display: 'San Francisco 49ers',
        status: 'completed',
        is_live: false,
        season_type: 'Regular Season',
        season_year: '2025',
        season_week: '5',
        venue_name: 'SoFi Stadium',
        venue_location: 'Inglewood, CA, USA',
        venue_neutral: false,
    },
    scores: {
        home: {
            total: 23.0,
            periods: {
                period_1: 0.0,
                period_2: 7.0,
                period_3: 7.0,
                period_4: 9.0,
                period_5: 0.0,
            },
            aggregate: null,
        },
        away: {
            total: 26.0,
            periods: {
                period_1: 7.0,
                period_2: 10.0,
                period_3: 3.0,
                period_4: 3.0,
                period_5: 3.0,
            },
            aggregate: null,
        },
    },
    in_play: {
        period: '5',
        clock: null,
    },
};
