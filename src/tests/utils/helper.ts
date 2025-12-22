import { LastPolledArray } from '../../types/sports';

export const getLastPolledDataForBookmakers = () => {
    const lastPolledData: LastPolledArray = [];
    lastPolledData.push({ sportsbook: 'draftkings', timestamp: Date.now() });
    lastPolledData.push({ sportsbook: 'bovada', timestamp: Date.now() });
    lastPolledData.push({ sportsbook: 'superbet', timestamp: Date.now() });
    return lastPolledData;
};

export const getPlayersMap = () => {
    const playersMap: Map<string, number> = new Map<string, number>();
    playersMap
        .set('0C07D14CC5DC', 13234)
        .set('AD91EA260284', 56789)
        .set('674851E026BC', 98765)
        .set('CC707B1EADE5', 54321)
        .set('JKL012', 11223)
        .set('GHI789', 44556)
        .set('ABC123', 77889)
        .set('DEF456', 99001);
    return playersMap;
};
export const MAX_PERCENTAGE_DIFF_FOR_PP_LINES_MOCK = 10; // 10%, used for tests, the production value is from env variable

export const MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST = 30000; // 30 seconds
