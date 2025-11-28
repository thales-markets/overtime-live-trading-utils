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
    playersMap.set('0C07D14CC5DC', 13234);
    playersMap.set('AD91EA260284', 56789);
    playersMap.set('674851E026BC', 98765);
    return playersMap;
};

export const MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST = 30000; // 30 seconds
