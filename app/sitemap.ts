import { MetadataRoute } from 'next';
import HiveClient from '@/lib/hive/hiveclient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';

    // Static pages with proper priorities
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/leaderboard`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    try {
        // Fetch recent snaps for sitemap (limit for performance)
        const recentPosts = await HiveClient.database.getDiscussions('created', {
            tag: process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
            limit: 50,
        });

        // Filter and map in one pass for better performance
        const snapPages: MetadataRoute.Sitemap = recentPosts
            .filter((post: any) => {
                // Only include posts with media (images/videos)
                return post.body && (post.body.includes('![') || post.body.includes('<iframe'));
            })
            .map((post: any) => ({
                url: `${baseUrl}/user/${post.author}/snap/${post.permlink}`,
                lastModified: new Date(post.created),
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            }));

        return [...staticPages, ...snapPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return at least static pages if dynamic generation fails
        return staticPages;
    }
}
