import { OpticOddsEvent, SportPeriodType } from '../types/resolution';

/**
 * Determines the period structure type for a sport based on OpticOdds event data
 * @param event - OpticOdds event object containing sport information
 * @returns SportPeriodType enum value indicating the period structure
 */
export function getSportPeriodTypeFromEvent(event: OpticOddsEvent): SportPeriodType {
    const sportId = event.sport?.id?.toLowerCase();

    if (!sportId) {
        // Default to PERIOD_BASED (no halftime processing) for unknown sports
        return SportPeriodType.PERIOD_BASED;
    }

    // Map OpticOdds sport string ID to SportPeriodType
    switch (sportId) {
        case 'soccer':
            return SportPeriodType.HALVES_BASED;

        case 'football':
        case 'basketball':
            return SportPeriodType.QUARTERS_BASED;

        case 'baseball':
            return SportPeriodType.INNINGS_BASED;

        case 'hockey':
        case 'ice_hockey':
            return SportPeriodType.PERIOD_BASED;

        default:
            // Default to PERIOD_BASED (no halftime processing) for unknown sports
            return SportPeriodType.PERIOD_BASED;
    }
}
