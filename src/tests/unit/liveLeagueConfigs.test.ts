import { expandLiveLeagueConfigs, getLiveLeagueCsvKind, LiveLeagueCsvRow } from '../../utils/liveLeagueConfigs';

const market = (typeId: string, marketName: string, extra: Partial<Record<string, string>> = {}) => ({
    typeId,
    marketName,
    type: 'Moneyline',
    enabled: 'true',
    minOdds: '0.99',
    maxOdds: '0.01',
    addedSpread: '1',
    primaryBookmaker: '',
    secondaryBookmaker: '',
    tertiaryBookmaker: '',
    percentageDiffForLines: '',
    ...extra,
});

const legacy = (name: string, sportId: string, typeId: string, marketName: string, extra = {}) => ({
    name,
    sportId,
    ...market(typeId, marketName, extra),
});

const templates: LiveLeagueCsvRow[] = [
    { template: 'soccer-league', ...market('0', 'Moneyline') },
    { template: 'soccer-league', ...market('10001', 'Asian Handicap', { type: 'Spread', primaryBookmaker: '1xbet' }) },
    { template: 'soccer-league', ...market('10002', 'Total Goals', { type: 'Total' }) },
    { template: 'soccer-cup', ...market('0', 'Moneyline') },
];

const leagues: LiveLeagueCsvRow[] = [
    { name: 'Romania - Liga II', sportId: '20662', template: 'soccer-league' },
    { name: 'EPL', sportId: '9011', template: 'soccer-league' },
];

const overrideRow = (sportId: string, typeId: string, marketName: string, extra = {}) => {
    const row: LiveLeagueCsvRow = { sportId, ...market(typeId, marketName, extra) };
    return row;
};

describe('Live league configs', () => {
    it('Should tell the files apart by their columns', () => {
        expect(getLiveLeagueCsvKind(templates)).toBe('templates');
        expect(getLiveLeagueCsvKind(leagues)).toBe('leagues');
        expect(getLiveLeagueCsvKind([overrideRow('9011', '0', 'Moneyline')])).toBe('rows');
        expect(getLiveLeagueCsvKind([legacy('NBA', '4', '0', 'Moneyline')])).toBe('rows');
        expect(getLiveLeagueCsvKind([])).toBe('rows');
    });

    it('Should return legacy rows as they are', () => {
        const nba = [legacy('NBA', '4', '0', 'Moneyline'), legacy('NBA', '4', '10001', 'Spread')];
        const mls = [legacy('MLS', '10', '0', 'Moneyline')];

        const rows = expandLiveLeagueConfigs([nba, mls]);

        expect(rows).toEqual([...nba, ...mls]);
        expect(rows[0]).toBe(nba[0]);
    });

    it('Should copy the template rows to each league, with its name and sportId', () => {
        const rows = expandLiveLeagueConfigs([templates, leagues, []]);

        expect(rows).toEqual([
            legacy('Romania - Liga II', '20662', '0', 'Moneyline'),
            legacy('Romania - Liga II', '20662', '10001', 'Asian Handicap', {
                type: 'Spread',
                primaryBookmaker: '1xbet',
            }),
            legacy('Romania - Liga II', '20662', '10002', 'Total Goals', { type: 'Total' }),
            legacy('EPL', '9011', '0', 'Moneyline'),
            legacy('EPL', '9011', '10001', 'Asian Handicap', { type: 'Spread', primaryBookmaker: '1xbet' }),
            legacy('EPL', '9011', '10002', 'Total Goals', { type: 'Total' }),
        ]);
        // same column order as a legacy row
        expect(Object.keys(rows[0])).toEqual(Object.keys(legacy('x', '1', '0', 'Moneyline')));
    });

    it('Should replace, add and remove markets by override rows', () => {
        const overrides = [
            overrideRow('9011', '10001', 'Asian Handicap', { type: 'Spread', primaryBookmaker: 'fanduel oddspapi' }),
            overrideRow('9011', '10237', 'Total Shots On Target', { type: 'Total' }),
            overrideRow('9011', '10002', '', { enabled: 'removed' }),
            overrideRow('20662', '0', 'Moneyline', { enabled: 'false' }),
        ];

        const rows = expandLiveLeagueConfigs([templates, leagues, overrides]);

        expect(rows).toEqual([
            legacy('Romania - Liga II', '20662', '0', 'Moneyline', { enabled: 'false' }),
            legacy('Romania - Liga II', '20662', '10001', 'Asian Handicap', {
                type: 'Spread',
                primaryBookmaker: '1xbet',
            }),
            legacy('Romania - Liga II', '20662', '10002', 'Total Goals', { type: 'Total' }),
            legacy('EPL', '9011', '0', 'Moneyline'),
            legacy('EPL', '9011', '10001', 'Asian Handicap', {
                type: 'Spread',
                primaryBookmaker: 'fanduel oddspapi',
            }),
            legacy('EPL', '9011', '10237', 'Total Shots On Target', { type: 'Total' }),
        ]);
    });

    it('Should take the league name from the leagues file, not from override rows', () => {
        const overrides = [{ name: 'Old name', ...overrideRow('9011', '0', 'Moneyline', { minOdds: '0.95' }) }];

        const rows = expandLiveLeagueConfigs([templates, leagues, overrides]);

        expect(rows.filter((row) => row.sportId === '9011').map((row) => row.name)).toEqual(['EPL', 'EPL', 'EPL']);
        expect(rows.find((row) => row.sportId === '9011' && row.typeId === '0')?.minOdds).toBe('0.95');
    });

    it('Should build a league without a template from its override rows only', () => {
        const rows = expandLiveLeagueConfigs([
            templates,
            [{ name: 'Some cup', sportId: '20125', template: '' }],
            [overrideRow('20125', '0', 'Moneyline')],
        ]);

        expect(rows).toEqual([legacy('Some cup', '20125', '0', 'Moneyline')]);
    });

    it('Should skip a league with an unknown template and warn', () => {
        const warnings: string[] = [];

        const rows = expandLiveLeagueConfigs(
            [templates, [{ name: 'Lost league', sportId: '1', template: 'nope' }, ...leagues], []],
            { onWarning: (message) => warnings.push(message) }
        );

        expect(rows.some((row) => row.sportId === '1')).toBe(false);
        expect(rows.filter((row) => row.sportId === '9011')).toHaveLength(3);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('unknown template nope');
    });

    it('Should keep legacy rows of other leagues next to templated ones, in file order', () => {
        const otherSports = [legacy('NBA', '4', '0', 'Moneyline')];

        const rows = expandLiveLeagueConfigs([templates, leagues, [], otherSports]);

        expect(rows).toHaveLength(7);
        expect(rows[6]).toBe(otherSports[0]);
    });

    it('Should treat legacy rows of a templated league as its overrides', () => {
        // e.g. the old single file still listed next to the new files
        const oldFile = [legacy('EPL', '9011', '0', 'Moneyline', { minOdds: '0.9' })];

        const rows = expandLiveLeagueConfigs([templates, leagues, oldFile]);

        expect(rows.filter((row) => row.sportId === '9011')).toHaveLength(3);
        expect(rows.find((row) => row.sportId === '9011' && row.typeId === '0')?.minOdds).toBe('0.9');
    });

    it('Should not repeat a league listed twice', () => {
        const warnings: string[] = [];

        const rows = expandLiveLeagueConfigs([templates, leagues, [leagues[1]], []], {
            onWarning: (message) => warnings.push(message),
        });

        expect(rows.filter((row) => row.sportId === '9011')).toHaveLength(3);
        expect(warnings[0]).toContain('listed more than once');
    });
});
