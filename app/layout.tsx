import { VT323 } from "next/font/google";
import RootLayoutClient from "./RootLayoutClient";
import "./globals.css";
import { Metadata } from "next";
import { ColorModeScript } from "@chakra-ui/react";

// Initialize the VT323 font
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});

const frameObject = {
  version: "next",
  imageUrl: `https://my.skatehive.app/opengraph-image`,
  button: {
    title: "Be brave",
    action: {
      type: "launch_frame", // Simplified action type
      name: "Skatehive",
      url: "https://my.skatehive.app",
    },
  },
  postUrl: "https://my.skatehive.app",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://my.skatehive.app"),
  title: "Skatehive App",
  description: "The infinity skateboard maganize",
  manifest: "/manifest.json",
  openGraph: {
    images: "/ogimage.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skatehive App",
    description: "The infinity skateboard maganize",
    images: "/ogimage.png",
  },
  alternates: {
    canonical: "/", // This will be automatically resolved relative to metadataBase
  },
  other: {
    // Use compliant image URL
    "fc:frame": JSON.stringify(frameObject),
    "fc:frame:image": "https://my.skatehive.app/ogimage.png",
    "fc:frame:post_url": "https://my.skatehive.app",
  },
};


// Export the viewport configuration separately
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${vt323.variable}`} data-theme="dark" style={{ colorScheme: "dark" }}>
      <body className="chakra-ui-dark">
        <ColorModeScript initialColorMode="dark" />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
