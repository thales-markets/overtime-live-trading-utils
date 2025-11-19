import { LastPolledArray } from '../../types/sports';

export const getLastPolledMapForBookmakers = () => {
    const lastPolledMap: LastPolledArray = [];
    lastPolledMap.push({ sportsbook: 'draftkings', timestamp: Date.now() });
    lastPolledMap.push({ sportsbook: 'bovada', timestamp: Date.now() });
    return lastPolledMap;
};

export const MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST = 30000; // 30 seconds
