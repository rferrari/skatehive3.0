import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkateHive Game",
  description: "Play the SkateHive HTML5 game",
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
