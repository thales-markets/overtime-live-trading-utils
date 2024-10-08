import * as oddslib from 'oddslib';
import { DRAW, LIVE_TYPE_ID_BASE, MIN_ODDS_FOR_DIFF_CHECKING, ZERO } from '../constants/common';
import { checkOddsFromBookmakers } from './bookmakers';
import { adjustSpreadOnOdds, getSpreadData } from './spread';
import { MoneylineTypes } from '../enums/sports';

/**
 * Filters the odds array to find moneyline odds.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Object} commonData - The common data object.
 * @param {boolean} isTwoPositionalSport - Indicates if the sport is a two positional sport.,
 * @returns {Map} The filtered map for odds per provider.
 */
export const filterMoneylineOddsByTeamNameBookmaker = (
    oddsArray,
    liveOddsProviders,
    commonData,
    isTwoPositionalSport
) => {
    const linesMap = new Map<any, any>();
    liveOddsProviders.forEach((oddsProvider) => {
        let homeOdds,
            awayOdds,
            drawOdds = 0;
        oddsArray.forEach((odd) => {
            if (
                odd &&
                odd.market_name.toLowerCase() === MoneylineTypes.MONEYLINE.toLowerCase() &&
                odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
            ) {
                if (odd.selection.toLowerCase() === commonData.homeTeam.toLowerCase()) {
                    homeOdds = odd.price;
                }
                if (odd.selection.toLowerCase() === commonData.awayTeam.toLowerCase()) {
                    awayOdds = odd.price;
                }
                if (!isTwoPositionalSport && odd.selection.toLowerCase() === DRAW.toLowerCase()) {
                    drawOdds = odd.price;
                }
            }
        });

        linesMap.set(oddsProvider.toLowerCase(), {
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            drawOdds: drawOdds,
        });
    });
    return linesMap;
};

/**
 * Retrieves the parent odds for the given event.
 *
 * @param {boolean} isTwoPositionalSport - Indicates if the sport is a two positional sport.
 * @param {Array} sportSpreadData - Spread data specific to the sport.
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Object} oddsApiObject - Odds data from the API.
 * @param {String} sportId - Sport ID API.
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @param {Number} maxPercentageDiffBetwenOdds - Maximum allowed percentage difference between same position odds from different providers
 * @returns {Array} The parent odds for the event [homeOdds, awayOdds, drawOdds].
 */
export const getParentOdds = (
    isTwoPositionalSport,
    sportSpreadData,
    liveOddsProviders,
    oddsApiObject,
    sportId,
    defaultSpreadForLiveMarkets,
    maxPercentageDiffBetwenOdds
) => {
    const commonData = { homeTeam: oddsApiObject.home_team, awayTeam: oddsApiObject.away_team };

    // EXTRACTING ODDS FROM THE RESPONSE PER MARKET NAME AND BOOKMAKER
    const moneylineOddsMap = filterMoneylineOddsByTeamNameBookmaker(
        oddsApiObject.odds,
        liveOddsProviders,
        commonData,
        isTwoPositionalSport
    );

    // CHECKING AND COMPARING ODDS FOR THE GIVEN BOOKMAKERS
    const oddsObject = checkOddsFromBookmakers(
        moneylineOddsMap,
        liveOddsProviders,
        isTwoPositionalSport,
        maxPercentageDiffBetwenOdds,
        MIN_ODDS_FOR_DIFF_CHECKING
    );

    if (oddsObject.errorMessage) {
        return {
            odds: isTwoPositionalSport ? [0, 0] : [0, 0, 0],
            errorMessage: oddsObject.errorMessage,
        };
    }
    const primaryBookmakerOdds = isTwoPositionalSport
        ? [oddsObject.homeOdds, oddsObject.awayOdds]
        : [oddsObject.homeOdds, oddsObject.awayOdds, oddsObject.drawOdds];

    let parentOdds = primaryBookmakerOdds.map((odd) => convertOddsToImpl(odd));
    const spreadData = getSpreadData(sportSpreadData, sportId, LIVE_TYPE_ID_BASE, defaultSpreadForLiveMarkets);

    if (spreadData !== null) {
        parentOdds = adjustSpreadOnOdds(parentOdds, spreadData.minSpread, spreadData.targetSpread);
    } else {
        // Use min spread by sport if available, otherwise use default min spread
        parentOdds = adjustSpreadOnOdds(parentOdds, defaultSpreadForLiveMarkets, 0);
    }
    return { odds: parentOdds };
};

// TODO: Expand this method to support multiple marketNames
/**
 * Filters the odds array to find entries matching the specified market name.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {string} marketName - The market name to filter by.
 * @param {string} oddsProvider - The main odds provider to filter by.
 * @returns {Array} The filtered odds array.
 */
export const filterOddsByMarketNameBookmaker = (oddsArray, marketName, oddsProvider) => {
    return oddsArray.filter(
        (odd) =>
            odd.market_name.toLowerCase() === marketName.toLowerCase() &&
            odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
    );
};

// TODO: Unify the same code from formatSpreadOdds method and from processTotalOdds method
/**
 * Formats the spread odds and creates market objects.
 *
 * @param {Array} spreadOdds - The spread odds array.
 * @param {Object} commonData - The common data object.
 * @param {Object} market - The sport ID from the API.
 * @param {Array} spreadDataForSport - Spread data for the sport.
 * @param {Number} typeId - typeID
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @returns {Array} The formatted spread markets.
 */
export const formatSpreadOdds = (
    spreadOdds,
    commonData,
    leagueId,
    spreadDataForSport,
    typeId,
    defaultSpreadForLiveMarkets
) => {
    const childMarkets = [] as any;
    const validSpreadOdds = spreadOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5) as any;
    const formattedSpreadOdds = groupAndFormatSpreadOdds(validSpreadOdds, commonData);

    formattedSpreadOdds.forEach(({ line, odds }) => {
        let homeTeamOdds = convertOddsToImpl(odds[0]) || ZERO;
        let awayTeamOdds = convertOddsToImpl(odds[1]) || ZERO;
        let isZeroOddsChild = homeTeamOdds === ZERO || awayTeamOdds === ZERO;

        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(spreadDataForSport, leagueId, typeId, defaultSpreadForLiveMarkets);
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
    return childMarkets;
};

/**
 * Processes total odds to create market objects.
 *
 * @param {Array} totalOdds - The total odds array.
 * @param {Object} commonData - The common data object.
 * @param {Object} market - The sport ID from the API.
 * @param {Array} spreadDataForSport - Spread data for the sport.
 * @param {Number} typeId - typeID
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @returns {Array} The processed total odds market objects.
 */
export const processTotalOdds = (totalOdds, leagueId, spreadDataForSport, typeId, defaultSpreadForLiveMarkets) => {
    const childMarkets = [] as any;
    const validTotalOdds = totalOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5);
    const groupedOdds = groupOddsBySelectionAndPoints(validTotalOdds);
    const iterableGroupedOdds = Object.entries(groupedOdds) as any;

    iterableGroupedOdds.forEach(([key, { over, under }]) => {
        const [_, selection_points] = key.split('_');

        let overOdds = convertOddsToImpl(over) || ZERO;
        let underOdds = convertOddsToImpl(under) || ZERO;
        let isZeroOddsChild = overOdds === ZERO || underOdds === ZERO;

        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(spreadDataForSport, leagueId, typeId, defaultSpreadForLiveMarkets);
            let adjustedOdds;
            if (spreadData !== null) {
                adjustedOdds = adjustSpreadOnOdds([overOdds, underOdds], spreadData.minSpread, spreadData.targetSpread);
            } else {
                adjustedOdds = adjustSpreadOnOdds([overOdds, underOdds], defaultSpreadForLiveMarkets, 0);
            }

            [overOdds, underOdds] = adjustedOdds;
        }

        const minOdds = process.env.MIN_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;
        const maxOdds = process.env.MAX_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;

        if (
            !(
                minOdds &&
                maxOdds &&
                (overOdds >= minOdds || overOdds <= maxOdds || underOdds >= minOdds || underOdds <= maxOdds)
            )
        ) {
            childMarkets.push({
                leagueId,
                typeId: typeId,
                type: 'total',
                line: parseFloat(selection_points),
                odds: [overOdds, underOdds],
            });
        }
    });

    return childMarkets;
};

/**
 * Groups spread odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam information.
 * @returns {Array} The grouped and formatted spread odds.
 */
export const groupAndFormatSpreadOdds = (oddsArray, commonData) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { selection_points, price, selection } = odd;
        const isHomeTeam = selection === commonData.homeTeam;

        const key = isHomeTeam ? selection_points : -selection_points;

        if (!acc[key]) {
            acc[key] = { home: null, away: null };
        }

        if (isHomeTeam) {
            acc[key].home = price;
        } else {
            acc[key].away = price;
        }

        return acc;
    }, {}) as any;
    // Format the grouped odds into the desired output
    const formattedOdds = (Object.entries(groupedOdds as any) as any).reduce((acc, [key, value]) => {
        const line = parseFloat(key);
        if ((value as any).home !== null && (value as any).away !== null) {
            acc.push({
                line: line as any,
                odds: [(value as any).home, (value as any).away],
            });
        }
        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Groups odds by selection and points over/under.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @returns {Object} The grouped odds.
 */
export const groupOddsBySelectionAndPoints = (oddsArray) => {
    return oddsArray.reduce((acc, odd) => {
        if (odd) {
            const key = `${odd.selection}_${odd.selection_points}`;
            if (!acc[key]) {
                acc[key] = { over: null, under: null };
            }
            if (odd.selection_line === 'over') {
                acc[key].over = odd.price;
            } else if (odd.selection_line === 'under') {
                acc[key].under = odd.price;
            }
        }

        return acc;
    }, {});
};

/**
 * Converts a given odds value from one format to another.
 * Specifically, it converts from 'moneyline' to 'impliedProbability', handling special cases.
 *
 * @param {Number} odds - The odds value to convert.
 * @returns {Number} The converted odds value.
 */
const convertOddsToImpl = (odds) => {
    return odds === ZERO ? 0 : getOddsFromTo('decimal', 'impliedProbability', odds);
};

/**
 * Converts odds from one format to another.
 * @param {String} from - The original odds format.
 * @param {String} to - The target odds format.
 * @param {Number} input - The odds value.
 * @returns {Number} The converted odds.
 */
const getOddsFromTo = (from, to, input) => {
    try {
        return oddslib.from(from, input).to(to);
    } catch (error) {
        return 0;
    }
};
