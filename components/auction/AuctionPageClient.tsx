"use client";

import AuctionPage from "./AuctionPage";

interface AuctionPageClientProps {
  tokenId?: number;
  showNavigation?: boolean;
}

export default function AuctionPageClient({
  tokenId,
  showNavigation = false,
}: AuctionPageClientProps) {
  return <AuctionPage tokenId={tokenId} showNavigation={showNavigation} />;
}
