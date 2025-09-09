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
        {
            url: `${baseUrl}/bounties`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/auction`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/map`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/magazine`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/wallet`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/compose`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/settings`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/invite`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/notifications`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/share`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    try {
        // Fetch recent snaps for sitemap using the correct bridge API
        const recentPosts = await HiveClient.call('bridge', 'get_ranked_posts', {
            tag: process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
            limit: 50,
            sort: 'created'
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

        // Add individual post pages
        const postPages: MetadataRoute.Sitemap = recentPosts
            .slice(0, 30) // Limit to most recent 30 posts
            .map((post: any) => ({
                url: `${baseUrl}/post/${post.author}/${post.permlink}`,
                lastModified: new Date(post.created),
                changeFrequency: 'monthly' as const,
                priority: 0.5,
            }));

        return [...staticPages, ...snapPages, ...postPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return at least static pages if dynamic generation fails
        return staticPages;
    }
}
