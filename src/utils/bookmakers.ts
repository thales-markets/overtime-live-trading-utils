import {
    DIFF_BETWEEN_BOOKMAKERS_MESSAGE,
    NO_MATCHING_BOOKMAKERS_MESSAGE,
    ZERO_ODDS_MESSAGE,
    ZERO_ODDS_MESSAGE_SINGLE_BOOKMAKER,
} from '../constants/errors';
import { ChildMarketType } from '../enums/sports';
import { BookmakersConfig } from '../types/bookmakers';
import { Anchor, OddsWithLeagueInfo } from '../types/odds';
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
    const leagueInfoArrayFiltered: string[] = leagueInfoArray
        .filter((leagueInfo) => Number(leagueInfo.sportId) === Number(sportId) && leagueInfo.enabled === 'true')
        .flatMap((item) => [item.primaryBookmaker?.toLowerCase(), item.secondaryBookmaker?.toLowerCase()])
        .filter((item): item is string => !!item && item.length > 0);

    return [...new Set(leagueInfoArrayFiltered)];
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
    arrayOfBookmakers: string[],
    isTwoPositionalSport: boolean,
    anchors: Anchor[]
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

            if (
                shouldBlockOdds(homeOdd, otherHomeOdd, anchors) ||
                shouldBlockOdds(awayOdd, otherAwayOdd, anchors) ||
                (!isTwoPositionalSport && shouldBlockOdds(drawOdd, otherDrawOdd, anchors))
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
    anchors: Anchor[],
    maxPercentageDiffForLines: number
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
                        if (value.playerId && !value.isMain) return acc; // Skip if not main for player props
                        const secondaryBookmakerObject =
                            odds[
                                `${secondaryBookmaker}_${marketName.toLowerCase()}_${points}_${selection}_${selectionLine}`
                            ];
                        if (secondaryBookmakerObject) {
                            if (shouldBlockOdds(value.price, secondaryBookmakerObject.price, anchors)) {
                                // Block this odd
                                return acc;
                            }

                            acc.push(value);
                        } else {
                            // if the market is Total or Spread and we didnt find the correct line, try adjusting points by steps defined and search again
                            if (info.type === ChildMarketType.SPREAD || info.type === ChildMarketType.TOTAL) {
                                const steps = getStepsForPointAdjustment(
                                    Number(points),
                                    info.percentageDiffForLines ?? maxPercentageDiffForLines // use the value defined in csv if available, else use default from env variable
                                );
                                for (const step of steps) {
                                    const adjustedPoints = (Number(points) + step).toString();

                                    const secondaryBookmakerObject =
                                        odds[
                                            `${secondaryBookmaker}_${marketName.toLowerCase()}_${adjustedPoints}_${selection}_${selectionLine}`
                                        ];

                                    if (secondaryBookmakerObject) {
                                        acc.push(value);
                                        break;
                                    }
                                }
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
        return false;
    });
    return !isNotValid;
};

export const calculateImpliedOddsDifference = (impliedOddsA: number, impliedOddsB: number): number => {
    const percentageDifference = (Math.abs(impliedOddsA - impliedOddsB) / impliedOddsA) * 100;
    return percentageDifference;
};

const getRequiredOtherOdds = (odds: number, anchors: Anchor[]) => {
    // If below the first anchor, extrapolate using first segment
    if (odds <= anchors[0].our) {
        const a = anchors[0];
        const b = anchors[1];
        const t = (odds - a.our) / (b.our - a.our);
        return a.otherMin + t * (b.otherMin - a.otherMin);
    }

    // If above the last anchor, extrapolate using last segment
    const last = anchors[anchors.length - 1];
    const prev = anchors[anchors.length - 2];
    if (odds >= last.our) {
        const t = (odds - prev.our) / (last.our - prev.our);
        return prev.otherMin + t * (last.otherMin - prev.otherMin);
    }

    // Otherwise, find the segment we fall into and interpolate
    for (let i = 1; i < anchors.length; i++) {
        const a = anchors[i - 1];
        const b = anchors[i];

        if (odds <= b.our) {
            const t = (odds - a.our) / (b.our - a.our);
            return a.otherMin + t * (b.otherMin - a.otherMin);
        }
    }

    // Fallback (should never hit)
    return last.otherMin;
};

const shouldBlockOdds = (ourOdds: number, otherOdds: number, anchors: Anchor[]) => {
    // basic sanity check
    if (ourOdds <= 1 || otherOdds <= 1) return true;

    // If we are equal or shorter than the other book,
    // we are not at risk.
    if (ourOdds <= otherOdds) return false;

    const requiredOther = getRequiredOtherOdds(ourOdds, anchors);

    // Block if the other book is below the required threshold
    return otherOdds < requiredOther;
};

const getStepsForPointAdjustment = (points: number, percentageDiffForPPLines: number): number[] => {
    const stepsDelta = Math.round((points * percentageDiffForPPLines) / 100); // Example logic: 10% of the points value
    const steps: number[] = [];
    for (let index = 1; index <= stepsDelta; index++) {
        steps.push(-index, index);
    }

    return steps;
};

// Export only when running tests
export const __test__ = { getRequiredOtherOdds, shouldBlockOdds };
