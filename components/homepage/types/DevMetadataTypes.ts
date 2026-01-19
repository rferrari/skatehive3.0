// Common types for DevMetadataDialog components

// Pinata API response types - matches /api/pinata/metadata/[hash] response
export interface PinataKeyValues {
    creator?: string;
    thumbnailUrl?: string;
    thumbnail?: string;  // alternate field from transcoder
    fileType?: string;
    uploadDate?: string;
    platform?: string;
    isMobile?: string;
    userAgent?: string;
    fileSize?: string;
    source_app?: string;  // 'webapp' | 'mobile' | 'unknown'
    app_version?: string;
    requestId?: string;
    deviceInfo?: string;
    userHP?: string;
    clientIP?: string;
    [key: string]: string | undefined;
}

export interface PinataFileInfo {
    cid: string;
    name: string;
    size: number;
    createdAt?: string;  // date_pinned from Pinata
    id?: string;
    keyvalues?: PinataKeyValues;  // Direct keyvalues at root
    mime_type?: string;  // Legacy field
    created_at?: string; // Legacy field
    metadata?: {
        name?: string;
        keyvalues?: PinataKeyValues;
    };
    number_of_files?: number;
}

// Post preview data for social media embeds
export interface PreviewData {
    title: string;
    description: string;
    image: string | null;
    thumbnails: string[];
    url: string;
    author: string;
    hasVideo: boolean;
    isVideoOnlyPost: boolean;
    renderedMeta?: Record<string, string>;
}

// Post timing and payout information
export interface PostInfo {
    created: string;
    cashoutTime: string;
    isPending: boolean;
    totalPayout: string;
    curatorPayout: string;
    pendingPayout: string;
    depth: number;
    children: number;
    voteCount: number;
}

// Comment structure from Hive API
export interface Comment {
    author: string;
    permlink: string;
    title?: string;
    body?: string;
    created?: string;
    cashout_time?: string;
    total_payout_value?: string;
    curator_payout_value?: string;
    pending_payout_value?: string;
    depth?: number;
    children?: number;
    parent_author?: string;
    parent_permlink?: string;
    json_metadata?: any;
    active_votes?: Array<{
        voter: string;
        weight: number;
        rshares: string;
    }>;
}

// Regex patterns for extracting media URLs
export const IMAGE_REGEX = /!\[.*?\]\((.*?)\)/g;
export const VIDEO_REGEX = /https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)(\?[^\s]*)?/gi;
export const IPFS_REGEX = /https?:\/\/(?:ipfs\.skatehive\.app|gateway\.ipfs\.io|ipfs\.io\/ipfs)\/[^\s\)]+/gi;
export const CID_REGEX = /(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-zA-Z0-9]{50,})/g;

// Props for DevMetadata dialog components
export interface DevMetadataDialogProps {
    isOpen: boolean;
    onClose: () => void;
    comment: Comment;
}

// Props for tab components
export interface TabComponentProps {
    comment: Comment;
    parsedMetadata: any;
    postInfo: PostInfo;
    previewData: PreviewData;
    extractedImages: string[];
    extractedVideos: string[];
    metadataImages: string[];
    metadataThumbnails: string[];
    extractedCids: string[];
    pinataData: Record<string, PinataFileInfo | null>;
    pinataLoading: Record<string, boolean>;
    pinataError: Record<string, string>;
    fetchPinataData: (cid: string) => Promise<void>;
}

// Utility function types
export type FormatFileSizeFunction = (bytes: number) => string;
export type GetMimeIconFunction = (mimeType?: string) => any;
export type IsVideoUrlFunction = (url: string) => boolean;
export type IsImageUrlFunction = (url: string) => boolean;