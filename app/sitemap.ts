import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: 'https://my.skatehive.app/', lastModified: new Date() },
        { url: 'https://my.skatehive.app/blog', lastModified: new Date() },
        { url: 'https://my.skatehive.app/about', lastModified: new Date() },
        // You can add more static pages here
        // For dynamic pages, you'll need to implement logic to fetch and add them
    ];
}
