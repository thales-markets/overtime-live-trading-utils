import { League, Sport } from '../enums/sports';

export const LeagueMap: Record<number, any> = {
    [League.NCAAF]: {
        sport: Sport.FOOTBALL,
        id: League.NCAAF,
        isDrawAvailable: false,
    },
    [League.NFL]: {
        sport: Sport.FOOTBALL,
        id: League.NFL,
        isDrawAvailable: false,
    },
    [League.MLB]: {
        sport: Sport.BASEBALL,
        id: League.MLB,
        isDrawAvailable: false,
    },
    [League.NBA]: {
        sport: Sport.BASKETBALL,
        id: League.NBA,
        isDrawAvailable: false,
    },
    [League.NCAAB]: {
        sport: Sport.BASKETBALL,
        id: League.NCAAB,
        isDrawAvailable: false,
    },
    [League.NHL]: {
        sport: Sport.HOCKEY,
        id: League.NHL,
        isDrawAvailable: false,
    },
    [League.UFC]: {
        sport: Sport.FIGHTING,
        id: League.UFC,
        isDrawAvailable: false,
    },
    [League.WNBA]: {
        sport: Sport.BASKETBALL,
        id: League.WNBA,
        isDrawAvailable: false,
    },
    [League.MLS]: {
        sport: Sport.SOCCER,
        id: League.MLS,
        isDrawAvailable: true,
    },
    [League.EPL]: {
        sport: Sport.SOCCER,
        id: League.EPL,
        isDrawAvailable: true,
    },
    [League.LIGUE_ONE]: {
        sport: Sport.SOCCER,
        id: League.LIGUE_ONE,
        isDrawAvailable: true,
    },

    [League.BUNDESLIGA]: {
        sport: Sport.SOCCER,
        id: League.BUNDESLIGA,
        isDrawAvailable: true,
    },
    [League.LA_LIGA]: {
        sport: Sport.SOCCER,
        id: League.LA_LIGA,
        isDrawAvailable: true,
    },
    [League.SERIE_A]: {
        sport: Sport.SOCCER,
        id: League.SERIE_A,
        isDrawAvailable: true,
    },
    [League.UEFA_CL]: {
        sport: Sport.SOCCER,
        id: League.UEFA_CL,
        isDrawAvailable: true,
    },
    [League.UEFA_EL]: {
        sport: Sport.SOCCER,
        id: League.UEFA_EL,
        isDrawAvailable: true,
    },
    [League.FIFA_WC]: {
        sport: Sport.SOCCER,
        id: League.FIFA_WC,
        isDrawAvailable: true,
    },
    [League.J1_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.J1_LEAGUE,
        isDrawAvailable: true,
    },
    [League.IPL]: {
        sport: Sport.CRICKET,
        id: League.IPL,
        isDrawAvailable: false,
    },
    [League.T20_BLAST]: {
        sport: Sport.CRICKET,
        id: League.T20_BLAST,
        isDrawAvailable: false,
    },
    [League.IIHF_WORLD_CHAMPIONSHIP]: {
        sport: Sport.HOCKEY,
        id: League.IIHF_WORLD_CHAMPIONSHIP,
        isDrawAvailable: true,
    },
    [League.COPA_AMERICA]: {
        sport: Sport.SOCCER,
        id: League.COPA_AMERICA,
        isDrawAvailable: true,
    },
    [League.COPA_LIBERTADORES]: {
        sport: Sport.SOCCER,
        id: League.COPA_LIBERTADORES,
        isDrawAvailable: true,
    },
    [League.UEFA_EURO]: {
        sport: Sport.SOCCER,
        id: League.UEFA_EURO,
        isDrawAvailable: true,
    },
    [League.EREDIVISIE]: {
        sport: Sport.SOCCER,
        id: League.EREDIVISIE,
        isDrawAvailable: true,
    },
    [League.PRIMEIRA_LIGA]: {
        sport: Sport.SOCCER,
        id: League.PRIMEIRA_LIGA,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_SOCCER_WOMEN]: {
        sport: Sport.SOCCER,
        id: League.SUMMER_OLYMPICS_SOCCER_WOMEN,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_SOCCER]: {
        sport: Sport.SOCCER,
        id: League.SUMMER_OLYMPICS_SOCCER,
        isDrawAvailable: true,
    },
    [League.FIFA_WC_WOMEN]: {
        sport: Sport.SOCCER,
        id: League.FIFA_WC_WOMEN,
        isDrawAvailable: true,
    },
    [League.ENGLAND_CUP]: {
        sport: Sport.SOCCER,
        id: League.ENGLAND_CUP,
        isDrawAvailable: true,
    },
    [League.FRANCE_CUP]: {
        sport: Sport.SOCCER,
        id: League.FRANCE_CUP,
        isDrawAvailable: true,
    },
    [League.SPAIN_CUP]: {
        sport: Sport.SOCCER,
        id: League.SPAIN_CUP,
        isDrawAvailable: true,
    },
    [League.ITALY_CUP]: {
        sport: Sport.SOCCER,
        id: League.ITALY_CUP,
        isDrawAvailable: true,
    },
    [League.TENNIS_WTA]: {
        sport: Sport.TENNIS,
        id: League.TENNIS_WTA,
        isDrawAvailable: false,
    },
    [League.TENNIS_GS]: {
        sport: Sport.TENNIS,
        id: League.TENNIS_GS,
        isDrawAvailable: false,
    },
    [League.TENNIS_MASTERS]: {
        sport: Sport.TENNIS,
        id: League.TENNIS_MASTERS,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_TENNIS]: {
        sport: Sport.TENNIS,
        id: League.SUMMER_OLYMPICS_TENNIS,
        isDrawAvailable: false,
    },
    [League.GERMANY_CUP]: {
        sport: Sport.SOCCER,
        id: League.GERMANY_CUP,
        isDrawAvailable: true,
    },
    [League.LIGA_MX]: {
        sport: Sport.SOCCER,
        id: League.LIGA_MX,
        isDrawAvailable: true,
    },
    [League.BRAZIL_1]: {
        sport: Sport.SOCCER,
        id: League.BRAZIL_1,
        isDrawAvailable: true,
    },
    [League.UEFA_EURO_U21]: {
        sport: Sport.SOCCER,
        id: League.UEFA_EURO_U21,
        isDrawAvailable: true,
    },
    [League.FIFA_WORLD_CUP_U20]: {
        sport: Sport.SOCCER,
        id: League.FIFA_WORLD_CUP_U20,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_HANDBALL_WOMEN]: {
        sport: Sport.HANDBALL,
        id: League.SUMMER_OLYMPICS_HANDBALL_WOMEN,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_HANDBALL]: {
        sport: Sport.HANDBALL,
        id: League.SUMMER_OLYMPICS_HANDBALL,
        isDrawAvailable: true,
    },
    [League.EUROLEAGUE]: {
        sport: Sport.BASKETBALL,
        id: League.EUROLEAGUE,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BASKETBALL]: {
        sport: Sport.BASKETBALL,
        id: League.SUMMER_OLYMPICS_BASKETBALL,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BASKETBALL_WOMEN]: {
        sport: Sport.BASKETBALL,
        id: League.SUMMER_OLYMPICS_BASKETBALL_WOMEN,
        isDrawAvailable: false,
    },
    [League.FIBA_WORLD_CUP]: {
        sport: Sport.BASKETBALL,
        id: League.FIBA_WORLD_CUP,
        isDrawAvailable: false,
    },
    [League.FORMULA1]: {
        sport: Sport.MOTOSPORT,
        id: League.FORMULA1,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BEACH_VOLEYBALL_WOMEN]: {
        sport: Sport.VOLLEYBALL,
        id: League.SUMMER_OLYMPICS_BEACH_VOLEYBALL_WOMEN,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BEACH_VOLEYBALL]: {
        sport: Sport.VOLLEYBALL,
        id: League.SUMMER_OLYMPICS_BEACH_VOLEYBALL,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_TABLE_TENNIS]: {
        sport: Sport.TABLE_TENNIS,
        id: League.SUMMER_OLYMPICS_TABLE_TENNIS,
        isDrawAvailable: false,
    },
    [League.MOTOGP]: {
        sport: Sport.MOTOSPORT,
        id: League.MOTOGP,
        isDrawAvailable: false,
    },
    [League.SAUDI_PROFESSIONAL_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.SAUDI_PROFESSIONAL_LEAGUE,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_WATERPOLO]: {
        sport: Sport.WATERPOLO,
        id: League.SUMMER_OLYMPICS_WATERPOLO,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_VOLEYBALL_WOMEN]: {
        sport: Sport.VOLLEYBALL,
        id: League.SUMMER_OLYMPICS_VOLEYBALL_WOMEN,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_VOLEYBALL]: {
        sport: Sport.VOLLEYBALL,
        id: League.SUMMER_OLYMPICS_VOLEYBALL,
        isDrawAvailable: false,
    },
    [League.BOXING]: {
        sport: Sport.FIGHTING,
        id: League.BOXING,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_RUGBY]: {
        sport: Sport.RUGBY,
        id: League.SUMMER_OLYMPICS_RUGBY,
        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_RUGBY_WOMEN]: {
        sport: Sport.RUGBY,
        id: League.SUMMER_OLYMPICS_RUGBY_WOMEN,

        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_HOCKEY_WOMEN]: {
        sport: Sport.HOCKEY,
        id: League.SUMMER_OLYMPICS_HOCKEY_WOMEN,

        isDrawAvailable: true,
    },
    [League.SUMMER_OLYMPICS_HOCKEY]: {
        sport: Sport.HOCKEY,
        id: League.SUMMER_OLYMPICS_HOCKEY,
        isDrawAvailable: true,
    },
    [League.UEFA_NATIONS_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.UEFA_NATIONS_LEAGUE,
        isDrawAvailable: true,
    },
    [League.CONCACAF_NATIONS_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.CONCACAF_NATIONS_LEAGUE,
        isDrawAvailable: true,
    },
    [League.CSGO]: {
        sport: Sport.ESPORTS,
        id: League.CSGO,
        isDrawAvailable: false,
    },
    [League.DOTA2]: {
        sport: Sport.ESPORTS,
        id: League.DOTA2,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BASKETBALL_3X3]: {
        sport: Sport.BASKETBALL,
        id: League.SUMMER_OLYMPICS_BASKETBALL_3X3,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_BASKETBALL_3X3_WOMEN]: {
        sport: Sport.BASKETBALL,
        id: League.SUMMER_OLYMPICS_BASKETBALL_3X3_WOMEN,
        isDrawAvailable: false,
    },
    [League.SUMMER_OLYMPICS_QUALIFICATION]: {
        sport: Sport.BASKETBALL,
        id: League.SUMMER_OLYMPICS_QUALIFICATION,
        isDrawAvailable: false,
    },
    [League.LOL]: {
        sport: Sport.ESPORTS,
        id: League.LOL,
        isDrawAvailable: false,
    },
    [League.CONMEBOL_WC_QUALIFICATIONS]: {
        sport: Sport.SOCCER,
        id: League.CONMEBOL_WC_QUALIFICATIONS,
        isDrawAvailable: true,
    },
    [League.UEFA_CONFERENCE_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.UEFA_CONFERENCE_LEAGUE,
        isDrawAvailable: true,
    },
    [League.NON_TITLE_BOXING]: {
        sport: Sport.FIGHTING,
        id: League.NON_TITLE_BOXING,
        isDrawAvailable: false,
    },
    [League.UEFA_CHAMPIONS_LEAGUE_QUALIFICATION]: {
        sport: Sport.SOCCER,
        id: League.UEFA_CHAMPIONS_LEAGUE_QUALIFICATION,
        isDrawAvailable: true,
    },
    [League.UEFA_EUROPA_LEAGUE_QUALIFICATION]: {
        sport: Sport.SOCCER,
        id: League.UEFA_EUROPA_LEAGUE_QUALIFICATION,
        isDrawAvailable: true,
    },
    [League.UEFA_CONFERENCE_LEAGUE_QUALIFICATION]: {
        sport: Sport.SOCCER,
        id: League.UEFA_CONFERENCE_LEAGUE_QUALIFICATION,
        isDrawAvailable: true,
    },
    [League.US_ELECTION]: {
        sport: Sport.POLITICS,
        id: League.US_ELECTION,
        isDrawAvailable: false,
    },
    [League.UEFA_SUPER_CUP]: {
        sport: Sport.SOCCER,
        id: League.UEFA_SUPER_CUP,
        isDrawAvailable: true,
    },
    [League.BRAZIL_CUP]: {
        sport: Sport.SOCCER,
        id: League.BRAZIL_CUP,
        isDrawAvailable: true,
    },
    [League.ENGLAND_CHAMPIONSHIP]: {
        sport: Sport.SOCCER,
        id: League.ENGLAND_CHAMPIONSHIP,
        isDrawAvailable: true,
    },
    [League.SCOTLAND_PREMIERSHIP]: {
        sport: Sport.SOCCER,
        id: League.SCOTLAND_PREMIERSHIP,
        isDrawAvailable: true,
    },
    [League.BELGIUM_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.BELGIUM_LEAGUE,
        isDrawAvailable: true,
    },
    [League.CZECH_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.CZECH_LEAGUE,
        isDrawAvailable: true,
    },
    [League.CHILE_PRIMERA]: {
        sport: Sport.SOCCER,
        id: League.CHILE_PRIMERA,
        isDrawAvailable: true,
    },
    [League.FINLAND_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.FINLAND_LEAGUE,
        isDrawAvailable: true,
    },
    [League.ARGENTINA_PRIMERA]: {
        sport: Sport.SOCCER,
        id: League.ARGENTINA_PRIMERA,
        isDrawAvailable: true,
    },
    [League.RUSSIA_PREMIER]: {
        sport: Sport.SOCCER,
        id: League.RUSSIA_PREMIER,
        isDrawAvailable: true,
    },
    [League.TURKEY_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.TURKEY_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.SERBIA_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.SERBIA_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.GREECE_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.GREECE_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.INDIA_PREMIER]: {
        sport: Sport.SOCCER,
        id: League.INDIA_PREMIER,
        isDrawAvailable: true,
    },
    [League.CHINA_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.CHINA_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.AUSTRALIA_A_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.AUSTRALIA_A_LEAGUE,
        isDrawAvailable: true,
    },
    [League.SWITZERLAND_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.SWITZERLAND_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.BUNDESLIGA_2]: {
        sport: Sport.SOCCER,
        id: League.BUNDESLIGA_2,
        isDrawAvailable: true,
    },
    [League.LA_LIGA_2]: {
        sport: Sport.SOCCER,
        id: League.LA_LIGA_2,
        isDrawAvailable: true,
    },
    [League.SERIE_B]: {
        sport: Sport.SOCCER,
        id: League.SERIE_B,
        isDrawAvailable: true,
    },
    [League.INDIA_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.INDIA_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.LIGUE_2]: {
        sport: Sport.SOCCER,
        id: League.LIGUE_2,
        isDrawAvailable: true,
    },
    [League.AUSTRIA_BUNDESLIGA]: {
        sport: Sport.SOCCER,
        id: League.AUSTRIA_BUNDESLIGA,
        isDrawAvailable: true,
    },
    [League.DENMARK_SUPER_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.DENMARK_SUPER_LEAGUE,
        isDrawAvailable: true,
    },
    [League.POLAND_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.POLAND_LEAGUE,
        isDrawAvailable: true,
    },
    [League.SWEDEN_LEAGUE]: {
        sport: Sport.SOCCER,
        id: League.SWEDEN_LEAGUE,
        isDrawAvailable: true,
    },
    [League.COLOMBIA_PRIMERA_A]: {
        sport: Sport.SOCCER,
        id: League.COLOMBIA_PRIMERA_A,
        isDrawAvailable: true,
    },
    [League.ENGLAND_EFL_CUP]: {
        sport: Sport.SOCCER,
        id: League.ENGLAND_EFL_CUP,
        isDrawAvailable: true,
    },
    [League.ENGLAND_LEGAUE_1]: {
        sport: Sport.SOCCER,
        id: League.ENGLAND_LEGAUE_1,
        isDrawAvailable: true,
    },
    [League.URUGUAY_PRIMERA_DIVISION]: {
        sport: Sport.SOCCER,
        id: League.URUGUAY_PRIMERA_DIVISION,
        isDrawAvailable: true,
    },
    [League.EUROCUP]: {
        sport: Sport.BASKETBALL,
        id: League.EUROCUP,
        isDrawAvailable: false,
    },
    [League.GOLF_H2H]: {
        sport: Sport.GOLF,
        id: League.GOLF_H2H,
        isDrawAvailable: false,
    },
    [League.GOLF_WINNER]: {
        sport: Sport.GOLF,
        id: League.GOLF_WINNER,
        isDrawAvailable: false,
    },
};

export const VOLLEYBALL_SET_THRESHOLD = 2;
export const VOLLEYBALL_POINTS_LIMIT = 20;
export const VOLLEYBALL_FIFTH_SET_POINTS_LIMIT = 10;
export const TENNIS_ATP_GRAND_SLAM_SET_THRESHOLD = 2;
export const TENNIS_MASTERS_SET_THRESHOLD = 1;
export const TENNIS_GEMS_LIMIT = 5;
