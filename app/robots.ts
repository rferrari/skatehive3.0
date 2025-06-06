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
                    '/src/'
                ],
            }
        ],
        sitemap: 'https://my.skatehive.app/sitemap.xml',
    };
}
