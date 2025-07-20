import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Auction
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const auctionAbi = [
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'createBid',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'settleCurrentAndCreateNewAuction',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'auction',
    outputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
      { name: 'bidder', internalType: 'address', type: 'address' },
      { name: 'settled', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'duration',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'reservePrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'minBidIncrement',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'bidder',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'extended', internalType: 'bool', type: 'bool', indexed: false },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionBid',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'startTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'winner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionSettled',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link auctionAbi}__
 */
export const useReadAuction = /*#__PURE__*/ createUseReadContract({
  abi: auctionAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"auction"`
 */
export const useReadAuctionAuction = /*#__PURE__*/ createUseReadContract({
  abi: auctionAbi,
  functionName: 'auction',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"duration"`
 */
export const useReadAuctionDuration = /*#__PURE__*/ createUseReadContract({
  abi: auctionAbi,
  functionName: 'duration',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"reservePrice"`
 */
export const useReadAuctionReservePrice = /*#__PURE__*/ createUseReadContract({
  abi: auctionAbi,
  functionName: 'reservePrice',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"minBidIncrement"`
 */
export const useReadAuctionMinBidIncrement =
  /*#__PURE__*/ createUseReadContract({
    abi: auctionAbi,
    functionName: 'minBidIncrement',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link auctionAbi}__
 */
export const useWriteAuction = /*#__PURE__*/ createUseWriteContract({
  abi: auctionAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"createBid"`
 */
export const useWriteAuctionCreateBid = /*#__PURE__*/ createUseWriteContract({
  abi: auctionAbi,
  functionName: 'createBid',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"settleCurrentAndCreateNewAuction"`
 */
export const useWriteAuctionSettleCurrentAndCreateNewAuction =
  /*#__PURE__*/ createUseWriteContract({
    abi: auctionAbi,
    functionName: 'settleCurrentAndCreateNewAuction',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link auctionAbi}__
 */
export const useSimulateAuction = /*#__PURE__*/ createUseSimulateContract({
  abi: auctionAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"createBid"`
 */
export const useSimulateAuctionCreateBid =
  /*#__PURE__*/ createUseSimulateContract({
    abi: auctionAbi,
    functionName: 'createBid',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link auctionAbi}__ and `functionName` set to `"settleCurrentAndCreateNewAuction"`
 */
export const useSimulateAuctionSettleCurrentAndCreateNewAuction =
  /*#__PURE__*/ createUseSimulateContract({
    abi: auctionAbi,
    functionName: 'settleCurrentAndCreateNewAuction',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link auctionAbi}__
 */
export const useWatchAuctionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: auctionAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link auctionAbi}__ and `eventName` set to `"AuctionBid"`
 */
export const useWatchAuctionAuctionBidEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: auctionAbi,
    eventName: 'AuctionBid',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link auctionAbi}__ and `eventName` set to `"AuctionCreated"`
 */
export const useWatchAuctionAuctionCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: auctionAbi,
    eventName: 'AuctionCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link auctionAbi}__ and `eventName` set to `"AuctionSettled"`
 */
export const useWatchAuctionAuctionSettledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: auctionAbi,
    eventName: 'AuctionSettled',
  })
