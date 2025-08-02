import { ERC20ABI } from './abis/ERC20ABI';

export interface TokenInfo {
  address: string;
  abi: readonly any[];
  tokenLogo: string;
  decimals?: number;
  network?: string;
}

export const tokenDictionary: { [key: string]: TokenInfo } = {
  HIGHER: {
    address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe',
    abi: ERC20ABI,
    tokenLogo: "/logos/higher.png",
    decimals: 18,
    network: "base"
  },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    abi: ERC20ABI,
    tokenLogo: "/logos/usdc.png",
    decimals: 6,
    network: "base"
  },
  HIVE: {
    address: '0xNATIVE_HIVE',
    abi: [],
    tokenLogo: "/logos/hiveLogo.png",
    network: "hive"
  },
  HBD: {
    address: '0xNATIVE_HBD',
    abi: [],
    tokenLogo: "/logos/hbd.svg",
    network: "hive"
  }
};
