import { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Skatehive - The Infinity Skateboard Magazine",
  description:
    "Discover the latest skateboarding content, tricks, spots, and community posts. Join the global skateboarding community on Skatehive.",
  openGraph: {
    title: "Skatehive - The Infinity Skateboard Magazine",
    description:
      "Discover the latest skateboarding content, tricks, spots, and community posts. Join the global skateboarding community on Skatehive.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skatehive - The Infinity Skateboard Magazine",
    description:
      "Discover the latest skateboarding content, tricks, spots, and community posts. Join the global skateboarding community on Skatehive.",
  },
};

export default function Home() {
  return <HomePageClient />;
}
