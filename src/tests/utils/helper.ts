import { LastPolledArray } from '../../types/sports';

export const getLastPolledDataForBookmakers = () => {
    const lastPolledData: LastPolledArray = [];
    lastPolledData.push({ sportsbook: 'draftkings', timestamp: Date.now() });
    lastPolledData.push({ sportsbook: 'bovada', timestamp: Date.now() });
    return lastPolledData;
};

export const MAX_ALLOWED_PROVIDER_DATA_STALE_DELAY_TEST = 30000; // 30 seconds
