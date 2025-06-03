import { useAccount } from 'wagmi';

export function useOrderedIdentity() {
  const { address, isConnected } = useAccount();

  return {
    address: address as `0x${string}`,
    isConnected,
  };
}
