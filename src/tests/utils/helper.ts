export const getLastPolledMapForBookmakers = () => {
    const lastPolledMap = new Map<string, number>();
    lastPolledMap.set('draftkings', Date.now());
    lastPolledMap.set('bovada', Date.now());
    return lastPolledMap;
};
