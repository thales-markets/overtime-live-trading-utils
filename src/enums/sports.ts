export enum Sport {
    SOCCER = 'Soccer',
    FOOTBALL = 'Football',
    BASKETBALL = 'Basketball',
    BASEBALL = 'Baseball',
    HOCKEY = 'Hockey',
    FIGHTING = 'Fighting',
    TENNIS = 'Tennis',
    ESPORTS = 'eSports',
    RUGBY = 'Rugby',
    VOLLEYBALL = 'Volleyball',
    HANDBALL = 'Handball',
    WATERPOLO = 'Waterpolo',
    CRICKET = 'Cricket',
    MOTOSPORT = 'Motosport',
    GOLF = 'Golf',
    TABLE_TENNIS = 'TableTennis',
    POLITICS = 'Politics',
    FUTURES = 'Futures',
    EMPTY = '',
}

export enum League {
    NCAAF = 1,
    NFL = 2,
    MLB = 3,
    NBA = 4,
    NCAAB = 5,
    NHL = 6,
    UFC = 7,
    WNBA = 8,
    MLS = 10,
    EPL = 11,
    LIGUE_ONE = 12,
    BUNDESLIGA = 13,
    LA_LIGA = 14,
    SERIE_A = 15,
    UEFA_CL = 16,
    UEFA_EL = 17,
    FIFA_WC = 18,
    J1_LEAGUE = 19,
    IPL = 20,
    T20_BLAST = 21,
    IIHF_WORLD_CHAMPIONSHIP = 33,
    COPA_AMERICA = 44,
    COPA_LIBERTADORES = 45,
    UEFA_EURO = 50,
    EREDIVISIE = 57,
    PRIMEIRA_LIGA = 61,
    SUMMER_OLYMPICS_SOCCER_WOMEN = 65,
    SUMMER_OLYMPICS_SOCCER = 66,
    FIFA_WC_WOMEN = 76,
    ENGLAND_FA_CUP = 132,
    FRANCE_CUP = 134,
    SPAIN_CUP = 138,
    ITALY_CUP = 141,
    TENNIS_WTA = 152,
    TENNIS_GS = 153,
    TENNIS_MASTERS = 156,
    SUMMER_OLYMPICS_TENNIS = 158,
    GERMANY_CUP = 209,
    LIGA_MX = 230,
    BRAZIL_1 = 268,
    UEFA_EURO_U21 = 288,
    FIFA_WORLD_CUP_U20 = 296,
    SUMMER_OLYMPICS_HANDBALL_WOMEN = 380,
    SUMMER_OLYMPICS_HANDBALL = 381,
    EUROLEAGUE = 399,
    SUMMER_OLYMPICS_BASKETBALL = 406,
    SUMMER_OLYMPICS_BASKETBALL_WOMEN = 407,
    FIBA_WORLD_CUP = 409,
    FORMULA1 = 445,
    SUMMER_OLYMPICS_BEACH_VOLEYBALL_WOMEN = 453,
    SUMMER_OLYMPICS_BEACH_VOLEYBALL = 454,
    MOTOGP = 497,
    SAUDI_PROFESSIONAL_LEAGUE = 536,
    SUMMER_OLYMPICS_WATERPOLO = 8881,
    SUMMER_OLYMPICS_VOLEYBALL_WOMEN = 8893,
    SUMMER_OLYMPICS_VOLEYBALL = 8894,
    SUMMER_OLYMPICS_TABLE_TENNIS = 8910,
    BOXING = 9196,
    SUMMER_OLYMPICS_RUGBY = 9578,
    SUMMER_OLYMPICS_RUGBY_WOMEN = 9588,
    SUMMER_OLYMPICS_HOCKEY_WOMEN = 9698,
    SUMMER_OLYMPICS_HOCKEY = 9699,
    UEFA_NATIONS_LEAGUE = 9806,
    CONCACAF_NATIONS_LEAGUE = 9821,
    CSGO = 9977,
    DOTA2 = 9983,
    SUMMER_OLYMPICS_BASKETBALL_3X3 = 10071,
    SUMMER_OLYMPICS_BASKETBALL_3X3_WOMEN = 10072,
    SUMMER_OLYMPICS_QUALIFICATION = 10502,
    LOL = 10138,
    CONMEBOL_WC_QUALIFICATIONS = 10199,
    UEFA_CONFERENCE_LEAGUE = 10216,
    NON_TITLE_BOXING = 10595,
    UEFA_CHAMPIONS_LEAGUE_QUALIFICATION = 10611,
    UEFA_EUROPA_LEAGUE_QUALIFICATION = 10613,
    UEFA_CONFERENCE_LEAGUE_QUALIFICATION = 10615,
    US_ELECTION = 20000,
    UEFA_SUPER_CUP = 20001,
    BRAZIL_CUP = 20002,
    ENGLAND_CHAMPIONSHIP = 20011,
    SCOTLAND_PREMIERSHIP = 20101,
    BELGIUM_LEAGUE = 20102,
    CZECH_LEAGUE = 20103,
    CHILE_PRIMERA = 20104,
    FINLAND_LEAGUE = 20105,
    ARGENTINA_PRIMERA = 20106,
    RUSSIA_PREMIER = 20107,
    TURKEY_SUPER_LEAGUE = 20108,
    SERBIA_SUPER_LEAGUE = 20109,
    GREECE_SUPER_LEAGUE = 20110,
    INDIA_PREMIER = 20111,
    CHINA_SUPER_LEAGUE = 20112,
    AUSTRALIA_A_LEAGUE = 20113,
    SWITZERLAND_SUPER_LEAGUE = 20114,
    BUNDESLIGA_2 = 20115,
    LA_LIGA_2 = 20116,
    SERIE_B = 20117,
    INDIA_SUPER_LEAGUE = 20118,
    LIGUE_2 = 20119,
    AUSTRIA_BUNDESLIGA = 20120,
    DENMARK_SUPER_LEAGUE = 20121,
    POLAND_LEAGUE = 20122,
    SWEDEN_LEAGUE = 20123,
    COLOMBIA_PRIMERA_A = 20124,
    ENGLAND_EFL_CUP = 20125,
    ENGLAND_LEGAUE_1 = 20126,
    URUGUAY_PRIMERA_DIVISION = 20127,
    AFC_CHAMPIONS_LEAGUE = 20128,
    ITALY_SUPER_CUP = 20129,
    FRANCE_SUPER_CUP = 20130,
    SPAIN_SUPER_CUP = 20131,
    GERMANY_SUPER_CUP = 20132,
    PORTUGAL_LEAGUE_CUP = 20133,
    THAILAND_LEAGUE_1 = 20134,
    NETHERLANDS_CUP = 20135,
    PORTUGAL_CUP = 20136,
    EUROCUP = 20200,
    SPAIN_LIGA_ACB = 20201,
    ITALY_LEGA_BASKET_SERIE_A = 20202,
    GERMANY_BBL = 20203,
    FRANCE_LNB_PRO_A = 20204,
    CHINA_CBA = 20205,
    AUSTRALIA_NBL = 20206,
    VALORANT = 20300,
    ROCKET_LEAGUE = 20301,
    CALL_OF_DUTY = 20302,
    STARCRAFT = 20303,
    NFL_FUTURES = 30002,
    NBA_FUTURES = 30004,
    NHL_FUTURES = 30006,
    EPL_FUTURES = 30011,
    LIGUE_ONE_FUTURES = 30012,
    BUNDESLIGA_FUTURES = 30013,
    LA_LIGA_FUTURES = 30014,
    SERIE_A_FUTURES = 30015,
    UEFA_CHAMPIONS_LEAGUE_FUTURES = 30016,
    EUROLEAGUE_FUTURES = 30399,
    GOLF_H2H = 100021,
    GOLF_WINNER = 100121,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_0 = 15611,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_1 = 15612,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_2 = 15613,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_3 = 15614,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_4 = 15615,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_5 = 15616,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_6 = 15617,
    TENNIS_ATP_GRAND_SLAM_LIVE_MAPPING_V2_7 = 15618,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_0 = 15211,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_1 = 15212,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_2 = 15213,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_3 = 15214,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_4 = 15215,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_5 = 15216,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_6 = 15217,
    TENNIS_WTA_GRAND_SLAM_LIVE_MAPPING_V2_7 = 15218,
    TENNIS_MASTERS_LIVE_MAPPING_V2_1 = 15622,
    TENNIS_MASTERS_LIVE_MAPPING_V2_2 = 15623,
    TENNIS_MASTERS_LIVE_MAPPING_V2_3 = 15624,
    TENNIS_MASTERS_LIVE_MAPPING_V2_4 = 15625,
    TENNIS_MASTERS_LIVE_MAPPING_V2_5 = 15626,
    TENNIS_MASTERS_LIVE_MAPPING_V2_6 = 15627,
    TENNIS_MASTERS_LIVE_MAPPING_V2_7 = 15628,
    TENNIS_MASTERS_LIVE_MAPPING_V2_8 = 15632,
    TENNIS_MASTERS_LIVE_MAPPING_V2_9 = 15633,
    TENNIS_MASTERS_LIVE_MAPPING_V2_10 = 15634,
    TENNIS_MASTERS_LIVE_MAPPING_V2_11 = 15635,
    TENNIS_MASTERS_LIVE_MAPPING_V2_12 = 15636,
    TENNIS_MASTERS_LIVE_MAPPING_V2_13 = 15637,
    TENNIS_MASTERS_LIVE_MAPPING_V2_14 = 15638,
    TENNIS_MASTERS_LIVE_MAPPING_V2_15 = 15641,
    TENNIS_MASTERS_LIVE_MAPPING_V2_16 = 15642,
    TENNIS_MASTERS_LIVE_MAPPING_V2_17 = 15643,
    TENNIS_MASTERS_LIVE_MAPPING_V2_18 = 15644,
    TENNIS_MASTERS_LIVE_MAPPING_V2_19 = 15645,
    TENNIS_MASTERS_LIVE_MAPPING_V2_20 = 15646,
    TENNIS_MASTERS_LIVE_MAPPING_V2_21 = 15647,
    TENNIS_MASTERS_LIVE_MAPPING_V2_22 = 15648,
    TENNIS_WTA_LIVE_MAPPING_V2_1 = 15222,
    TENNIS_WTA_LIVE_MAPPING_V2_2 = 15223,
    TENNIS_WTA_LIVE_MAPPING_V2_3 = 15224,
    TENNIS_WTA_LIVE_MAPPING_V2_4 = 15225,
    TENNIS_WTA_LIVE_MAPPING_V2_5 = 15226,
    TENNIS_WTA_LIVE_MAPPING_V2_6 = 15227,
    TENNIS_WTA_LIVE_MAPPING_V2_7 = 15228,
    TENNIS_WTA_LIVE_MAPPING_V2_8 = 15231, // Tennis WTA 500 unknown round
    TENNIS_WTA_LIVE_MAPPING_V2_9 = 15232, // Tennis WTA 500 1st round
    TENNIS_WTA_LIVE_MAPPING_V2_10 = 15233, // Tennis WTA 500 2nd round
    TENNIS_WTA_LIVE_MAPPING_V2_11 = 15234, // Tennis WTA 500 3rd round
    TENNIS_WTA_LIVE_MAPPING_V2_12 = 15235, // Tennis WTA 500 4th round
    TENNIS_WTA_LIVE_MAPPING_V2_13 = 15236, // Tennis WTA 500 quarterfinals
    TENNIS_WTA_LIVE_MAPPING_V2_14 = 15237, // Tennis WTA 500 semifinals
    TENNIS_WTA_LIVE_MAPPING_V2_15 = 15238, // Tennis WTA 500 finals
    TENNIS_WTA_LIVE_MAPPING_V2_16 = 15241, // Tennis WTA 250 unknown round
    TENNIS_WTA_LIVE_MAPPING_V2_17 = 15242, // Tennis WTA 250 1st round
    TENNIS_WTA_LIVE_MAPPING_V2_18 = 15243, // Tennis WTA 250 2nd round
    TENNIS_WTA_LIVE_MAPPING_V2_19 = 15244, // Tennis WTA 250 3rd round
    TENNIS_WTA_LIVE_MAPPING_V2_20 = 15245, // Tennis WTA 250 4th round
    TENNIS_WTA_LIVE_MAPPING_V2_21 = 15246, // Tennis WTA 250 quarterfinals
    TENNIS_WTA_LIVE_MAPPING_V2_22 = 15247, // Tennis WTA 250 semifinals
    TENNIS_WTA_LIVE_MAPPING_V2_23 = 15248, // Tennis WTA 250 finals
}

export enum MoneylineTypes {
    MONEYLINE = 'Moneyline',
}

export enum SpreadTypes {
    ASIAN_HANDICAP = 'Asian Handicap',
    GAME_SPREAD = 'Game Spread',
    POINT_SPREAD = 'Point Spread',
    GOAL_SPREAD = 'Goal Spread',
    RUN_LINE = 'Run Line',
    PUCK_LINE = 'Puck Line',
}

export enum TotalTypes {
    TOTAL_GAMES = 'Total Games',
    TOTAL_GOALS = 'Total Goals',
    TOTAL_POINTS = 'Total Points',
    TOTAL_RUNS = 'Total Runs',
}

export enum ScoringType {
    POINTS = 'points',
    GOALS = 'goals',
    ROUNDS = 'rounds',
    SETS = 'sets',
    MAPS = 'maps',
    EMPTY = '',
}

export enum MatchResolveType {
    OVERTIME = 'overtime',
    REGULAR = 'regular',
    EMPTY = '',
}

export enum PeriodType {
    QUARTER = 'quarter',
    HALF = 'half',
    PERIOD = 'period',
    ROUND = 'round',
    INNING = 'inning',
    SET = 'set',
    MAP = 'map',
    EMPTY = '',
}

export enum Provider {
    RUNDOWN = 'rundown',
    ENETPULSE = 'enetpulse',
    JSONODDS = 'jsonOdds',
    OPTICODDS = 'opticOdds',
    EMPTY = '',
}
