import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/compose/',
                    '/settings/',
                    '/_next/',
                    '/pages/',
                    '/src/',
                    '/_vercel/',
                    '/notifications.db'
                ],
                crawlDelay: 1,
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/compose/',
                    '/settings/',
                    '/_next/'
                ],
                crawlDelay: 0.5,
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/compose/',
                    '/settings/',
                    '/_next/'
                ],
                crawlDelay: 1,
            }
        ],
        sitemap: 'https://skatehive.app/sitemap.xml',
        host: 'https://skatehive.app',
    };
}
