import {
    getBetTypesForLeague,
    getLeagueSpreadTypes,
    getLeagueTotalTypes,
    getLiveSupportedLeagues,
} from '../../utils/sports';
import { LeagueMocks } from '../mock/MockLeagueMap';

describe('Sports', () => {
    it('Should return all enabled leagues for LIVE', () => {
        const supportedLeageus = getLiveSupportedLeagues(LeagueMocks.leagueInfoEnabledSpeadAndTotals);

        expect(supportedLeageus).toContain(9806);
    });

    it('Should return all enabled bet types for league', () => {
        const betTypes = getBetTypesForLeague(9806, LeagueMocks.leagueInfoEnabledSpeadAndTotals);

        expect(betTypes).toContain('Moneyline');
        expect(betTypes).toContain('Goal Spread');
        expect(betTypes).toContain('Total Goals');
    });

    it('Should return all enabled bet types for league, and not contain disabled ones', () => {
        const betTypes = getBetTypesForLeague(9806, LeagueMocks.leagueInfoEnabledSpreadDisabledTotals);

        expect(betTypes).toContain('Moneyline');
        expect(betTypes).toContain('Goal Spread');
        expect(betTypes).not.toContain('Total Goals');
    });

    it('Should return all enabled spread bet types for league', () => {
        const betTypes = getLeagueSpreadTypes(9806, LeagueMocks.leagueInfoEnabledSpeadAndTotals);

        expect(betTypes).not.toContain('moneyline');
        expect(betTypes).toContain('goal spread');
        expect(betTypes).not.toContain('total goals');
    });

    it('Should return all enabled total bet types for league', () => {
        const betTypes = getLeagueTotalTypes(9806, LeagueMocks.leagueInfoEnabledSpeadAndTotals);

        expect(betTypes).not.toContain('moneyline');
        expect(betTypes).not.toContain('goal spread');
        expect(betTypes).toContain('total goals');
    });
});
