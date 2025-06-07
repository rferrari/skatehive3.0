'use client';
import Magazine from '@/components/shared/Magazine';

export default function MagazinePage() {
  // Show posts from the community, 30 at a time
  const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115';
  const tag = [{ tag: communityTag, limit: 30 }];
  const query = 'created'; // or 'trending', 'hot', etc.

  return <Magazine tag={tag} query={query} />;
} 