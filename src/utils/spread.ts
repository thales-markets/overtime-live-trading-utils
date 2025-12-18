import { LeagueConfigInfo } from '../types/sports';

export const sanityCheckForOdds = (impliedProbs: number[]) => {
    // Step 1: Check if any implied probability is zero
    if (impliedProbs.some((prob) => prob === 0)) {
        return impliedProbs;
    }

    // Step 2: Calculate the current total implied probabilities
    const totalImpliedProbs = impliedProbs.reduce((sum, prob) => sum + prob, 0);

    // Step 3: Check if the sum of implied probabilities is greater than 1
    // Special case: If we have exactly 2 odds and sum <= 1, this likely indicates
    // a 3-positional sport where the bookmaker didn't provide the draw odds.
    // However, we need to ensure the odds are reasonable (not artificially similar).
    if (totalImpliedProbs <= 1) {
        if (impliedProbs.length === 2) {
            // Check if odds are suspiciously similar (within 5% of each other)
            // which would suggest bad data rather than a legitimate missing draw
            const [prob1, prob2] = impliedProbs;
            const ratio = Math.max(prob1, prob2) / Math.min(prob1, prob2);

            // If ratio is close to 1 (within 1.15), odds are too similar - reject them
            if (ratio < 1.15) {
                return Array(impliedProbs.length).fill(0);
            }

            // Odds are different enough, likely a valid missing draw case
            return impliedProbs;
        }
        return Array(impliedProbs.length).fill(0);
    }

    return impliedProbs;
};

export const getSpreadData = (
    spreadData: any[],
    sportId: string,
    typeId: number,
    defaultSpreadForLiveMarkets: number
) => {
    const sportSpreadData = spreadData.find(
        (data) => Number(data.typeId) === Number(typeId) && Number(data.sportId) === Number(sportId)
    );
    if (sportSpreadData) {
        return {
            minSpread: sportSpreadData.minSpread ? Number(sportSpreadData.minSpread) : defaultSpreadForLiveMarkets,
            targetSpread: sportSpreadData.targetSpread ? Number(sportSpreadData.targetSpread) : 0,
        };
    }
    return { minSpread: defaultSpreadForLiveMarkets, targetSpread: 0 };
};

export const adjustAddedSpread = (odds: number[], leagueInfo: LeagueConfigInfo[], typeId: number) => {
    // Pack market odds for UI
    return odds.map((probability) => {
        if (probability != 0) {
            const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(typeId));
            let finalProbability = probability;

            if (probability < 0.95) {
                if (leagueInfoByTypeId && Number(leagueInfoByTypeId.addedSpread)) {
                    finalProbability = (probability * (100 + Number(leagueInfoByTypeId.addedSpread))) / 100;
                    // edge case if added spread is bigger than 5%, it can happen that odd goes above 1, in that case return odd from api.
                    if (finalProbability >= 1) {
                        finalProbability = probability;
                    }
                }
            }

            return finalProbability;
        } else {
            return 0;
        }
    });
};
