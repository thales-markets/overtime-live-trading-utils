import * as oddslib from 'oddslib';
import { MIN_ODDS_FOR_DIFF_CHECKING } from '../constants/common';
import {
    DIFF_BETWEEN_BOOKMAKERS_MESSAGE,
    NO_MATCHING_BOOKMAKERS_MESSAGE,
    ZERO_ODDS_MESSAGE,
    ZERO_ODDS_MESSAGE_SINGLE_BOOKMAKER,
} from '../constants/errors';
import { BookmakersConfig } from '../types/bookmakers';
import { OddsWithLeagueInfo } from '../types/odds';
import { LastPolledArray, LeagueConfigInfo } from '../types/sports';

export const getBookmakersArray = (
    bookmakersData: BookmakersConfig[],
    sportId: any,
    backupLiveOddsProviders: string[]
) => {
    const sportBookmakersData = bookmakersData.find((data) => Number(data.sportId) === Number(sportId));
    if (sportBookmakersData) {
        if (sportBookmakersData.primaryBookmaker == '') {
            return backupLiveOddsProviders;
        }
        const bookmakersArray: string[] = [];

        sportBookmakersData.primaryBookmaker ? bookmakersArray.push(sportBookmakersData.primaryBookmaker) : '';
        sportBookmakersData.secondaryBookmaker ? bookmakersArray.push(sportBookmakersData.secondaryBookmaker) : '';
        sportBookmakersData.tertiaryBookmaker ? bookmakersArray.push(sportBookmakersData.tertiaryBookmaker) : '';

        return bookmakersArray;
    }
    return backupLiveOddsProviders;
};

export const getBookmakersFromLeagueConfig = (sportId: string | number, leagueInfoArray: LeagueConfigInfo[]) => {
    const uniqueBookmakers = [];

    for (const leagueInfo of leagueInfoArray) {
        if (Number(leagueInfo.sportId) === Number(sportId) && leagueInfo.enabled === 'true') {
            const primary = leagueInfo.primaryBookmaker?.toLowerCase();
            const secondary = leagueInfo.secondaryBookmaker?.toLowerCase();
            if (primary) {
                uniqueBookmakers.push(primary);
            }
            if (secondary && secondary !== primary) {
                uniqueBookmakers.push(secondary);
            }
            break;
        }
    }

    return uniqueBookmakers;
};

export const getBookmakersForLeague = (
    sportId: string | number,
    configPerMarket: LeagueConfigInfo[],
    configPerLeague: BookmakersConfig[],
    defaultBookmakers: string[],
    maxNumOfBookmakers = 5
) => {
    // bookmakers defined per market for league
    const bookmakersPerMarket = getBookmakersFromLeagueConfig(sportId, configPerMarket);
    // bookmakers defined generally per league
    const bookmakersPerLeague = getBookmakersArray(configPerLeague, sportId, defaultBookmakers);
    // all unique bookmakers defined from both configs
    const uniqueBookmakers = [...new Set([...bookmakersPerMarket, ...bookmakersPerLeague])];

    const bookmakers = uniqueBookmakers.filter((s) => s.length).slice(0, maxNumOfBookmakers);

    return bookmakers;
};

export const checkOddsFromBookmakers = (
    oddsMap: Map<string, any>,
    arrayOfBookmakers: any[],
    isTwoPositionalSport: boolean,
    maxImpliedPercentageDifference: number,
    minOddsForDiffChecking: number
) => {
    // Main bookmaker odds
    const firstBookmakerOdds = oddsMap.get(arrayOfBookmakers[0].toLowerCase());

    if (!firstBookmakerOdds) {
        // If no matching bookmakers are found, return zero odds
        return {
            homeOdds: 0,
            awayOdds: 0,
            drawOdds: 0,
            errorMessage: NO_MATCHING_BOOKMAKERS_MESSAGE,
        };
    }

    const homeOdd = firstBookmakerOdds.homeOdds;
    const awayOdd = firstBookmakerOdds.awayOdds;
    const drawOdd = isTwoPositionalSport ? 0 : firstBookmakerOdds.drawOdds;

    // Check if any bookmaker has odds of 0 or 0.0001
    const hasZeroOrOne = arrayOfBookmakers.some((bookmakerId) => {
        const line = oddsMap.get(bookmakerId);
        if (line) {
            return (
                line.homeOdds === 0 ||
                line.awayOdds === 0 ||
                (!isTwoPositionalSport && line.drawOdds === 0) ||
                line.homeOdds === 1 ||
                line.awayOdds === 1 ||
                (!isTwoPositionalSport && line.drawOdds === 1)
            );
        }
        return false; // fix for es-lint
    });

    if (hasZeroOrOne) {
        // If any bookmaker has zero odds, return zero odds
        return {
            homeOdds: 0,
            awayOdds: 0,
            drawOdds: 0,
            errorMessage: arrayOfBookmakers.length === 1 ? ZERO_ODDS_MESSAGE_SINGLE_BOOKMAKER : ZERO_ODDS_MESSAGE,
            // TODO: Return sportsbook name with zero odds
        };
    }

    if (arrayOfBookmakers.length == 1) {
        return {
            homeOdds: homeOdd,
            awayOdds: awayOdd,
            drawOdds: isTwoPositionalSport ? 0 : drawOdd,
        };
    }

    // If none of the bookmakers have zero odds, check implied odds percentage difference
    const hasLargeImpliedPercentageDifference = arrayOfBookmakers.slice(1).some((bookmakerId) => {
        const line = oddsMap.get(bookmakerId);
        if (line) {
            const otherHomeOdd = line.homeOdds;
            const otherAwayOdd = line.awayOdds;
            const otherDrawOdd = line.drawOdds;

            const homeOddsImplied = oddslib.from('decimal', homeOdd).to('impliedProbability');

            const awayOddsImplied = oddslib.from('decimal', awayOdd).to('impliedProbability');

            // Calculate implied odds for the "draw" if it's not a two-positions sport
            const drawOddsImplied = isTwoPositionalSport
                ? 0
                : oddslib.from('decimal', drawOdd).to('impliedProbability');

            const otherHomeOddImplied = oddslib.from('decimal', otherHomeOdd).to('impliedProbability');

            const otherAwayOddImplied = oddslib.from('decimal', otherAwayOdd).to('impliedProbability');

            // Calculate implied odds for the "draw" if it's not a two-positions sport
            const otherDrawOddImplied = isTwoPositionalSport
                ? 0
                : oddslib.from('decimal', otherDrawOdd).to('impliedProbability');

            // Calculate the percentage difference for implied odds
            const homeOddsDifference = calculateImpliedOddsDifference(homeOddsImplied, otherHomeOddImplied);

            const awayOddsDifference = calculateImpliedOddsDifference(awayOddsImplied, otherAwayOddImplied);

            // Check implied odds difference for the "draw" only if it's not a two-positions sport
            const drawOddsDifference = isTwoPositionalSport
                ? 0
                : calculateImpliedOddsDifference(drawOddsImplied, otherDrawOddImplied);

            // Check if the percentage difference exceeds the threshold
            if (
                (homeOddsDifference > maxImpliedPercentageDifference &&
                    homeOddsImplied > minOddsForDiffChecking &&
                    otherHomeOddImplied > minOddsForDiffChecking) ||
                (awayOddsDifference > maxImpliedPercentageDifference &&
                    awayOddsImplied > minOddsForDiffChecking &&
                    otherAwayOddImplied > minOddsForDiffChecking) ||
                (!isTwoPositionalSport &&
                    drawOddsDifference > maxImpliedPercentageDifference &&
                    drawOddsImplied > minOddsForDiffChecking &&
                    otherDrawOddImplied > minOddsForDiffChecking)
            ) {
                return true;
            }
        }
        return false;
    });

    if (hasLargeImpliedPercentageDifference) {
        return {
            homeOdds: 0,
            awayOdds: 0,
            drawOdds: 0,
            errorMessage: DIFF_BETWEEN_BOOKMAKERS_MESSAGE,
        };
    }

    return {
        homeOdds: homeOdd,
        awayOdds: awayOdd,
        drawOdds: isTwoPositionalSport ? 0 : drawOdd,
    };
};

export const checkOddsFromBookmakersForChildMarkets = (
    odds: any,
    leagueInfos: LeagueConfigInfo[],
    oddsProviders: string[],
    lastPolledData: LastPolledArray,
    maxAllowedProviderDataStaleDelay: number,
    maxImpliedPercentageDifference: number
): OddsWithLeagueInfo => {
    const formattedOdds = Object.entries(odds as any).reduce((acc: any, [key, value]: [string, any]) => {
        const [sportsBookName, marketName, points, selection, selectionLine] = key.split('_');
        const info = leagueInfos.find((leagueInfo) => leagueInfo.marketName.toLowerCase() === marketName.toLowerCase());
        if (info) {
            const bookmakers = getPrimaryAndSecondaryBookmakerForTypeId(
                oddsProviders,
                leagueInfos,
                Number(info.typeId)
            );

            const isValidLastPolled = isLastPolledForBookmakersValid(
                lastPolledData,
                maxAllowedProviderDataStaleDelay,
                bookmakers
            );

            if (isValidLastPolled) {
                const primaryBookmaker = bookmakers[0];
                const secondaryBookmaker = bookmakers[1];
                if (primaryBookmaker && !secondaryBookmaker) {
                    if (sportsBookName.toLowerCase() === primaryBookmaker.toLowerCase()) {
                        acc.push(value);
                    }
                } else {
                    if (sportsBookName.toLowerCase() === primaryBookmaker) {
                        const secondaryBookmakerObject =
                            odds[
                                `${secondaryBookmaker}_${marketName.toLowerCase()}_${points}_${selection}_${selectionLine}`
                            ];
                        if (secondaryBookmakerObject) {
                            const primaryOdds = oddslib.from('decimal', value.price).to('impliedProbability');
                            const secondaryOdds = oddslib
                                .from('decimal', secondaryBookmakerObject.price)
                                .to('impliedProbability');
                            if (
                                primaryOdds >= MIN_ODDS_FOR_DIFF_CHECKING &&
                                secondaryOdds >= MIN_ODDS_FOR_DIFF_CHECKING
                            ) {
                                const homeOddsDifference = calculateImpliedOddsDifference(primaryOdds, secondaryOdds);
                                if (Number(homeOddsDifference) <= Number(maxImpliedPercentageDifference)) {
                                    acc.push(value);
                                }
                            } else {
                                acc.push(value);
                            }
                        }
                    }
                }
            }
        }

        return acc;
    }, []);
    return formattedOdds;
};

export const getPrimaryAndSecondaryBookmakerForTypeId = (
    defaultProviders: string[],
    leagueInfos: LeagueConfigInfo[], // LeagueConfigInfo for specific sport, not the entire list from csv
    typeId: number
): string[] => {
    const info = leagueInfos.find((leagueInfo) => Number(leagueInfo.typeId) === typeId);
    let primaryBookmaker = defaultProviders[0].toLowerCase();
    let secondaryBookmaker = defaultProviders[1] ? defaultProviders[1].toLowerCase() : undefined;
    if (info) {
        if (info.primaryBookmaker) {
            primaryBookmaker = info.primaryBookmaker.toLowerCase();
            secondaryBookmaker = info.secondaryBookmaker ? info.secondaryBookmaker.toLowerCase() : undefined;
        }
    }
    return secondaryBookmaker ? [primaryBookmaker, secondaryBookmaker] : [primaryBookmaker];
};

export const isLastPolledForBookmakersValid = (
    lastPolledData: LastPolledArray,
    maxAllowedProviderDataStaleDelay: number,
    bookmakers: string[]
): boolean => {
    const now = new Date();
    const isNotValid = bookmakers.some((bookmakerId) => {
        const lastPolledTime = lastPolledData.find(
            (entry) => entry.sportsbook.toLowerCase() === bookmakerId.toLowerCase()
        )?.timestamp;
        if (typeof lastPolledTime !== 'number') {
            return true;
        }
        const oddsDate = new Date(lastPolledTime * 1000);
        const timeDiff = now.getTime() - oddsDate.getTime();
        if (timeDiff > maxAllowedProviderDataStaleDelay) {
            return true;
        }
    });
    return !isNotValid;
};

export const calculateImpliedOddsDifference = (impliedOddsA: number, impliedOddsB: number): number => {
    const percentageDifference = (Math.abs(impliedOddsA - impliedOddsB) / impliedOddsA) * 100;
    return percentageDifference;
};
