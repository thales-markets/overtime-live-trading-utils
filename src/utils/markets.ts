import { getLeagueIsDrawAvailable, MarketType } from 'overtime-utils';
import { ProcessMarketParams } from '../types/odds';
import { LastPolledArray } from '../types/sports';
import { formatOddsForUi, generateMarkets } from './odds';
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
 * @param {Object} leagueMap - League map for additional league information
 * @param {LastPolledArray} lastPolledData - Array containing last polled timestamps for bookmakers
 * @param {Number} maxAllowedProviderDataStaleDelay - Maximum allowed delay for provider data to be considered fresh
 * @param {Map<string, number>} playersMap - Map of player OO IDs to our internal player ID
 * @returns {Promise<Object|null>} A promise that resolves to the processed event object or null if the event is invalid or mapping fails.
 */
export const processMarket = (params: ProcessMarketParams) => {
    const {
        market,
        apiResponseWithOdds,
        liveOddsProviders,
        anchors,
        leagueMap,
        lastPolledData,
        maxAllowedProviderDataStaleDelay,
        playersMap,
        maxPercentageDiffForLines,
    } = params;

    const leagueInfo = getLeagueInfo(market.leagueId, leagueMap);

    const { childMarkets: allMarkets, errorsMap: errorMessageMap } = generateMarkets(
        apiResponseWithOdds,
        market.leagueId,
        liveOddsProviders,
        leagueMap,
        lastPolledData,
        maxAllowedProviderDataStaleDelay,
        anchors,
        playersMap,
        maxPercentageDiffForLines
    );

    market.errorsMap = errorMessageMap;

    market.odds = market.odds.map(() => {
        return {
            american: 0,
            decimal: 0,
            normalizedImplied: 0,
        };
    });

    const packedChildMarkets = allMarkets.map((childMarket: any) => {
        // parent odds
        if (childMarket.typeId === MarketType.WINNER) {
            let oddsAfterSpread = adjustAddedSpread(childMarket.odds, leagueInfo, childMarket.typeId);

            const isThreePositionalSport = getLeagueIsDrawAvailable(market.leagueId);

            // If this is a 3-positional sport but only 2 odds are available (missing draw), pad with zero
            if (isThreePositionalSport && oddsAfterSpread.length === 2) {
                oddsAfterSpread = [...oddsAfterSpread, 0];
            }

            market.odds = oddsAfterSpread.map((probability) => {
                return formatOddsForUi(probability);
            });
        } else {
            const preparedMarket = { ...market, ...childMarket };
            const oddsAfterSpread = adjustAddedSpread(preparedMarket.odds, leagueInfo, preparedMarket.typeId);
            if (preparedMarket.odds.length > 0) {
                preparedMarket.odds = oddsAfterSpread.map((probability) => {
                    return formatOddsForUi(probability);
                });
            }
            return preparedMarket;
        }
    });
    market.childMarkets = packedChildMarkets.filter((m: any) => m !== undefined);

    return market;
};
