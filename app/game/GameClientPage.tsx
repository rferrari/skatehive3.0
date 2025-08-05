"use client";

import { useState, useEffect } from "react";

export default function GameClientPage() {
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  const toggleModalFullscreen = () => {
    setIsModalFullscreen(!isModalFullscreen);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F key for fullscreen toggle
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleModalFullscreen();
      }
      // Escape key to exit fullscreen
      if (event.key === "Escape" && isModalFullscreen) {
        event.preventDefault();
        setIsModalFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isModalFullscreen]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Quest for Skateboard
            </h1>

            <div className="bg-black rounded-lg overflow-hidden shadow-2xl relative">
              {/* Fullscreen Button - Bright and Always Visible */}
              <button
                onClick={toggleModalFullscreen}
                className="absolute top-4 right-4 z-[100] bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-xl font-medium text-sm border-2 border-blue-400"
                title="Enter Fullscreen (F key)"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  <span>Fullscreen</span>
                </div>
              </button>

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
                Use arrow keys or WASD to control your skater. Press{" "}
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs text-white">
                  F
                </kbd>{" "}
                for fullscreen. Have fun!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fullscreen */}
      {isModalFullscreen && (
        <div
          className="fixed inset-0 bg-black z-[9999] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsModalFullscreen(false)}
            className="absolute top-4 right-4 z-[10000] bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg transition-all duration-200 shadow-xl"
            title="Exit Fullscreen (ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Fullscreen Game */}
          <div className="flex-1 w-full h-full">
            <iframe
              src="https://html5-game-skatehive.vercel.app/QFShive/index.html"
              className="w-full h-full border-0"
              title="SkateHive Game - Fullscreen"
              allow="fullscreen; autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          </div>
        </div>
      )}
    </>
  );
}
