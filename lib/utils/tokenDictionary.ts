import { ERC20ABI } from './abis/ERC20ABI';
import { GNARS_ERC20_ADDRESS, HIGHER_ERC20_ADDRESS, SKATEHIVE_ERC20_ADDRESS } from './constants';

export interface TokenInfo {
  address: string;
  abi: readonly any[];
  tokenLogo: string;
  decimals?: number;
  network?: string;
}

export const tokenDictionary: { [key: string]: TokenInfo } = {
  HIGHER: {
    address: HIGHER_ERC20_ADDRESS,
    abi: ERC20ABI,
    tokenLogo: "/logos/higher.png",
    decimals: 18,
    network: "base"
  },
  SKATEHIVE: {
    address: SKATEHIVE_ERC20_ADDRESS,
    abi: ERC20ABI,
    tokenLogo: "/logos/SKATE_HIVE_CIRCLE.svg",
    decimals: 18,
    network: "base"
  },
  GNARS: {
    address: GNARS_ERC20_ADDRESS,
    abi: ERC20ABI,
    tokenLogo: "https://www.gnars.wtf/images/logo.png",
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
