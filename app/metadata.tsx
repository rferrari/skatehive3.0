import { Metadata } from "next";
import { VT323 } from "next/font/google";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://skatehive.app";

// Initialize the VT323 font
export const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});


export const frameObject = {
  version: "next",
  imageUrl: `${BASE_URL}/ogimage.png`,
  button: {
    title: "Open",
    action: {
      type: "launch_frame",
      name: "Skatehive",
      url: BASE_URL,
    },
  },
  postUrl: BASE_URL,
};

export const mainMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Skatehive - The Infinity Skateboard Magazine",
    template: "%s | Skatehive",
  },
  description:
    "The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.",
  keywords: [
    "skateboarding",
    "skate",
    "skateboard",
    "tricks",
    "spots",
    "community",
    "magazine",
  ],
  authors: [{ name: "Skatehive Community" }],
  creator: "Skatehive",
  publisher: "Skatehive",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Skatehive - The Infinity Skateboard Magazine",
    description:
      "The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.",
    url: BASE_URL,
    siteName: "Skatehive",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "Skatehive - The infinity skateboard magazine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skatehive - The Infinity Skateboard Magazine",
    description:
      "The infinity skateboard magazine - Discover skateboarding content, tricks, spots, and join the global skateboarding community.",
    images: ["/ogimage.png"],
    creator: "@skatehive",
    site: "@skatehive",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "fc:frame": JSON.stringify(frameObject),
    "fc:frame:image": `${BASE_URL}/ogimage.png`,
    "fc:frame:post_url": BASE_URL,
  },
};


export const skatespotsMetadata: Metadata = {
  title: "Skate Map | Find and Share Skatespots Worldwide",
  description:
    "Discover and contribute to the Skatehive Skate Map – a collaborative tool to find, add, and share skate spots and parks near you.",
  keywords: [
    "skate map",
    "skate spot finder",
    "skateboarding map",
    "global skate spots",
    "skateparks",
    "street spots",
    "add skate spot",
  ],
  openGraph: {
    title: "Skate Map | Global Skatespot Finder",
    description:
      "Explore skateparks and street spots submitted by skaters worldwide.",
    url: "https://skatehive.app/map",
    images: [
      {
        url: "https://skatehive.app/og-map.png",
        width: 1200,
        height: 630,
        alt: "Skatehive Map Open Graph Image",
      },
    ],
    siteName: "Skatehive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skate Map | Global Skatespot Finder",
    description:
      "Explore skateparks and street spots submitted by skaters worldwide.",
    images: ["https://skatehive.app/og-map.png"],
  },
  alternates: {
    canonical: "https://skatehive.app/map",
  },
};