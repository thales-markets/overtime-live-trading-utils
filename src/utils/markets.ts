import * as oddslib from 'oddslib';
import { TAG_CHILD_SPREAD, TAG_CHILD_TOTALS, ZERO } from '../constants/common';
import {
    filterOddsByMarketNameBookmaker,
    formatSpreadOdds,
    getParentOdds,
    groupAndFormatChildOdds,
    processTotalOdds,
} from './odds';
import { getBetTypesForLeague, getLeagueSpreadType, getLeagueTotalType } from './sports';
import { MoneylineTypes } from '../enums/sports';
import { getSpreadData, adjustSpreadOnOdds } from './spread';
/**
 * Processes a single sports event. This function maps event data to a specific format,
 * filters invalid events, and optionally fetches player properties if the sport supports it.
 * Returns the mapped event object or null if the event is filtered out or mapping results in a null object.
 *
 * @param {Object} market - The market API object to process
 * @param {Object} apiResponseWithOdds - Provider's API object to process
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Array} spreadData - Spread data for odds.
 * @param {Boolean} isDrawAvailable - Is it two or three-positional sport
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Number} maxPercentageDiffBetwenOdds - Maximum allowed percentage difference between same position odds from different providers
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Promise<Object|null>} A promise that resolves to the processed event object or null if the event is invalid or mapping fails.
 */
export const processMarket = (
    market,
    apiResponseWithOdds,
    liveOddsProviders,
    spreadData,
    isDrawAvailable,
    defaultSpreadForLiveMarkets,
    maxPercentageDiffBetwenOdds,
    isTestnet
) => {
    const sportSpreadData = spreadData.filter((data) => data.sportId === String(market.leagueId));

    const moneylineOdds = getParentOdds(
        !isDrawAvailable,
        sportSpreadData,
        liveOddsProviders,
        apiResponseWithOdds,
        market.leagueId,
        defaultSpreadForLiveMarkets,
        maxPercentageDiffBetwenOdds
    );

    if (moneylineOdds.errorMessage) {
        market.odds = market.odds.map(() => {
            return {
                american: 0,
                decimal: 0,
                normalizedImplied: 0,
            };
        });
        market.errorMessage = moneylineOdds.errorMessage;
    } else {
        // Pack market odds for UI
        market.odds = moneylineOdds.odds
            .filter((odd) => odd != 0)
            .map((_odd) => {
                return {
                    american: oddslib.from('impliedProbability', _odd).to('moneyline'),
                    decimal: oddslib.from('impliedProbability', _odd).to('decimal'),
                    normalizedImplied: _odd,
                };
            });
    }

    const childMarkets = getChildMarkets(
        market,
        sportSpreadData,
        apiResponseWithOdds,
        liveOddsProviders,
        defaultSpreadForLiveMarkets,
        isTestnet
    );

    const packedChildMarkets = childMarkets.map((childMarket: any) => {
        const preparedMarket = { ...market, ...childMarket };
        if (preparedMarket.odds.length > 0) {
            preparedMarket.odds = preparedMarket.odds.map((_odd) => {
                if (_odd == 0) {
                    return {
                        american: 0,
                        decimal: 0,
                        normalizedImplied: 0,
                    };
                }

                return {
                    american: oddslib.from('impliedProbability', _odd).to('moneyline'),
                    decimal: oddslib.from('impliedProbability', _odd).to('decimal'),
                    normalizedImplied: _odd,
                };
            });
        }
        return preparedMarket;
    });
    market.childMarkets = packedChildMarkets;

    return market;
};

/**
 * Retrieves the child markets for the given event.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Array} The child markets for the event.
 */
const getChildMarkets = (
    market,
    spreadDataForSport,
    apiResponseWithOdds,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    isTestnet
) => {
    let childMarkets = [];

    // Create Spread Child Markets
    childMarkets = childMarkets.concat(
        createSpreadChildMarkets(
            apiResponseWithOdds,
            market.leagueId,
            spreadDataForSport,
            liveOddsProviders,
            defaultSpreadForLiveMarkets,
            isTestnet
        )
    );

    // Create Total Child Markets
    childMarkets = childMarkets.concat(
        createTotalChildMarkets(
            apiResponseWithOdds,
            market.leagueId,
            spreadDataForSport,
            liveOddsProviders,
            defaultSpreadForLiveMarkets,
            isTestnet
        )
    );

    return childMarkets;
};

/**
 * Creates spread child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Array} The spread child markets.
 */
export const createChildMarkets = (
    apiResponseWithOdds,
    market,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    isTestnet
) => {
    const commonData = {
        homeTeam: apiResponseWithOdds.home_team,
        awayTeam: apiResponseWithOdds.away_team,
    };
    const betTypes = getBetTypesForLeague(market.leagueId, isTestnet)
        .filter((betType) => betType != MoneylineTypes.MONEYLINE) // remove moneyline from child markets
        .map((betType) => betType.toLowerCase()); // convert bet type to lower case so we can filter in next step by lower case

    const allChildOdds = filterOddsByMarketNameBookmaker(apiResponseWithOdds.odds, betTypes, liveOddsProviders[0]);
    const validChildOdds = allChildOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5);
    const groupedOdds = groupAndFormatChildOdds(allChildOdds, commonData);
    groupedOdds.forEach(({ line, odds }) => {
        let homeTeamOdds = convertOddsToImpl(odds[0]) || ZERO;
        let awayTeamOdds = convertOddsToImpl(odds[1]) || ZERO;
        let isZeroOddsChild = homeTeamOdds === ZERO || awayTeamOdds === ZERO;

        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(
                spreadDataForSport,
                market.leagueId,
                market.typeId,
                defaultSpreadForLiveMarkets
            );
            let adjustedOdds;
            if (spreadData !== null) {
                adjustedOdds = adjustSpreadOnOdds(
                    [homeTeamOdds, awayTeamOdds],
                    spreadData.minSpread,
                    spreadData.targetSpread
                );
            } else {
                adjustedOdds = adjustSpreadOnOdds([homeTeamOdds, awayTeamOdds], defaultSpreadForLiveMarkets, 0);
            }

            [homeTeamOdds, awayTeamOdds] = adjustedOdds;
        }

        const minOdds = process.env.MIN_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;
        const maxOdds = process.env.MAX_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;

        if (
            !(
                minOdds &&
                maxOdds &&
                (homeTeamOdds >= minOdds ||
                    homeTeamOdds <= maxOdds ||
                    awayTeamOdds >= minOdds ||
                    awayTeamOdds <= maxOdds)
            )
        ) {
            childMarkets.push({
                leagueId,
                typeId: typeId,
                type: 'spread',
                line: line,
                odds: [homeTeamOdds, awayTeamOdds],
            });
        }
    });
    // adjust spread data
    // restrict min, max odds
    // pack child market
};

/**
 * Creates spread child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Array} The spread child markets.
 */
export const createSpreadChildMarkets = (
    apiResponseWithOdds,
    leagueId,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    isTestnet
) => {
    const childMarkets = [] as any;
    const spreadType = getLeagueSpreadType(leagueId, isTestnet);
    const commonData = {
        homeTeam: apiResponseWithOdds.home_team,
        awayTeam: apiResponseWithOdds.away_team,
    };
    if (spreadType) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const allSpreadOdds = filterOddsByMarketNameBookmaker(
            apiResponseWithOdds.odds,
            spreadType,
            liveOddsProviders[0]
        );

        if (allSpreadOdds.length > 0) {
            const formattedSpreadOdds = formatSpreadOdds(
                allSpreadOdds,
                commonData,
                leagueId,
                spreadDataForSport,
                TAG_CHILD_SPREAD,
                defaultSpreadForLiveMarkets
            );

            childMarkets.push(...formattedSpreadOdds);
        }
    } else {
        console.warn(`Spread type for sport ID ${leagueId} not found.`);
    }
    return childMarkets;
};

/**
 * Creates total child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Array} The total child markets.
 */
export const createTotalChildMarkets = (
    apiResponseWithOdds,
    leagueId,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    isTestnet
) => {
    const childMarkets = [] as any;
    const totalType = getLeagueTotalType(leagueId, isTestnet);

    if (totalType) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const totalOdds = filterOddsByMarketNameBookmaker(apiResponseWithOdds.odds, totalType, liveOddsProviders[0]);

        if (totalOdds.length > 0) {
            childMarkets.push(
                ...processTotalOdds(
                    totalOdds,
                    leagueId,
                    spreadDataForSport,
                    TAG_CHILD_TOTALS,
                    defaultSpreadForLiveMarkets
                )
            );
        }
    } else {
        console.warn(`Configuration (totals) for sport ID ${leagueId} not found.`);
    }
    return childMarkets;
};
