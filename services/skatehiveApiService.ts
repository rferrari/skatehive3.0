/**
 * Skatehive API Service
 * 
 * Client for the Skatehive REST API (api.skatehive.app)
 */

import { APP_CONFIG } from '@/config/app.config';

const API_BASE_URL = APP_CONFIG.API_BASE_URL;

// Types matching the API response
export interface HighestPaidPost {
    author: string;
    permlink: string;
    title: string;
    body: string;
    created: string;
    total_payout: number;
    pending_payout: number;
    author_rewards: number;
    curator_payout: number;
    total_votes: number;
    json_metadata: Record<string, unknown>;
    url: string;
    thumbnail: string | null;
}

export interface HighestPaidResponse {
    posts: HighestPaidPost[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    cacheInfo: {
        source: string;
        lastUpdated: string | null;
        executionTimeMs: number;
    };
    filters: {
        community: string;
        minPayout: number | null;
        author: string | null;
    };
}

interface FetchHighestPaidOptions {
    page?: number;
    limit?: number;
    minPayout?: number;
    author?: string;
    community?: string;
    days?: number | null; // null = all time (GOAT), number = last X days
}

/**
 * Fetch highest paid posts from the Skatehive API
 * 
 * @param options.days - null for all-time GOAT posts, or number for recent highest paid
 */
export async function fetchHighestPaidPosts(
    options: FetchHighestPaidOptions = {}
): Promise<HighestPaidResponse> {
    const {
        page = 1,
        limit = 25,
        minPayout,
        author,
        community = 'hive-173115',
        days = null, // Default to all-time
    } = options;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        community,
    });

    if (minPayout !== undefined && minPayout > 0) {
        params.set('minPayout', String(minPayout));
    }

    if (author) {
        params.set('author', author);
    }

    if (days !== null && days > 0) {
        params.set('days', String(days));
    }

    const url = `${API_BASE_URL}/api/v2/highest-paid?${params.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        cache: 'no-store', // Don't cache on client side, API handles caching
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch highest paid posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Convert API response to Discussion-like format for compatibility with existing components
 */
export function convertToDiscussionFormat(post: HighestPaidPost): Record<string, unknown> {
    return {
        author: post.author,
        permlink: post.permlink,
        title: post.title,
        body: post.body,
        created: post.created,
        json_metadata: JSON.stringify(post.json_metadata),
        pending_payout_value: `${post.pending_payout.toFixed(3)} HBD`,
        total_payout_value: `${post.author_rewards.toFixed(3)} HBD`,
        curator_payout_value: `${post.curator_payout.toFixed(3)} HBD`,
        // Calculated fields for compatibility
        net_votes: post.total_votes,
        children: 0,
        // Add computed total for sorting display
        _totalPayout: post.total_payout,
        _thumbnail: post.thumbnail,
        url: post.url,
    };
}
