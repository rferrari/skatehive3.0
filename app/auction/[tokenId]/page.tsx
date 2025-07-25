"use client";

import AuctionPage from "@/components/auction/AuctionPage";
import { useParams } from "next/navigation";

export default function AuctionTokenPage() {
  const params = useParams();
  const tokenId = params?.tokenId ? Number(params.tokenId) : undefined;

  return <AuctionPage tokenId={tokenId} showNavigation={true} />;
}
