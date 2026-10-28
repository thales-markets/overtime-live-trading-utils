import {
    getBetTypesForLeague,
    getLeagueInfo,
    getLeagueInfoByMarketName,
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
        const betTypes = getBetTypesForLeague(9806, LeagueMocks.leagueInfoEnabledAll);

        expect(betTypes).toContain('Moneyline');
        expect(betTypes).toContain('Goal Spread');
        expect(betTypes).toContain('Total Goals');
        expect(betTypes).toContain('Double Chance');
        expect(betTypes).toContain('Correct Score');
    });

    it('Should return all enabled bet types for league, and not contain disabled ones (Totals)', () => {
        const betTypes = getBetTypesForLeague(9806, LeagueMocks.leagueInfoEnabledSpreadDisabledTotals);

        expect(betTypes).toContain('Moneyline');
        expect(betTypes).toContain('Goal Spread');
        expect(betTypes).not.toContain('Total Goals');
    });

    it('Should return all enabled bet types for league, and not contain disabled ones (Double Chance and Correct Score)', () => {
        const betTypes = getBetTypesForLeague(9806, LeagueMocks.leagueInfoDisabledCorrectScoreAndDoubleChance);

        expect(betTypes).toContain('Moneyline');
        expect(betTypes).toContain('Goal Spread');
        expect(betTypes).not.toContain('Double Chance');
        expect(betTypes).not.toContain('Correct Score');
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

    it('Should return league rows of the requested league only, from the config array passed', () => {
        const leagueMap = LeagueMocks.leagueInfoEnabledAll;
        const leagueInfos = getLeagueInfo(9806, leagueMap);

        expect(leagueInfos.length).toBeGreaterThan(0);
        expect(leagueInfos).toEqual(leagueMap.filter((leagueInfo) => Number(leagueInfo.sportId) === 9806));
        expect(getLeagueInfo(-1, leagueMap)).toEqual([]);

        // another (refreshed) config array is indexed on its own
        const refreshedLeagueMap = leagueMap.slice(0, 1);
        expect(getLeagueInfo(9806, refreshedLeagueMap)).toEqual(refreshedLeagueMap);
    });

    it('Should return a copy of league rows, unaffected by changes of a previously returned array', () => {
        const leagueMap = LeagueMocks.leagueInfoEnabledAll;
        const leagueInfos = getLeagueInfo(9806, leagueMap);
        const count = leagueInfos.length;
        leagueInfos.pop();

        expect(getLeagueInfo(9806, leagueMap).length).toBe(count);
    });

    it('Should return league rows by lowercase market name, the first row for a repeated name', () => {
        const leagueInfos = LeagueMocks.leagueInfoEnabledAll.filter((leagueInfo) => leagueInfo.sportId === '9806');
        const duplicate = { ...leagueInfos[0], typeId: '99999' };
        const leagueInfoByMarketName = getLeagueInfoByMarketName([...leagueInfos, duplicate]);

        expect(leagueInfoByMarketName.get(leagueInfos[0].marketName.toLowerCase())).toBe(leagueInfos[0]);
        expect(leagueInfoByMarketName.get('moneyline')?.marketName).toBe('Moneyline');
    });
});
