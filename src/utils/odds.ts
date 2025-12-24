import * as oddslib from 'oddslib';
import { isOneSideExtendedPlayerPropsMarket, MarketType, MarketTypeMap } from 'overtime-utils';
import { DRAW, ZERO } from '../constants/common';
import { NO_MARKETS_FOR_LEAGUE_ID } from '../constants/errors';
import { LiveMarketType } from '../enums/sports';
import { Anchor, HomeAwayTeams, Odd, OddsObject, OddsWithLeagueInfo } from '../types/odds';
import { ChildMarket, LastPolledArray, LeagueConfigInfo } from '../types/sports';
import { checkOdds } from './bookmakers';
import { getLeagueInfo } from './sports';
import { sanityCheckForOdds } from './spread';

/**
 * Converts a given odds value from one format to another.
 * Specifically, it converts from 'moneyline' to 'impliedProbability', handling special cases.
 *
 * @param {Number} odds - The odds value to convert.
 * @returns {Number} The converted odds value.
 */
export const convertOddsToImpl = (odds: number): number => {
    return odds === ZERO ? 0 : getOddsFromTo('decimal', 'impliedProbability', odds);
};

/**
 * Converts odds from one format to another.
 * @param {String} from - The original odds format.
 * @param {String} to - The target odds format.
 * @param {Number} input - The odds value.
 * @returns {Number} The converted odds.
 */
export const getOddsFromTo = (from: string, to: string, input: number): number => {
    try {
        return oddslib.from(from, input).to(to);
    } catch (error) {
        return 0;
    }
};

/**
 * Creates  child markets based on the given parameters.
 *
 * @param {Object} leagueId - leagueId AKA sportId
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} leagueMap - League Map info
 * @returns {Array} The child markets.
 */
export const generateMarkets: (
    apiResponseWithOdds: OddsObject,
    leagueId: number,
    liveOddsProviders: any,
    leagueMap: any,
    lastPolledData: LastPolledArray,
    maxAllowedProviderDataStaleDelay: number,
    anchors: Anchor[],
    playersMap: Map<string, number>,
    maxPercentageDiffForPPLines: number
) => { childMarkets: ChildMarket[]; errorMessageMap: Map<number, string> } = (
    apiResponseWithOdds,
    leagueId,
    liveOddsProviders,
    leagueMap,
    lastPolledData,
    maxAllowedProviderDataStaleDelay,
    anchors,
    playersMap,
    maxPercentageDiffForPPLines
) => {
    const [spreadOdds, totalOdds, moneylineOdds, correctScoreOdds, doubleChanceOdds, ggOdds, childMarkets]: any[] = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ];
    const leagueInfo = getLeagueInfo(leagueId, leagueMap);
    const commonData = {
        homeTeam: apiResponseWithOdds.homeTeam,
        awayTeam: apiResponseWithOdds.awayTeam,
    };

    if (leagueInfo.length > 0) {
        const odds = filterOdds(apiResponseWithOdds.odds, leagueInfo, playersMap);
        const { odds: checkedOdds, errorMessageMap } = checkOdds(
            odds,
            leagueInfo,
            liveOddsProviders,
            lastPolledData,
            maxAllowedProviderDataStaleDelay,
            anchors,
            maxPercentageDiffForPPLines
        );
        checkedOdds.forEach((odd) => {
            if (odd.type === LiveMarketType.TOTAL) {
                if (Math.abs(Number(odd.points) % 1) === 0.5) totalOdds.push(odd);
            } else if (odd.type === LiveMarketType.SPREAD) {
                if (Math.abs(Number(odd.points) % 1) === 0.5) spreadOdds.push(odd);
            } else if (odd.type === LiveMarketType.MONEYLINE) {
                moneylineOdds.push(odd);
            } else if (odd.type === LiveMarketType.CORRECT_SCORE) {
                correctScoreOdds.push(odd);
            } else if (odd.type === LiveMarketType.DOUBLE_CHANCE) {
                doubleChanceOdds.push(odd);
            } else if (odd.type === LiveMarketType.BOTH_TEAMS_TO_SCORE) {
                ggOdds.push(odd);
            }
        });

        const homeAwayFormattedOdds = [
            ...groupAndFormatSpreadOdds(spreadOdds, commonData),
            ...groupAndFormatTotalOdds(totalOdds, commonData), // playerProps are handled inside this function
            ...groupAndFormatMoneylineOdds(moneylineOdds, commonData),
            ...groupAndFormatGGOdds(ggOdds),
            ...groupAndFormatDoubleChanceOdds(doubleChanceOdds, commonData),
        ];
        const otherFormattedOdds = [...groupAndFormatCorrectScoreOdds(correctScoreOdds, commonData)];

        // odds are converted to implied probability inside adjustSpreadOnChildOdds
        const homeAwayOddsSanityChecked = sanityCheck(homeAwayFormattedOdds);

        homeAwayOddsSanityChecked.forEach((data) => {
            let childMarket = {
                leagueId: Number(data.sportId),
                typeId: Number(data.typeId),
                type: MarketTypeMap[data.typeId as MarketType]?.key || '',
                line: Number(data.line || 0),
                odds: data.odds,
                playerProps: {
                    playerId: 0,
                    playerName: '',
                },
                isPlayerPropsMarket: false,
            };
            if (data.playerProps) {
                childMarket = {
                    ...childMarket,
                    playerProps: {
                        playerId: playersMap.get(data.playerProps.playerId.toString()) || 0, // convert from opticOdds playerId to our internal playerId
                        playerName: data.playerProps.playerName,
                    },
                    isPlayerPropsMarket: true,
                };
            }

            const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(data.typeId));
            const minOdds = leagueInfoByTypeId?.minOdds; // minimum odds configured for child market (e.g. 0.95 implied probability)
            const maxOdds = leagueInfoByTypeId?.maxOdds; // maximum odds configured for child market (e.g. 0.05 implied probability)

            if (minOdds && maxOdds) {
                const allowZeroOdds = [
                    LiveMarketType.TOTAL,
                    LiveMarketType.SPREAD,
                    LiveMarketType.MONEYLINE,
                    LiveMarketType.DOUBLE_CHANCE,
                ].includes(data.type);
                const conditionToAddChildMarket = data.odds.every(
                    (odd: number) => (odd < minOdds && odd > maxOdds) || (allowZeroOdds && odd === ZERO)
                );
                if (conditionToAddChildMarket) {
                    childMarkets.push(childMarket);
                }
            } else {
                childMarkets.push(childMarket);
            }
        });

        otherFormattedOdds.forEach((data) => {
            const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(data.typeId));
            const minOdds = leagueInfoByTypeId?.minOdds;
            const maxOdds = leagueInfoByTypeId?.maxOdds;

            const childMarket: ChildMarket = {
                leagueId: Number(data.sportId),
                typeId: Number(data.typeId),
                type: MarketTypeMap[data.typeId as MarketType]?.key || '',
                line: Number(data.line || 0),
                odds: data.odds.map((odd: any) => {
                    const impliedOdds = convertOddsToImpl(odd) || ZERO;
                    return !minOdds || !maxOdds || impliedOdds >= minOdds || impliedOdds <= maxOdds ? 0 : impliedOdds;
                }),
                positionNames: data.positionNames,
                playerProps: {
                    playerId: 0,
                    playerName: '',
                },
                isPlayerPropsMarket: false,
            };
            childMarkets.push(childMarket);
        });
        return { childMarkets, errorMessageMap };
    } else {
        console.warn(`${NO_MARKETS_FOR_LEAGUE_ID}: ${Number(leagueId)}`);
        return { childMarkets, errorMessageMap: new Map<number, string>() };
    }
};

/**
 * Filters the odds array to find entries matching the specified market name.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {string} leagueInfos - The market names to filter by.
 * @param {string} oddsProvider - The main odds provider to filter by.
 * @returns {Array} The filtered odds array.
 */
export const filterOdds = (
    oddsArray: Odd[],
    leagueInfos: LeagueConfigInfo[],
    playersMap: Map<string, number>
): { [key: string]: OddsWithLeagueInfo } => {
    const allMarketsTypes = leagueInfos
        .filter((leagueInfo) => leagueInfo.enabled === 'true')
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());
    return oddsArray.reduce((acc: any, odd: any) => {
        if (allMarketsTypes.includes(odd.marketName.toLowerCase())) {
            const { points, marketName, selection, selectionLine, sportsBookName, playerId } = odd;
            if (playerId && !playersMap.has(playerId)) {
                return acc;
            }
            const key = `${sportsBookName.toLowerCase()}_${marketName.toLowerCase()}_${points}_${selection}_${selectionLine}`;
            acc[key] = {
                ...odd,
                ...leagueInfos.find(
                    (leagueInfo) => leagueInfo.marketName.toLowerCase() === odd.marketName.toLowerCase()
                ), // using .find() for team totals means that we will always assign 10017 as typeID at this point
            };
        }

        return acc;
    }, {}) as any;
};

/**
 * Groups spread odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam information.
 * @returns {Array} The grouped and formatted spread odds.
 */
export const groupAndFormatSpreadOdds = (oddsArray: any[], commonData: HomeAwayTeams) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { points, marketName, price, selection, typeId, sportId, type } = odd;
        const isHomeTeam = selection === commonData.homeTeam;

        const key = `${marketName}_${isHomeTeam ? points : -points}`;

        if (!acc[key]) {
            acc[key] = { home: null, away: null, typeId: null, sportId: null };
        }

        if (isHomeTeam) {
            acc[key].home = price;
        } else {
            acc[key].away = price;
        }

        acc[key].typeId = typeId;
        acc[key].type = type;
        acc[key].sportId = sportId;

        return acc;
    }, {}) as any;
    // Format the grouped odds into the desired output
    const formattedOdds = Object.entries(groupedOdds as any).reduce((acc: any, [key, value]) => {
        const [_marketName, lineFloat] = key.split('_');
        const line = parseFloat(lineFloat);

        acc.push({
            line: line as any,
            odds: [(value as any).home, (value as any).away],
            typeId: (value as any).typeId,
            sportId: (value as any).sportId,
            type: (value as any).type,
        });

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
export const groupAndFormatTotalOdds = (oddsArray: any[], commonData: HomeAwayTeams) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc, odd) => {
        if (odd) {
            const key = `${odd.marketName}_${odd.selection}_${odd.points}`;
            if (!acc[key]) {
                acc[key] = { over: null, under: null };
            }
            if (odd.selectionLine === 'over') {
                acc[key].over = odd.price;
            } else if (odd.selectionLine === 'under') {
                acc[key].under = odd.price;
            }

            acc[key].typeId = odd.typeId;
            acc[key].type = odd.type;
            acc[key].sportId = odd.sportId;

            if (odd.playerId) {
                acc[key].playerProps = {
                    playerId: odd.playerId, // Player ID from OpticOdds, this will be converted to our internal playerId later
                    playerName: odd.selection,
                };
            }
        }

        return acc;
    }, {});

    // Format the grouped odds into the desired output
    const formattedOdds = Object.entries(groupedOdds as any).reduce((acc: any, [key, value]) => {
        const [_marketName, selection, points] = key.split('_');
        const line = parseFloat(points);

        // if we have away team in total odds we know the market is team total and we need to increase typeId by one.
        // if this is false typeId is already mapped correctly
        const shouldIncreaseTypeId = selection === commonData.awayTeam && !(value as any).playerProps;

        const odds = [(value as any).over, (value as any).under];
        const hasOdds = odds.some((odd) => odd !== null);

        acc.push({
            line: line as any,
            odds: hasOdds
                ? isOneSideExtendedPlayerPropsMarket(Number((value as any).typeId))
                    ? odds.filter((odd) => odd !== null)
                    : odds.map((odd) => odd || ZERO)
                : [],
            typeId: !shouldIncreaseTypeId ? (value as any).typeId : Number((value as any).typeId) + 1,
            sportId: (value as any).sportId,
            type: (value as any).type,
            playerProps: (value as any).playerProps,
        });

        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Groups moneyline odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam information.
 * @returns {Array} The grouped and formatted moneyline odds.
 */
export const groupAndFormatMoneylineOdds = (oddsArray: any[], commonData: HomeAwayTeams) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { price, selection, typeId, sportId, type } = odd;
        const key = typeId;

        if (!acc[key]) {
            acc[key] = { home: null, away: null, draw: null, typeId: null, sportId: null };
        }

        if (selection.toLowerCase() === commonData.homeTeam.toLowerCase()) acc[key].home = price;
        else if (selection.toLowerCase() === commonData.awayTeam.toLowerCase()) acc[key].away = price;
        else if (selection.toLowerCase() === DRAW.toLowerCase()) acc[key].draw = price;

        acc[key].typeId = typeId;
        acc[key].type = type;
        acc[key].sportId = sportId;

        return acc;
    }, {}) as any;

    // Format the grouped odds into the desired output
    const formattedOdds = Object.entries(groupedOdds as any).reduce((acc: any, [_key, value]) => {
        acc.push({
            odds: (value as any).draw
                ? [(value as any).home, (value as any).away, (value as any).draw]
                : [(value as any).home, (value as any).away],
            typeId: (value as any).typeId,
            sportId: (value as any).sportId,
            type: (value as any).type,
        });

        return acc;
    }, []);

    return formattedOdds;
};

/**w
 * Groups GG (Both Teams to Score) odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @returns {Array} The grouped and formatted moneyline odds.
 */
export const groupAndFormatGGOdds = (oddsArray: any[]) => {
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { price, selection, typeId, sportId, type } = odd;
        const key = typeId;

        if (!acc[key]) {
            acc[key] = { home: null, away: null, typeId: null, sportId: null };
        }

        if (selection.toLowerCase() === 'yes') acc[key].home = price;
        else if (selection.toLowerCase() === 'no') acc[key].away = price;

        acc[key].typeId = typeId;
        acc[key].type = type;
        acc[key].sportId = sportId;

        return acc;
    }, {}) as any;

    // Format the grouped odds into the desired output
    const formattedOdds = Object.entries(groupedOdds as any).reduce((acc: any, [_key, value]) => {
        acc.push({
            odds: [(value as any).home, (value as any).away],
            typeId: (value as any).typeId,
            sportId: (value as any).sportId,
            type: (value as any).type,
        });

        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Normalize a score line like "A:B" to a map-friendly key "A_B" with
 * numeric normalization (removing any leading zeros).
 *
 * Behavior:
 * - Accepts optional whitespace around the colon (e.g., "03 : 10").
 * - Parses both sides as numbers to strip leading zeros:
 *     "13:09" → "13_9", "13:00" → "13_0", "03:10" → "3_10".
 * - If the input does NOT match "<digits> : <digits>", falls back to a simple
 *   string replace of ":" with "_" without numeric parsing.
 *
 * @param {string|number} line
 *   A score string (e.g., "13:09") or any value coercible to string.
 *
 * @returns {string}
 *   The normalized key (e.g., "13_9"). If not a digit:digit pattern, returns
 *   the string with ":" replaced by "_".
 */
function normalizeScoreLine(line: any) {
    const m = String(line).match(/(\d+)\s*:\s*(\d+)/);
    return m ? `${Number(m[1])}_${Number(m[2])}` : String(line).replace(':', '_');
}

/**
 * Groups correct score odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam and awayTeam information.
 * @returns {Array} The grouped and formatted correct score odds.
 */
export const groupAndFormatCorrectScoreOdds = (oddsArray: any[], commonData: HomeAwayTeams): any[] => {
    const homeTeamKey = commonData.homeTeam.toLowerCase().replace(/\s+/g, '_');
    const awayTeamKey = commonData.awayTeam.toLowerCase().replace(/\s+/g, '_');

    // Group odds by typeId first
    const oddsByTypeId = oddsArray.reduce((acc: any, odd: any) => {
        const typeId = odd.typeId || 10100;
        if (!acc[typeId]) {
            acc[typeId] = [];
        }
        acc[typeId].push(odd);
        return acc;
    }, {});

    // Create market objects for each unique typeId
    const marketObjects: any[] = [];

    Object.entries(oddsByTypeId).forEach(([typeId, odds]: [string, any]) => {
        const oddsMap = {
            draw_0_0: 0,
            draw_1_1: 0,
            draw_2_2: 0,
            draw_3_3: 0,
            draw_4_4: 0,
            [`${homeTeamKey}_1_0`]: 0,
            [`${homeTeamKey}_2_0`]: 0,
            [`${homeTeamKey}_2_1`]: 0,
            [`${homeTeamKey}_3_0`]: 0,
            [`${homeTeamKey}_3_1`]: 0,
            [`${homeTeamKey}_3_2`]: 0,
            [`${homeTeamKey}_4_0`]: 0,
            [`${homeTeamKey}_4_1`]: 0,
            [`${homeTeamKey}_4_2`]: 0,
            [`${homeTeamKey}_4_3`]: 0,
            [`${awayTeamKey}_1_0`]: 0,
            [`${awayTeamKey}_2_0`]: 0,
            [`${awayTeamKey}_2_1`]: 0,
            [`${awayTeamKey}_3_0`]: 0,
            [`${awayTeamKey}_3_1`]: 0,
            [`${awayTeamKey}_3_2`]: 0,
            [`${awayTeamKey}_4_0`]: 0,
            [`${awayTeamKey}_4_1`]: 0,
            [`${awayTeamKey}_4_2`]: 0,
            [`${awayTeamKey}_4_3`]: 0,
            draw_5_5: 0,
            draw_6_6: 0,
            draw_7_7: 0,
            draw_8_8: 0,
            draw_9_9: 0,
            draw_10_10: 0,
            draw_11_11: 0,
            draw_12_12: 0,
            draw_13_13: 0,
            draw_14_14: 0,
            [`${homeTeamKey}_5_0`]: 0,
            [`${homeTeamKey}_5_1`]: 0,
            [`${homeTeamKey}_5_2`]: 0,
            [`${homeTeamKey}_5_3`]: 0,
            [`${homeTeamKey}_5_4`]: 0,
            [`${homeTeamKey}_6_0`]: 0,
            [`${homeTeamKey}_6_1`]: 0,
            [`${homeTeamKey}_6_2`]: 0,
            [`${homeTeamKey}_6_3`]: 0,
            [`${homeTeamKey}_6_4`]: 0,
            [`${homeTeamKey}_6_5`]: 0,
            [`${homeTeamKey}_7_0`]: 0,
            [`${homeTeamKey}_7_1`]: 0,
            [`${homeTeamKey}_7_2`]: 0,
            [`${homeTeamKey}_7_3`]: 0,
            [`${homeTeamKey}_7_4`]: 0,
            [`${homeTeamKey}_7_5`]: 0,
            [`${homeTeamKey}_7_6`]: 0,
            [`${homeTeamKey}_8_0`]: 0,
            [`${homeTeamKey}_8_1`]: 0,
            [`${homeTeamKey}_8_2`]: 0,
            [`${homeTeamKey}_8_3`]: 0,
            [`${homeTeamKey}_8_4`]: 0,
            [`${homeTeamKey}_8_5`]: 0,
            [`${homeTeamKey}_8_6`]: 0,
            [`${homeTeamKey}_8_7`]: 0,
            [`${homeTeamKey}_9_0`]: 0,
            [`${homeTeamKey}_9_1`]: 0,
            [`${homeTeamKey}_9_2`]: 0,
            [`${homeTeamKey}_9_3`]: 0,
            [`${homeTeamKey}_9_4`]: 0,
            [`${homeTeamKey}_9_5`]: 0,
            [`${homeTeamKey}_9_6`]: 0,
            [`${homeTeamKey}_9_7`]: 0,
            [`${homeTeamKey}_9_8`]: 0,
            [`${homeTeamKey}_10_0`]: 0,
            [`${homeTeamKey}_10_1`]: 0,
            [`${homeTeamKey}_10_2`]: 0,
            [`${homeTeamKey}_10_3`]: 0,
            [`${homeTeamKey}_10_4`]: 0,
            [`${homeTeamKey}_10_5`]: 0,
            [`${homeTeamKey}_10_6`]: 0,
            [`${homeTeamKey}_10_7`]: 0,
            [`${homeTeamKey}_10_8`]: 0,
            [`${homeTeamKey}_10_9`]: 0,
            [`${homeTeamKey}_11_0`]: 0,
            [`${homeTeamKey}_11_1`]: 0,
            [`${homeTeamKey}_11_2`]: 0,
            [`${homeTeamKey}_11_3`]: 0,
            [`${homeTeamKey}_11_4`]: 0,
            [`${homeTeamKey}_11_5`]: 0,
            [`${homeTeamKey}_11_6`]: 0,
            [`${homeTeamKey}_11_7`]: 0,
            [`${homeTeamKey}_11_8`]: 0,
            [`${homeTeamKey}_11_9`]: 0,
            [`${homeTeamKey}_11_10`]: 0,
            [`${homeTeamKey}_12_0`]: 0,
            [`${homeTeamKey}_12_1`]: 0,
            [`${homeTeamKey}_12_2`]: 0,
            [`${homeTeamKey}_12_3`]: 0,
            [`${homeTeamKey}_12_4`]: 0,
            [`${homeTeamKey}_12_5`]: 0,
            [`${homeTeamKey}_12_6`]: 0,
            [`${homeTeamKey}_12_7`]: 0,
            [`${homeTeamKey}_12_8`]: 0,
            [`${homeTeamKey}_12_9`]: 0,
            [`${homeTeamKey}_12_10`]: 0,
            [`${homeTeamKey}_12_11`]: 0,
            [`${homeTeamKey}_13_0`]: 0,
            [`${homeTeamKey}_13_1`]: 0,
            [`${homeTeamKey}_13_2`]: 0,
            [`${homeTeamKey}_13_3`]: 0,
            [`${homeTeamKey}_13_4`]: 0,
            [`${homeTeamKey}_13_5`]: 0,
            [`${homeTeamKey}_13_6`]: 0,
            [`${homeTeamKey}_13_7`]: 0,
            [`${homeTeamKey}_13_8`]: 0,
            [`${homeTeamKey}_13_9`]: 0,
            [`${homeTeamKey}_13_10`]: 0,
            [`${homeTeamKey}_13_11`]: 0,
            [`${homeTeamKey}_13_12`]: 0,
            [`${homeTeamKey}_14_0`]: 0,
            [`${homeTeamKey}_14_1`]: 0,
            [`${homeTeamKey}_14_2`]: 0,
            [`${homeTeamKey}_14_3`]: 0,
            [`${homeTeamKey}_14_4`]: 0,
            [`${homeTeamKey}_14_5`]: 0,
            [`${homeTeamKey}_14_6`]: 0,
            [`${homeTeamKey}_14_7`]: 0,
            [`${homeTeamKey}_14_8`]: 0,
            [`${homeTeamKey}_14_9`]: 0,
            [`${homeTeamKey}_14_10`]: 0,
            [`${homeTeamKey}_14_11`]: 0,
            [`${homeTeamKey}_14_12`]: 0,
            [`${homeTeamKey}_14_13`]: 0,
            [`${awayTeamKey}_5_0`]: 0,
            [`${awayTeamKey}_5_1`]: 0,
            [`${awayTeamKey}_5_2`]: 0,
            [`${awayTeamKey}_5_3`]: 0,
            [`${awayTeamKey}_5_4`]: 0,
            [`${awayTeamKey}_6_0`]: 0,
            [`${awayTeamKey}_6_1`]: 0,
            [`${awayTeamKey}_6_2`]: 0,
            [`${awayTeamKey}_6_3`]: 0,
            [`${awayTeamKey}_6_4`]: 0,
            [`${awayTeamKey}_6_5`]: 0,
            [`${awayTeamKey}_7_0`]: 0,
            [`${awayTeamKey}_7_1`]: 0,
            [`${awayTeamKey}_7_2`]: 0,
            [`${awayTeamKey}_7_3`]: 0,
            [`${awayTeamKey}_7_4`]: 0,
            [`${awayTeamKey}_7_5`]: 0,
            [`${awayTeamKey}_7_6`]: 0,
            [`${awayTeamKey}_8_0`]: 0,
            [`${awayTeamKey}_8_1`]: 0,
            [`${awayTeamKey}_8_2`]: 0,
            [`${awayTeamKey}_8_3`]: 0,
            [`${awayTeamKey}_8_4`]: 0,
            [`${awayTeamKey}_8_5`]: 0,
            [`${awayTeamKey}_8_6`]: 0,
            [`${awayTeamKey}_8_7`]: 0,
            [`${awayTeamKey}_9_0`]: 0,
            [`${awayTeamKey}_9_1`]: 0,
            [`${awayTeamKey}_9_2`]: 0,
            [`${awayTeamKey}_9_3`]: 0,
            [`${awayTeamKey}_9_4`]: 0,
            [`${awayTeamKey}_9_5`]: 0,
            [`${awayTeamKey}_9_6`]: 0,
            [`${awayTeamKey}_9_7`]: 0,
            [`${awayTeamKey}_9_8`]: 0,
            [`${awayTeamKey}_10_0`]: 0,
            [`${awayTeamKey}_10_1`]: 0,
            [`${awayTeamKey}_10_2`]: 0,
            [`${awayTeamKey}_10_3`]: 0,
            [`${awayTeamKey}_10_4`]: 0,
            [`${awayTeamKey}_10_5`]: 0,
            [`${awayTeamKey}_10_6`]: 0,
            [`${awayTeamKey}_10_7`]: 0,
            [`${awayTeamKey}_10_8`]: 0,
            [`${awayTeamKey}_10_9`]: 0,
            [`${awayTeamKey}_11_0`]: 0,
            [`${awayTeamKey}_11_1`]: 0,
            [`${awayTeamKey}_11_2`]: 0,
            [`${awayTeamKey}_11_3`]: 0,
            [`${awayTeamKey}_11_4`]: 0,
            [`${awayTeamKey}_11_5`]: 0,
            [`${awayTeamKey}_11_6`]: 0,
            [`${awayTeamKey}_11_7`]: 0,
            [`${awayTeamKey}_11_8`]: 0,
            [`${awayTeamKey}_11_9`]: 0,
            [`${awayTeamKey}_11_10`]: 0,
            [`${awayTeamKey}_12_0`]: 0,
            [`${awayTeamKey}_12_1`]: 0,
            [`${awayTeamKey}_12_2`]: 0,
            [`${awayTeamKey}_12_3`]: 0,
            [`${awayTeamKey}_12_4`]: 0,
            [`${awayTeamKey}_12_5`]: 0,
            [`${awayTeamKey}_12_6`]: 0,
            [`${awayTeamKey}_12_7`]: 0,
            [`${awayTeamKey}_12_8`]: 0,
            [`${awayTeamKey}_12_9`]: 0,
            [`${awayTeamKey}_12_10`]: 0,
            [`${awayTeamKey}_12_11`]: 0,
            [`${awayTeamKey}_13_0`]: 0,
            [`${awayTeamKey}_13_1`]: 0,
            [`${awayTeamKey}_13_2`]: 0,
            [`${awayTeamKey}_13_3`]: 0,
            [`${awayTeamKey}_13_4`]: 0,
            [`${awayTeamKey}_13_5`]: 0,
            [`${awayTeamKey}_13_6`]: 0,
            [`${awayTeamKey}_13_7`]: 0,
            [`${awayTeamKey}_13_8`]: 0,
            [`${awayTeamKey}_13_9`]: 0,
            [`${awayTeamKey}_13_10`]: 0,
            [`${awayTeamKey}_13_11`]: 0,
            [`${awayTeamKey}_13_12`]: 0,
            [`${awayTeamKey}_14_0`]: 0,
            [`${awayTeamKey}_14_1`]: 0,
            [`${awayTeamKey}_14_2`]: 0,
            [`${awayTeamKey}_14_3`]: 0,
            [`${awayTeamKey}_14_4`]: 0,
            [`${awayTeamKey}_14_5`]: 0,
            [`${awayTeamKey}_14_6`]: 0,
            [`${awayTeamKey}_14_7`]: 0,
            [`${awayTeamKey}_14_8`]: 0,
            [`${awayTeamKey}_14_9`]: 0,
            [`${awayTeamKey}_14_10`]: 0,
            [`${awayTeamKey}_14_11`]: 0,
            [`${awayTeamKey}_14_12`]: 0,
            [`${awayTeamKey}_14_13`]: 0,
            other: 0,
        };

        // Populate the oddsMap with the odds from this typeId's odds
        odds.forEach((odd: any) => {
            const normalizedSelection = `${odd.selection.toLowerCase().replace(/\s+/g, '_')}_${normalizeScoreLine(
                odd.selectionLine
            )}`;
            if (oddsMap.hasOwnProperty(normalizedSelection)) {
                oddsMap[normalizedSelection] = odd.price;
            }
        });

        const allOddsAreZero = Object.values(oddsMap).every((odd) => odd === ZERO);

        if (!allOddsAreZero) {
            const positionNames = Object.keys(oddsMap);

            // Create a market object for this typeId
            const marketObject = {
                homeTeam: commonData.homeTeam,
                awayTeam: commonData.awayTeam,
                line: 0,
                positionNames: positionNames,
                odds: Object.values(oddsMap),
                type: odds?.[0]?.type ? odds[0].type : LiveMarketType.CORRECT_SCORE,
                typeId: Number(typeId),
                sportId: odds?.[0]?.sportId ? odds[0].sportId : undefined,
            };
            marketObjects.push(marketObject);
        }
    });

    return marketObjects;
};

/**
 * Groups double chance odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam and awayTeam information.
 * @returns {Array} The grouped and formatted correct score odds.
 */
export const groupAndFormatDoubleChanceOdds = (oddsArray: any[], commonData: HomeAwayTeams) => {
    let probability1X = 0;
    let probability12 = 0;
    let probabilityX2 = 0;

    let sportId;

    oddsArray.forEach((odd) => {
        if (odd.sportId) {
            sportId = odd.sportId;
        }
        if (odd.selection.includes(commonData.homeTeam)) {
            if (odd.selection.includes(commonData.awayTeam)) {
                probability12 = odd.price;
            } else {
                probability1X = odd.price;
            }
        } else if (odd.selection.includes(commonData.awayTeam)) {
            probabilityX2 = odd.price;
        }
    });

    if ([probability1X, probability12, probabilityX2].every((odd) => odd === ZERO)) {
        return [];
    }
    // Create the market object
    const marketObject = {
        homeTeam: commonData.homeTeam,
        awayTeam: commonData.awayTeam,
        line: 0,
        odds: [probability1X, probability12, probabilityX2],
        type: LiveMarketType.DOUBLE_CHANCE,
        typeId: 10003,
        sportId: sportId,
    };
    return [marketObject];
};

// used for home/away markets
export const sanityCheck = (iterableGroupedOdds: any[]) => {
    const result: any[] = [];
    iterableGroupedOdds.forEach((data) => {
        let odds = data.odds.map((odd: number) => convertOddsToImpl(odd) || ZERO);
        if (data.odds.length > 0) {
            if (data.odds.length > 1) {
                odds = sanityCheckForOdds(odds, data);
            }

            result.push({
                ...data,
                odds,
            });
        }
    });
    return result;
};

export const formatOddsForUi = (odd: number) => {
    if (odd == 0) {
        return {
            american: 0,
            decimal: 0,
            normalizedImplied: 0,
        };
    }
    return {
        american: oddslib.from('impliedProbability', odd).to('moneyline'),
        decimal: Number(oddslib.from('impliedProbability', odd).to('decimal').toFixed(10)),
        normalizedImplied: odd,
    };
};
