import { VT323 } from "next/font/google";
import { metadata } from "./layoutMetadata";
import RootLayoutClient from "./RootLayoutClient";
import "./globals.css";

// Initialize the VT323 font
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});

// Export the metadata for Next.js to use
export { metadata };

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
    <html lang="en" className={`${vt323.variable}`}>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
