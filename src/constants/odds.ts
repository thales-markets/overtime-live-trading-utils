// For each ourOdds, this is the minimum otherOdds we require to NOT block
// USED FOR TESTS ONLY, real anchors are passed from risk repo
export const ODDS_THRESHOLD_ANCHORS = [
    { our: 1.05, otherMin: 1.03 },
    { our: 1.1, otherMin: 1.06 },
    { our: 1.2, otherMin: 1.15 },
    { our: 1.3, otherMin: 1.25 },
    { our: 1.4, otherMin: 1.33 },
    { our: 1.5, otherMin: 1.4 },

    { our: 2.0, otherMin: 1.85 },
    { our: 2.5, otherMin: 2.25 },
    { our: 3.0, otherMin: 2.5 },
    { our: 4.0, otherMin: 3.5 },

    { our: 8.0, otherMin: 6.5 },
    { our: 10.0, otherMin: 8.0 },
    { our: 100.0, otherMin: 70.0 },
];
