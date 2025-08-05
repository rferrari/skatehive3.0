import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quest for Skateboard - SkateHive Game",
  description:
    "Experience the ultimate skateboarding adventure in Quest for Skateboard! Control your skater through challenging levels, perform epic tricks, and master the art of skateboarding in this immersive browser-based game.",
  keywords: [
    "skateboarding game",
    "skateboard",
    "quest",
    "browser game",
    "skatehive",
    "skating",
    "tricks",
    "skater",
    "sports game",
    "adventure",
  ],
  authors: [{ name: "SkateHive" }],
  creator: "SkateHive",
  publisher: "SkateHive",
  category: "Games",
  openGraph: {
    title: "Quest for Skateboard - SkateHive Game",
    description:
      "Experience the ultimate skateboarding adventure! Control your skater, perform tricks, and master challenging levels in this immersive browser game.",
    type: "website",
    url: "/game",
    siteName: "SkateHive",
    images: [
      {
        url: "/game-preview.jpg", // You can add an actual game screenshot here
        width: 1200,
        height: 630,
        alt: "Quest for Skateboard Game Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quest for Skateboard - SkateHive Game",
    description:
      "Experience the ultimate skateboarding adventure! Control your skater and perform epic tricks.",
    images: ["/game-preview.jpg"], // Same image as OpenGraph
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1f2937", // Matches the gray-900 background
};

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Quest for Skatboard
          </h1>

          <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src="https://html5-game-skatehive.vercel.app/QFShive/index.html"
              className="w-full h-[800px] border-0"
              title="SkateHive Game"
              allow="fullscreen; autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Use arrow keys or WASD to control your skater. Have fun!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
