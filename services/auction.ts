// Fetch auction by tokenId
export async function fetchAuctionByTokenId(tokenId: number): Promise<Auction | null> {
  if (!tokenId) return null;
  
  try {
    // Import DAO_ADDRESSES to filter by the correct DAO
    const { DAO_ADDRESSES } = await import('@/lib/utils/constants');
    
    console.log("🔍 fetchAuctionByTokenId:", { 
      tokenId, 
      daoToken: DAO_ADDRESSES.token,
      daoTokenLower: DAO_ADDRESSES.token.toLowerCase()
    });
    
    // Filter by both DAO and tokenId
    const { data } = (await noCacheApolloClient.query({
      query: GET_DATA,
      variables: {
        where: { 
          dao: DAO_ADDRESSES.token.toLowerCase(),
          token_: { tokenId: tokenId.toString() }
        },
        orderBy: "endTime",
        orderDirection: "desc",
        first: 1,
      },
    })) as GraphResponse;
    
    console.log("📦 GraphQL response:", { 
      tokenId, 
      auctionsFound: data.auctions?.length || 0,
      firstAuction: data.auctions?.[0] || null 
    });
    
    return data.auctions?.[0] || null;
  } catch (error) {
    console.error("Error in fetchAuctionByTokenId:", error);
    throw new Error("Error fetching auction by tokenId");
  }
}
import { noCacheApolloClient } from '@/lib/utils/apollo';
import { gql } from '@apollo/client';
import { Address } from 'viem';

export async function fetchAuction(tokenAddress: string): Promise<Auction[]> {
  const where = { dao: tokenAddress.toLocaleLowerCase() };

  try {
    const { data } = (await noCacheApolloClient.query({
      query: GET_DATA,
      variables: {
        where,
        orderBy: 'endTime',
        orderDirection: 'desc',
        first: 1,
      },
    })) as GraphResponse;

    return data.auctions;
  } catch (error) {
    throw new Error('Error fetching auction data');
  }
}

export interface GraphResponse {
  data: Data;
}

export interface Data {
  auctions: Auction[];
}

export interface Auction {
  bidCount: number;
  bids: Bid[];
  endTime: string;
  extended: boolean;
  settled: boolean;
  startTime: string;
  token: Token;
  dao: Dao;
  firstBidTime?: string;
  highestBid?: HighestBid;
  winningBid?: WinningBid;
}

export interface Bid {
  amount: string;
  bidder: Address;
  bidTime: string;
}

export interface HighestBid {
  amount: string;
  bidTime: string;
  bidder: Address;
}

export interface Token {
  content: any;
  image: string;
  name: string;
  tokenContract: string;
  tokenId: bigint;
  id: string;
}

export interface WinningBid {
  amount: string;
  bidTime: string;
  bidder: Address;
}

export interface Dao {
  auctionConfig: AuctionConfig;
}

export interface AuctionConfig {
  minimumBidIncrement: string;
  reservePrice: string;
}

const GET_DATA = gql`
  query Auctions(
    $where: Auction_filter
    $orderBy: Auction_orderBy
    $orderDirection: OrderDirection
    $first: Int
  ) {
    auctions(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
      bidCount
      bids(orderBy: bidTime) {
        amount
        bidder
        bidTime
      }
      endTime
      extended
      firstBidTime
      highestBid {
        amount
        bidTime
        bidder
      }
      settled
      startTime
      token {
        content
        image
        name
        tokenContract
        tokenId
        id
      }
      winningBid {
        amount
        bidTime
        bidder
      }
      dao {
        auctionConfig {
          minimumBidIncrement
          reservePrice
        }
      }
    }
  }
`; 