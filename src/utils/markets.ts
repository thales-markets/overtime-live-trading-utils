import * as oddslib from 'oddslib';
import { Anchor, OddsObject } from '../types/odds';
import { LastPolledArray } from '../types/sports';
import { generateMarkets } from './odds';
import { getLeagueInfo } from './sports';
import { adjustAddedSpread } from './spread';
/**
 * Processes a single sports event. This function maps event data to a specific format,
 * filters invalid events, and optionally fetches player properties if the sport supports it.
 * Returns the mapped event object or null if the event is filtered out or mapping results in a null object.
 *
 * @param {Object} market - The market API object to process
 * @param {Object} apiResponseWithOdds - Provider's API object to process
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Boolean} isDrawAvailable - Is it two or three-positional sport
 * @param {Object} leagueMap - League map for additional league information
 * @param {LastPolledArray} lastPolledData - Array containing last polled timestamps for bookmakers
 * @param {Number} maxAllowedProviderDataStaleDelay - Maximum allowed delay for provider data to be considered fresh
 * @param {Map<string, number>} playersMap - Map of player OO IDs to our internal player ID
 * @returns {Promise<Object|null>} A promise that resolves to the processed event object or null if the event is invalid or mapping fails.
 */
export const processMarket = (
    market: any,
    apiResponseWithOdds: OddsObject,
    liveOddsProviders: any,
    anchors: Anchor[],
    leagueMap: any,
    lastPolledData: LastPolledArray,
    maxAllowedProviderDataStaleDelay: number,
    playersMap: Map<string, number>
) => {
    const leagueInfo = getLeagueInfo(market.leagueId, leagueMap);

    const allMarkets = generateMarkets(
        apiResponseWithOdds,
        market.leagueId,
        liveOddsProviders,
        leagueMap,
        lastPolledData,
        maxAllowedProviderDataStaleDelay,
        anchors,
        playersMap
    );

    market.odds = market.odds.map(() => {
        return {
            american: 0,
            decimal: 0,
            normalizedImplied: 0,
        };
    });

    const packedChildMarkets = allMarkets.map((childMarket: any) => {
        // parent odds
        if (childMarket.typeId === 0) {
            console.log('Adjusting parent market odds with added spread if applicable');
            const oddsAfterSpread = adjustAddedSpread(childMarket.odds, leagueInfo, childMarket.typeId);
            market.odds = oddsAfterSpread.map((probability) => {
                if (probability == 0) {
                    return {
                        american: 0,
                        decimal: 0,
                        normalizedImplied: 0,
                    };
                }

                return {
                    american: oddslib.from('impliedProbability', probability).to('moneyline'),
                    decimal: Number(oddslib.from('impliedProbability', probability).to('decimal').toFixed(10)),
                    normalizedImplied: probability,
                };
            });
        } else {
            const preparedMarket = { ...market, ...childMarket };
            const oddsAfterSpread = adjustAddedSpread(preparedMarket.odds, leagueInfo, preparedMarket.typeId);
            if (preparedMarket.odds.length > 0) {
                preparedMarket.odds = oddsAfterSpread.map((probability) => {
                    if (probability == 0) {
                        return {
                            american: 0,
                            decimal: 0,
                            normalizedImplied: 0,
                        };
                    }

                    return {
                        american: oddslib.from('impliedProbability', probability).to('moneyline'),
                        decimal: Number(oddslib.from('impliedProbability', probability).to('decimal').toFixed(10)),
                        normalizedImplied: probability,
                    };
                });
            }
            return preparedMarket;
        }
    });
    market.childMarkets = packedChildMarkets;

    return market;
};
