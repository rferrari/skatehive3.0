/**
 * Helper function to convert Asset or string to string
 */
export function assetToString(val: string | { toString: () => string }): string {
    return typeof val === "string" ? val : val.toString();
}

/**
 * Helper function to parse payout strings like "1.234 HBD"
 */
export function parsePayout(
    val: string | { toString: () => string } | undefined
): number {
    if (!val) return 0;
    const str = assetToString(val);
    return parseFloat(str.replace(" HBD", "").replace(",", ""));
}

/**
 * Calculate days remaining for pending payout
 */
export function calculatePayoutDays(createdDate: string): {
    daysRemaining: number;
    isPending: boolean;
} {
    const created = new Date(createdDate);
    const now = new Date();
    const timeDifferenceInMs = now.getTime() - created.getTime();
    const timeDifferenceInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, 7 - Math.floor(timeDifferenceInDays));
    const isPending = timeDifferenceInDays < 7;

    return { daysRemaining, isPending };
}

/**
 * Deduplicate votes by voter (keep the last occurrence)
 */
export function deduplicateVotes(votes: any[]): any[] {
    const uniqueVotesMap = new Map();
    votes.forEach((vote) => {
        uniqueVotesMap.set(vote.voter, vote);
    });
    return Array.from(uniqueVotesMap.values());
}
