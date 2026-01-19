/**
 * Blog Configuration
 * 
 * Configuration for blog pages and post fetching
 */

import { HIVE_CONFIG } from './app.config';

export const BLOG_CONFIG = {
  POSTS_PER_PAGE: 12,
  BRIDGE_API_MAX_LIMIT: 20, // Hive Bridge API maximum limit per request
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

// Hive configuration - use config values directly
export const HIVE_SEARCH_TAG = HIVE_CONFIG.SEARCH_TAG;
export const HIVE_COMMUNITY_TAG = HIVE_CONFIG.COMMUNITY_TAG;
