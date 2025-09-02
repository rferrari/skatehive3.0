// Blog page configuration constants
export const BLOG_CONFIG = {
  POSTS_PER_PAGE: 12,
  GOAT_BATCH_SIZE: 100,
  MAX_GOAT_BATCHES: 10,
  BATCH_DELAY_MS: 300,
  get MAX_GOAT_POSTS() {
    return this.MAX_GOAT_BATCHES * this.GOAT_BATCH_SIZE;
  },
} as const;

// Valid query types for blog posts
export const VALID_QUERIES = [
  "created",
  "trending", 
  "hot",
  "highest_paid",
  "goat"
] as const;

// Valid view modes for blog display
export const VALID_VIEW_MODES = [
  "grid",
  "list", 
  "magazine"
] as const;

export type QueryType = typeof VALID_QUERIES[number];
export type ViewMode = typeof VALID_VIEW_MODES[number];

// Environment variable keys
export const ENV_KEYS = {
  HIVE_SEARCH_TAG: 'NEXT_PUBLIC_HIVE_SEARCH_TAG',
  HIVE_COMMUNITY_TAG: 'NEXT_PUBLIC_HIVE_COMMUNITY_TAG',
} as const;
