import { Auction, fetchAuction } from '@/services/auction';
import AUCTION_ABI from '@/lib/utils/abis/auction';
import { DAO_ADDRESSES } from '@/lib/utils/constants';
import { getConfig } from '@/lib/utils/wagmi';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { readContract } from 'wagmi/actions';

export function useLastAuction(tokenAddress: string, initialData?: Auction) {
  return useQuery({
    queryKey: ['auction', tokenAddress],
    queryFn: () => fetchAuction(tokenAddress),
    refetchOnMount: true,
    staleTime: 0,
    initialData: initialData ? [initialData] : undefined,
    select: (data) => data?.[0],
  });
}

export const useAuction = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractData = await readContract(getConfig(), {
          address: DAO_ADDRESSES.auction,
          abi: AUCTION_ABI,
          functionName: 'auction',
        });
        setData(contractData);
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  return { data, error };
}; 