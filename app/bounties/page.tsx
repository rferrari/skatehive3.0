import { Metadata } from "next";
import BountiesClient from "@/components/bounties/bountiesClient";

export const metadata: Metadata = {
  title: "Bounties | Skate Trick Challenges",
  description:
    "Submit and complete skate trick bounties. Post a challenge, submit your trick, and earn respect!",
  keywords: [
    "skate bounties",
    "trick challenges",
    "skateboarding",
    "skatehive",
    "bounty",
    "skate tricks",
  ],
  openGraph: {
    title: "Bounties | Skate Trick Challenges",
    description:
      "Submit and complete skate trick bounties. Post a challenge, submit your trick, and earn respect!",
    url: "https://skatehive.app/bounties",
    images: [
      {
        url: "https://skatehive.app/og-bounties.png",
        width: 1200,
        height: 630,
        alt: "Skatehive Bounties Open Graph Image",
      },
    ],
    siteName: "Skatehive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bounties | Skate Trick Challenges",
    description:
      "Submit and complete skate trick bounties. Post a challenge, submit your trick, and earn respect!",
    images: ["https://skatehive.app/og-bounties.png"],
  },
  alternates: {
    canonical: "https://skatehive.app/bounties",
  },
};

export default function BountiesPage() {
  return <BountiesClient />;
} 