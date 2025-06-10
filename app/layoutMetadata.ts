// deprecated for farcaster frames metadata

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Skatehive - The Future of Skateboarding',
        template: '%s | Skatehive',
    },
    description: 'The infinity skateboarding magazine',
    keywords: ['Skateboarding', 'Web3', 'Decentralization', 'Community', 'Skatehive', 'hive', "bitcoin"],
    metadataBase: new URL('https://my.skatehive.app'),
    authors: [{ name: 'Skatehive' }],
    robots: { index: true, follow: true },
    openGraph: {
        title: 'Skatehive - The Future of underground Skateboarding',
        description: 'Join the decentralized skateboarding community and start earning for your content.',
        url: 'https://my.skatehive.app',
        siteName: 'Skatehive',
        images: [
            {
                url: '/images/ogimage.png',
                width: 1200,
                height: 630,
                alt: 'Skatehive Preview',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Skatehive - The Future of underground Skateboarding',
        description: 'Skatehive is the decentralized skateboarding community where skaters share and store content forever',
        images: ['/images/ogimage.png'],
        creator: '@skatehive',
    },
    viewport: 'width=device-width, initial-scale=1.0',
    icons: {
        icon: '/favicon.ico',
    },
};
