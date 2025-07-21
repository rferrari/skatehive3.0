// Farcaster Miniapp Types

export interface FarcasterNotificationDetails {
    url: string;
    token: string;
}

export interface EventMiniAppAddedPayload {
    event: 'miniapp_added';
    notificationDetails?: FarcasterNotificationDetails;
}

export interface EventMiniAppRemovedPayload {
    event: 'miniapp_removed';
}

export interface EventNotificationsEnabledPayload {
    event: 'notifications_enabled';
    notificationDetails: FarcasterNotificationDetails;
}

export interface EventNotificationsDisabledPayload {
    event: 'notifications_disabled';
}

export type FarcasterWebhookPayload =
    | EventMiniAppAddedPayload
    | EventMiniAppRemovedPayload
    | EventNotificationsEnabledPayload
    | EventNotificationsDisabledPayload;

export interface FarcasterSignature {
    header: string;    // base64url encoded JFS header
    payload: string;   // base64url encoded payload
    signature: string; // base64url encoded signature
}

export interface FarcasterNotificationRequest {
    notificationId: string;  // Max 128 characters
    title: string;          // Max 32 characters
    body: string;           // Max 128 characters
    targetUrl: string;      // Max 1024 characters, same domain as miniapp
    tokens: string[];       // Max 100 tokens
}

export interface FarcasterNotificationResponse {
    successfulTokens: string[];
    invalidTokens: string[];
    rateLimitedTokens: string[];
}

export interface FarcasterUserToken {
    fid: string;
    username: string;
    hiveUsername?: string;
    token: string;
    notificationUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface HiveToFarcasterNotification {
    type: 'vote' | 'comment' | 'reply_comment' | 'follow' | 'mention' | 'reblog' | 'transfer';
    title: string;
    body: string;
    hiveUsername: string;
    sourceUrl?: string;
    metadata?: {
        author?: string;
        permlink?: string;
        amount?: string;
    };
}

// Enhanced Farcaster user data types
export interface FarcasterEnhancedUserData {
    custody?: string;
    verifications?: string[];
    failed?: boolean;
}

export interface FarcasterUser {
    fid: number;
    username: string;
    displayName?: string;
    pfpUrl?: string;
    custody?: string;
    verifications?: string[];
}

export interface FarcasterUserWithEnhancedData extends FarcasterUser {
    enhancedData?: FarcasterEnhancedUserData;
}
