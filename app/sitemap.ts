import { MetadataRoute } from 'next';
import HiveClient from '@/lib/hive/hiveclient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://my.skatehive.app';

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/leaderboard`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
    ];

    try {
        // Fetch recent snaps for sitemap
        // Limit to prevent huge sitemaps and improve performance
        const recentPosts = await HiveClient.database.getDiscussions('created', {
            tag: process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
            limit: 50, // Limit to most recent snaps
        });

        const snapPages = recentPosts
            .filter((post: any) => {
                // Filter posts that have media (images/videos) - these are snaps
                const hasMedia = post.body.includes('![') || post.body.includes('<iframe');
                return hasMedia;
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
        return staticPages;
    }
}
