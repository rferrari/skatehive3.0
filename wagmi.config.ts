import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';
import AUCTION_ABI from './lib/utils/abis/auction';
import { DAO_ADDRESSES } from './lib/utils/constants';

export default defineConfig({
  out: 'hooks/wagmiGenerated.ts',
  contracts: [
    {
      name: 'Auction',
      abi: AUCTION_ABI,
      address: DAO_ADDRESSES.auction,
    },
  ],
  plugins: [react()],
});
