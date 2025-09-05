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

/**
 * Count downvotes (negative votes) from active_votes array
 */
export function countDownvotes(activeVotes: any[]): number {
    if (!activeVotes || !Array.isArray(activeVotes)) return 0;
    const downvotes = activeVotes.filter(vote => {
        // Check for negative weight, percent, or rshares indicating a downvote
        const weight = vote.weight || 0;
        const percent = vote.percent || 0;
        const rshares = vote.rshares || 0;
        
        // In the Hive blockchain:
        // - weight and rshares are the primary indicators
        // - percent might be 0 due to API conversion (see useSnaps.ts)
        // - negative values indicate downvotes
        const isDownvote = weight < 0 || percent < 0 || rshares < 0;
        
        if (isDownvote && process.env.NODE_ENV === 'development') {
            console.log(`📊 Downvote detected: voter=${vote.voter}, weight=${weight}, percent=${percent}, rshares=${rshares}`);
        }

        return isDownvote;
    });
    
    if (downvotes.length > 0 && process.env.NODE_ENV === 'development') {
        console.log(`📊 countDownvotes: Found ${downvotes.length} downvotes out of ${activeVotes.length} total votes`);
    }
    
    return downvotes.length;
}

/**
 * Filter discussions/posts based on reputation and downvote criteria
 * Filters out:
 * - Posts from accounts with reputation less than 0
 * - Posts with 2 or more downvotes
 */
export function filterQualityContent(discussions: any[]): any[] {
    // Import getReputation from client-functions to avoid duplication
    const { getReputation } = require('@/lib/hive/client-functions');
    
    return discussions.filter((discussion: any) => {
        // Deduplicate votes first to ensure accurate counting
        const deduplicatedVotes = deduplicateVotes(discussion.active_votes || []);
        const downvoteCount = countDownvotes(deduplicatedVotes);
        
        // Get author reputation and convert to readable format
        // getReputation now handles the 0 reputation edge case properly
        const rawReputation = discussion.author_reputation || 0;
        const authorReputation = getReputation(rawReputation);
        
        // Filter conditions:
        // 1. Filter out posts with 2 or more downvotes (community disapproval)
        // 2. Filter out posts from accounts with reputation less than 0
        const hasAcceptableDownvotes = downvoteCount < 2;
        const hasAcceptableReputation = authorReputation >= 0;
        
        const shouldShow = hasAcceptableDownvotes && hasAcceptableReputation;

        // Debug: Log posts that are being filtered out
        if (!shouldShow && process.env.NODE_ENV === "development") {
            console.log(`🚫 Filtering out post ${discussion.permlink}:`);
            console.log(`   - Author: ${discussion.author}`);
            console.log(`   - Reputation: ${authorReputation} (raw: ${rawReputation})`);
            console.log(`   - Downvotes: ${downvoteCount}`);
            console.log(`   - Acceptable downvotes: ${hasAcceptableDownvotes}`);
            console.log(`   - Acceptable reputation: ${hasAcceptableReputation}`);
        }

        return shouldShow;
    });
}

