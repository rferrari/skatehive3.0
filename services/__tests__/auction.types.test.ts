import type { AuctionsQuery, Auction } from '../auction';

// Ensures that query responses contain expected fields at compile time.
// If the structure changes, TypeScript will raise errors during `pnpm type-check`.
export const verifyAuctionShape = (data: AuctionsQuery) => {
  data.auctions.forEach((auction: Auction) => {
    const tokenId: bigint = auction.token.tokenId;
    void tokenId;
  });
};
