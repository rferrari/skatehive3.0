import { VT323 } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import './globals.css';
import { Metadata } from 'next';
import { ColorModeScript } from '@chakra-ui/react';
import Image from 'next/image';
// import '@aioha/react-ui/dist/build.css';
import '@coinbase/onchainkit/styles.css';

// Initialize the VT323 font
const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-vt323',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';

const frameObject = {
  version: 'next',
  imageUrl: `${BASE_URL}/ogimage.png`,
  button: {
    title: 'Open',
    action: {
      type: 'launch_frame',
      name: 'Skatehive',
      url: BASE_URL,
    },
  },
  postUrl: BASE_URL,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Skatehive - The Infinity Skateboard Magazine',
    template: '%s | Skatehive',
  },
  description:
    'The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.',
  keywords: [
    'skateboarding',
    'skate',
    'skateboard',
    'tricks',
    'spots',
    'community',
    'magazine',
  ],
  authors: [{ name: 'Skatehive Community' }],
  creator: 'Skatehive',
  publisher: 'Skatehive',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Skatehive - The Infinity Skateboard Magazine',
    description:
      'The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.',
    url: BASE_URL,
    siteName: 'Skatehive',
    images: [
      {
        url: '/ogimage.png',
        width: 1200,
        height: 630,
        alt: 'Skatehive - The infinity skateboard magazine',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skatehive - The Infinity Skateboard Magazine',
    description:
      'The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.',
    images: ['/ogimage.png'],
    creator: '@skatehive',
    site: '@skatehive',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  other: {
    'fc:frame': JSON.stringify(frameObject),
    'fc:frame:image': `${BASE_URL}/ogimage.png`,
    'fc:frame:post_url': BASE_URL,
  },
};

// Export the viewport configuration separately
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${vt323.variable}`}
      data-theme="skate"
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to IPFS gateway for faster video loading */}
        <link rel="preconnect" href="https://ipfs.skatehive.app" />
      </head>
      <body className="chakra-ui-dark">
        <div id="splash-root">
          <Image
            src="/SKATE_HIVE_VECTOR_FIN.svg"
            alt="Skatehive"
            height={80}
            width={80}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: '80px',
            }}
          />
        </div>
        <div id="app-root" style={{ display: 'none' }}>
          <ColorModeScript initialColorMode="dark" />
          <RootLayoutClient>{children}</RootLayoutClient>
        </div>
      </body>
    </html>
  );
}