/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '200mb', // Increase the body size limit for large video uploads
        },
    },
    webpack: (config, { isServer, dev }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                buffer: false,
                util: false,
                assert: false,
                url: false,
                os: false,
                path: false,
                memcpy: false,
                'pino-pretty': false,
            };
        }
        
        // Remove console.log statements in production
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                usedExports: true,
                sideEffects: false,
            };
        }
        
        // Ignore specific problematic modules
        config.resolve.alias = {
            ...config.resolve.alias,
            'memcpy': false,
            'pino-pretty': false,
        };
        
        // Add externals for server-side only modules
        if (!isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                'memcpy': 'memcpy',
                'pino-pretty': 'pino-pretty',
            });
        }
        
        return config;
    },
    async redirects() {
        return [
            // Profile redirects: /@username -> /user/username
            {
                source: '/@:username',
                destination: '/user/:username',
                permanent: true,
            },
            // Old profile page: /skater/author -> /user/author
            {
                source: '/skater/:author',
                destination: '/user/:author',
                permanent: true,
            },
            // Post redirects: /@author/permlink -> /post/author/permlink
            {
                source: '/@:author/:permlink',
                destination: '/post/:author/:permlink',
                permanent: true,
            },
            // Category post redirects: /category/@author/permlink -> /post/author/permlink
            {
                source: '/:category/@:author/:permlink',
                destination: '/post/:author/:permlink',
                permanent: true,
            },
            {
                source: '/post/hive-173115/@:author/:permlink',
                destination: '/post/:author/:permlink',
                permanent: true,
            },
            // Redirect /skatespots to /map
            {
                source: '/skatespots',
                destination: '/map',
                permanent: true,
            }
        ];
    },
    async headers() {
        return [
            {
                // Apply headers to all routes
                source: '/(.*)',
                headers: [
                    {
                        // Allow embedding in any iframe (removes X-Frame-Options restrictions)
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        // Alternative modern approach - allow all origins to embed
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors *;",
                    },
                    {
                        // Ensure the site can be embedded in frames
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },
}

export default nextConfig;
