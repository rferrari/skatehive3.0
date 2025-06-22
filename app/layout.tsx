import { VT323 } from "next/font/google";
import RootLayoutClient from "./RootLayoutClient";
import "./globals.css";
import { Metadata } from "next";
import { ColorModeScript } from "@chakra-ui/react";
import InitFrameSDK from "@/hooks/init-frame-sdk";
import FrameMetaTags from "./components/FrameMetaTags";

// Initialize the VT323 font
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://my.skatehive.app"),
  title: "Skatehive App",
  description: "The infinity skateboard maganize",
  manifest: "/manifest.json",
  openGraph: {
    title: "Skatehive App",
    description: "The infinity skateboard maganize",
    images: "/ogimage.png",
    type: "website",
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
    <html
      lang="en"
      className={`${vt323.variable}`}
      data-theme="dark"
      style={{ colorScheme: "dark" }}
    >
      <head>
        <FrameMetaTags />
      </head>
      <body className="chakra-ui-dark">
        <InitFrameSDK />
        <ColorModeScript initialColorMode="dark" />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
