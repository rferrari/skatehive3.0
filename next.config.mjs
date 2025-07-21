/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Increase the body size limit
        },
    },
    webpack: (config, { isServer }) => {
        // Suppress warnings for known issues
        config.ignoreWarnings = [
            /critical dependency: the request of a dependency is an expression/,
            /Module not found: Can't resolve 'pino-pretty'/,
            /warning.*cast between incompatible function types/,
        ];

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
            }
            ,
            {
                source: '/post/hive-173115/@:author/:permlink',
                destination: '/post/:author/:permlink',
                permanent: true,
            }
        ];
    },
}

export default nextConfig;

