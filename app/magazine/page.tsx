'use client';
import Magazine from '@/components/shared/Magazine';

export default function MagazinePage() {
  // Show posts from the 'skatehive' community, 30 at a time
  const tag = [{ tag: 'skatehive', limit: 30 }];
  const query = 'created'; // or 'trending', 'hot', etc.

  return <Magazine tag={tag} query={query} />;
} 