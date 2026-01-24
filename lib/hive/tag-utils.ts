import { HIVE_CONFIG } from "@/config/app.config";

const CREATED_QUERIES = new Set(["created", "highest_paid", "goat"]);

export function getHiveTagForQuery(query?: string) {
  const communityTag = HIVE_CONFIG.COMMUNITY_TAG;
  const searchTag = HIVE_CONFIG.SEARCH_TAG;
  const preferCommunity = query ? CREATED_QUERIES.has(query) : false;

  const primary = preferCommunity ? communityTag : searchTag;
  const fallback = preferCommunity ? searchTag : communityTag;

  return primary || fallback || "";
}
