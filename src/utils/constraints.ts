import { League, Sport, getLeagueSport } from 'overtime-utils';
import { GAME_CLOCK_ERROR, GAME_NOT_LIVE } from '../constants/errors';
import { ScoresObject } from '../types/odds';

export const checkGameContraints = (
    opticOddsScoresApiResponse: ScoresObject,
    marketLeague: League,
    constraintsMap: Map<Sport, number>
) => {
    const marketSport = getLeagueSport(marketLeague);

    const currentClock = opticOddsScoresApiResponse.clock;
    const currentPeriod = opticOddsScoresApiResponse.period;
    const currentGameStatus = opticOddsScoresApiResponse.status;

    if (currentGameStatus.toLowerCase() == 'completed') {
        return {
            allow: false,
            message: GAME_NOT_LIVE,
        };
    }

    if (marketSport === Sport.SOCCER) {
        return allowSoccerGame(currentClock, currentPeriod, constraintsMap.get(Sport.SOCCER));
    }

    return {
        allow: true,
        message: `The sport ${marketLeague} does not have constraint`,
    };
};

export const allowSoccerGame = (
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
        return { allow: false, message: `${GAME_CLOCK_ERROR} ${currentClock}min` };
    }

    return { allow: true, message: '' };
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
