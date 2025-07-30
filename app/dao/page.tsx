import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "DAO - Under Construction",
  description:
    "The Skatehive DAO is currently under construction. Stay tuned for updates!",
  openGraph: {
    title: "DAO - Under Construction | Skatehive",
    description:
      "The Skatehive DAO is currently under construction. Stay tuned for updates!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO - Under Construction | Skatehive",
    description:
      "The Skatehive DAO is currently under construction. Stay tuned for updates!",
  },
};

export default function DAOPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="text-center px-6 py-12 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logos/SKATE_HIVE_CIRCLE.svg"
            alt="Skatehive Logo"
            width={120}
            height={120}
            className="mx-auto opacity-90"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-mono">
            DAO
          </h1>

          <div className="relative">
            <h2 className="text-2xl md:text-3xl text-orange-400 font-semibold mb-4">
              Under Construction
            </h2>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
          </div>

          <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8"></p>
            We&#39;re building something awesome for the Skatehive community. Our
            DAO governance system will give you the power to shape the future of
            skateboarding culture.
          </p>

          {/* Construction Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>

          {/* Features Coming Soon */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-xl text-white mb-4 font-semibold">
              Coming Soon:
            </h3>
            <ul className="text-gray-300 space-y-2 text-left">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                Community Governance Proposals
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                Token-based Voting System
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                Treasury Management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                Skatehive Improvement Proposals
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="pt-6">
            <p className="text-gray-400 text-sm">
              Want to stay updated? Follow us on our social channels for the
              latest news.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
