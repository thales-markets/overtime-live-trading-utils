import { League, Sport, getLeagueSport } from 'overtime-utils';
import { ScoresObject } from '../types/odds';

export const checkGameContraints = (
    opticOddsScoresApiResponse: ScoresObject,
    marketLeague: League,
    constraintsMap: Map<Sport, number>
) => {
    const marketSport = getLeagueSport(marketLeague);
    const homeTeam = opticOddsScoresApiResponse.homeTeam;
    const awayTeam = opticOddsScoresApiResponse.awayTeam;

    const currentClock = opticOddsScoresApiResponse.clock;
    const currentPeriod = opticOddsScoresApiResponse.period;
    const currentGameStatus = opticOddsScoresApiResponse.status;

    if (currentGameStatus.toLowerCase() == 'completed') {
        return {
            allow: false,
            message: `Blocking game because it is no longer live.`,
        };
    }

    if (marketSport === Sport.SOCCER) {
        return allowSoccerGame(homeTeam, awayTeam, currentClock, currentPeriod, constraintsMap.get(Sport.SOCCER));
    }

    return {
        allow: true,
        message: `The sport ${marketLeague} does not have constraint`,
    };
};

export const allowGameSportWithPeriodConstraint = (
    homeTeam: string,
    awayTeam: string,
    currentPeriod: number,
    periodLimitForLiveTrade: number
) => {
    if (!Number.isNaN(currentPeriod) && currentPeriod >= periodLimitForLiveTrade) {
        return {
            allow: false,
            message: `Blocking game due to period: ${currentPeriod}. period`,
        };
    }
    return { allow: true, message: '' };
};

export const allowSoccerGame = (
    homeTeam: string,
    awayTeam: string,
    currentClock: string,
    currentPeriod: string,
    soccerMinuteLimitForLiveTrading: number | undefined
) => {
    const currentClockNumber = Number(currentClock);
    if (
        (!Number.isNaN(currentClockNumber) &&
            soccerMinuteLimitForLiveTrading !== undefined &&
            currentClockNumber >= soccerMinuteLimitForLiveTrading) ||
        (Number.isNaN(currentClockNumber) && currentPeriod.toLowerCase() != 'half')
    ) {
        return { allow: false, message: `Blocking game due to clock: ${currentClock}min` };
    }

    return { allow: true, message: '' };
};

export const allowGameSportWithResultConstraint = (
    opticOddsScoresApiResponse: ScoresObject,
    homeTeam: string,
    awayTeam: string,
    currentPeriod: string,
    currentScoreHome: number,
    currentScoreAway: number,
    marketLeague: League,
    marketSport: Sport
) => {
    const setInProgress = Number(currentPeriod);
    const currentResultInSet = fetchResultInCurrentSet(setInProgress, opticOddsScoresApiResponse);
    const atpGrandSlamMatch = opticOddsScoresApiResponse.league.toLowerCase() == 'atp';
    const currentSetsScore = { home: currentScoreHome, away: currentScoreAway };

    if (marketSport == Sport.VOLLEYBALL) {
        if (setInProgress == 5) {
            return checkResultConstraint(
                homeTeam,
                awayTeam,
                currentResultInSet,
                currentSetsScore,
                VOLLEYBALL_SET_THRESHOLD,
                VOLLEYBALL_FIFTH_SET_POINTS_LIMIT
            );
        } else {
            return checkResultConstraint(
                homeTeam,
                awayTeam,
                currentResultInSet,
                currentSetsScore,
                VOLLEYBALL_SET_THRESHOLD,
                VOLLEYBALL_POINTS_LIMIT
            );
        }
    }

    if (marketLeague.toString().startsWith(League.TENNIS_GS.toString()) && atpGrandSlamMatch) {
        return checkResultConstraint(
            homeTeam,
            awayTeam,
            currentResultInSet,
            currentSetsScore,
            TENNIS_ATP_GRAND_SLAM_SET_THRESHOLD,
            TENNIS_GEMS_LIMIT
        );
    }

    if (
        (marketLeague.toString().startsWith(League.TENNIS_GS.toString()) && !atpGrandSlamMatch) ||
        marketLeague.toString().startsWith(League.TENNIS_MASTERS.toString()) ||
        marketLeague.toString().startsWith(League.SUMMER_OLYMPICS_TENNIS.toString()) ||
        marketLeague.toString().startsWith(League.TENNIS_WTA.toString()) ||
        marketLeague.toString().startsWith(League.TENNIS_ATP_CHALLENGER.toString())
    ) {
        return checkResultConstraint(
            homeTeam,
            awayTeam,
            currentResultInSet,
            currentSetsScore,
            TENNIS_MASTERS_SET_THRESHOLD,
            TENNIS_GEMS_LIMIT
        );
    }

    return {
        allow: true,
        message: `The sport ${marketLeague} does not have result constraint`,
    };
};

export const fetchResultInCurrentSet = (currentSet: number, opticOddsScoresApiResponse: ScoresObject) => {
    let currentHomeGameScore = 0;
    let currentAwayGameScore = 0;
    switch (currentSet) {
        case 1:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.homePeriod1);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.awayPeriod1);
            break;
        case 2:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.homePeriod2);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.awayPeriod2);
            break;
        case 3:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.homePeriod3);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.awayPeriod3);
            break;
        case 4:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.homePeriod4);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.awayPeriod4);
            break;
        case 5:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.homePeriod5);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.awayPeriod5);
            break;
    }
    return { home: currentHomeGameScore, away: currentAwayGameScore };
};

const checkResultConstraint = (
    homeTeam: string,
    awayTeam: string,
    currentResultInSet: { home: number; away: number },
    currentSetsWon: { home: number; away: number },
    setThreshold: number,
    resultLimit: number
) => {
    if (Number(currentSetsWon.home) == setThreshold || Number(currentSetsWon.away) == setThreshold) {
        if (Number(currentSetsWon.home) == setThreshold && currentResultInSet.home >= resultLimit) {
            return {
                allow: false,
                message: `Blocking game due to current result: ${currentSetsWon.home} - ${currentSetsWon.away} (${currentResultInSet.home} - ${currentResultInSet.away})`,
            };
        }

        if (Number(currentSetsWon.away) == setThreshold && currentResultInSet.away >= resultLimit) {
            return {
                allow: false,
                message: `Blocking game due to current result: ${currentSetsWon.home} - ${currentSetsWon.away} (${currentResultInSet.home} - ${currentResultInSet.away})`,
            };
        }
        return {
            allow: true,
            message: '',
            currentHomeGameScore: currentResultInSet.home,
            currentAwayGameScore: currentResultInSet.away,
        };
    }
    return {
        allow: true,
        message: '',
        currentHomeGameScore: currentResultInSet.home,
        currentAwayGameScore: currentResultInSet.away,
    };
};

const VOLLEYBALL_SET_THRESHOLD = 2;
const VOLLEYBALL_POINTS_LIMIT = 20;
const VOLLEYBALL_FIFTH_SET_POINTS_LIMIT = 10;
const TENNIS_ATP_GRAND_SLAM_SET_THRESHOLD = 2;
const TENNIS_MASTERS_SET_THRESHOLD = 1;
const TENNIS_GEMS_LIMIT = 5;
