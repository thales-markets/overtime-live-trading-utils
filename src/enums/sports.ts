export const Sport = {
    SOCCER: 'Soccer',
    FOOTBALL: 'Football',
    BASKETBALL: 'Basketball',
    BASEBALL: 'Baseball',
    HOCKEY: 'Hockey',
    FIGHTING: 'Fighting',
    TENNIS: 'Tennis',
    ESPORTS: 'eSports',
    CRICKET: 'Cricket',
    MOTOSPORT: 'Motosport',
    GOLF: 'Golf',
    EMPTY: '',
};

export const League = {
    NCAAF: 1,
    NFL: 2,
    MLB: 3,
    NBA: 4,
    NCAAB: 5,
    NHL: 6,
    UFC: 7,
    WNBA: 8,
    MLS: 10,
    EPL: 11,
    LIGUE_ONE: 12,
    BUNDESLIGA: 13,
    LA_LIGA: 14,
    SERIE_A: 15,
    UEFA_CL: 16,
    UEFA_EL: 17,
    FIFA_WC: 18,
    J1_LEAGUE: 19,
    IPL: 20,
    T20_BLAST: 21,
    IIHF_WORLD_CHAMPIONSHIP: 33,
    COPA_AMERICA: 44,
    COPA_LIBERTADORES: 45,
    UEFA_EURO: 50,
    EREDIVISIE: 57,
    PRIMEIRA_LIGA: 61,
    FIFA_WC_WOMEN: 76,
    ENGLAND_CUP: 132,
    FRANCE_CUP: 134,
    SPAIN_CUP: 138,
    ITALY_CUP: 141,
    TENNIS_GS: 153,
    TENNIS_MASTERS: 156,
    GERMANY_CUP: 209,
    LIGA_MX: 230,
    BRAZIL_1: 268,
    UEFA_EURO_U21: 288,
    FIFA_WORLD_CUP_U20: 296,
    EUROLEAGUE: 399,
    FIBA_WORLD_CUP: 409,
    FORMULA1: 445,
    MOTOGP: 497,
    SAUDI_PROFESSIONAL_LEAGUE: 536,
    BOXING: 9196,
    UEFA_NATIONS_LEAGUE: 9806,
    CONCACAF_NATIONS_LEAGUE: 9821,
    CSGO: 9977,
    DOTA2: 9983,
    SUMMER_OLYMPICS_QUALIFICATION: 10502,
    LOL: 10138,
    CONMEBOL_WC_QUALIFICATIONS: 10199,
    UEFA_CONFERENCE_LEAGUE: 10216,
    NON_TITLE_BOXING: 10595,
    GOLF_H2H: 100021,
    GOLF_WINNER: 100121,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_1: 15312,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_2: 15313,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_3: 15314,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_4: 15315,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_5: 15316,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_6: 15317,
    TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_7: 15318,
    TENNIS_MASTERS_LIVE_MAPPING_V2_1: 15622,
    TENNIS_MASTERS_LIVE_MAPPING_V2_2: 15623,
    TENNIS_MASTERS_LIVE_MAPPING_V2_3: 15624,
    TENNIS_MASTERS_LIVE_MAPPING_V2_4: 15625,
    TENNIS_MASTERS_LIVE_MAPPING_V2_5: 15626,
    TENNIS_MASTERS_LIVE_MAPPING_V2_6: 15627,
    TENNIS_MASTERS_LIVE_MAPPING_V2_7: 15628,
    TENNIS_MASTERS_LIVE_MAPPING_V2_8: 15632,
    TENNIS_MASTERS_LIVE_MAPPING_V2_9: 15633,
    TENNIS_MASTERS_LIVE_MAPPING_V2_10: 15634,
    TENNIS_MASTERS_LIVE_MAPPING_V2_11: 15635,
    TENNIS_MASTERS_LIVE_MAPPING_V2_12: 15636,
    TENNIS_MASTERS_LIVE_MAPPING_V2_13: 15637,
    TENNIS_MASTERS_LIVE_MAPPING_V2_14: 15638,
    TENNIS_MASTERS_LIVE_MAPPING_V2_15: 15641,
    TENNIS_MASTERS_LIVE_MAPPING_V2_16: 15642,
    TENNIS_MASTERS_LIVE_MAPPING_V2_17: 15643,
    TENNIS_MASTERS_LIVE_MAPPING_V2_18: 15644,
    TENNIS_MASTERS_LIVE_MAPPING_V2_19: 15645,
    TENNIS_MASTERS_LIVE_MAPPING_V2_20: 15646,
    TENNIS_MASTERS_LIVE_MAPPING_V2_21: 15647,
    TENNIS_MASTERS_LIVE_MAPPING_V2_22: 15648,
    UEFA_CHAMPIONS_LEAGUE_QUALIFICATION: 10611,
    UEFA_EUROPA_LEAGUE_QUALIFICATION: 10613,
    UEFA_CONFERENCE_LEAGUE_QUALIFICATION: 10615,
};

export const LEAGUES_NO_FORMAL_HOME_AWAY = [
    League.CSGO,
    League.DOTA2,
    League.LOL,
    League.TENNIS_GS,
    League.TENNIS_MASTERS,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_1,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_2,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_3,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_4,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_5,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_6,
    League.TENNIS_GRAND_SLAM_LIVE_MAPPING_V2_7,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_1,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_2,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_3,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_4,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_5,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_6,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_7,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_8,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_9,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_10,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_11,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_12,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_13,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_14,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_15,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_16,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_17,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_18,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_19,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_20,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_21,
    League.TENNIS_MASTERS_LIVE_MAPPING_V2_22,
];
