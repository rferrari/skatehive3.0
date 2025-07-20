const AUCTION_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "createBid",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "settleCurrentAndCreateNewAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "auction",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "address", name: "bidder", type: "address" },
      { internalType: "bool", name: "settled", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "duration",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "reservePrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minBidIncrement",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "bidder", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "bool", name: "extended", type: "bool" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }
    ],
    name: "AuctionBid",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "startTime", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }
    ],
    name: "AuctionCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "winner", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "AuctionSettled",
    type: "event"
  }
] as const;

export default AUCTION_ABI; 