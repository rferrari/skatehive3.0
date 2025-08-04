import { 
  getAccount,
  getChainId,
  getPublicClient,
  writeContract,
  waitForTransactionReceipt,
  getBalance,
  readContract,
  switchChain
} from '@wagmi/core';
import { parseUnits, parseEther, erc20Abi, Address } from 'viem';
import { base } from 'wagmi/chains';
import { wagmiConfig } from '@/app/providers';
import { tokenDictionary } from '@/lib/utils/tokenDictionary';
import { AirdropUser, TransactionStatus } from '@/types/airdrop';
import { airdropABI } from '@/lib/utils/abis/airdropABI';

const AIRDROP_CONTRACT = '0x8bD8F0D46c84feCBFbF270bac4Ad28bFA2c78F05';


interface AirdropResult {
  hash: string;
  recipients: number;
}

export class ERC20AirdropService {
  private async validateNetwork(): Promise<void> {
    const chainId = getChainId(wagmiConfig);
    if (chainId !== base.id) {
      try {
        await switchChain(wagmiConfig, { chainId: base.id });
      } catch (error) {
        throw new Error(`Please switch to Base network. Current chain: ${chainId}. Switch failed: ${error}`);
      }
    }
  }

  private async validateConnection(): Promise<string> {
    const account = getAccount(wagmiConfig);
    if (!account.address) {
      throw new Error('Wallet not connected');
    }
    return account.address;
  }



  private async checkBalance(
    userAddress: string,
    tokenSymbol: string,
    totalAmount: string
  ): Promise<void> {
    const tokenInfo = tokenDictionary[tokenSymbol];
    if (!tokenInfo) throw new Error(`Token ${tokenSymbol} not found`);

    if (tokenSymbol === 'ETH') {
      const balance = await getBalance(wagmiConfig, {
        address: userAddress as `0x${string}`,
        chainId: base.id
      });
      
      const requiredAmount = parseEther(totalAmount);
      if (balance.value < requiredAmount) {
        throw new Error(
          `Insufficient ETH balance. Required: ${totalAmount} ETH, Available: ${balance.formatted} ETH`
        );
      }
    } else {
      // For ERC-20 tokens, check balance via contract
      const tokenInfo = tokenDictionary[tokenSymbol];
      if (!tokenInfo?.address) {
        throw new Error(`Token contract address not found for ${tokenSymbol}`);
      }

      try {
        const balance = await readContract(wagmiConfig, {
          address: tokenInfo.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`]
        });
        
        const requiredAmount = parseUnits(totalAmount, tokenInfo.decimals || 18);
        if (balance < requiredAmount) {
          throw new Error(
            `Insufficient ${tokenSymbol} balance. Required: ${totalAmount} ${tokenSymbol}`
          );
        }
      } catch (error) {
        console.error(`Failed to check ${tokenSymbol} balance:`, error);
        throw new Error(`Failed to verify ${tokenSymbol} balance`);
      }
    }
  }

  private async checkAllowance(
    userAddress: string,
    tokenSymbol: string,
    totalAmount: string
  ): Promise<boolean> {
    if (tokenSymbol === 'ETH') return true; // ETH doesn't need approval

    const tokenInfo = tokenDictionary[tokenSymbol];
    if (!tokenInfo?.address) return false;

    try {
      const allowance = await readContract(wagmiConfig, {
        address: tokenInfo.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [
          userAddress as `0x${string}`,
          process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ADDRESS as `0x${string}`
        ]
      });
      
      const requiredAmount = parseUnits(totalAmount, tokenInfo.decimals || 18);
      return allowance >= requiredAmount;
    } catch (error) {
      console.error(`Failed to check ${tokenSymbol} allowance:`, error);
      return false;
    }
  }

  async estimateAirdropCost(
    tokenSymbol: string,
    recipients: AirdropUser[],
    totalAmount: string,
    userAddress?: string
  ): Promise<{
    tokenAmount: bigint;
    canExecute: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      await this.validateNetwork();
      
      if (!userAddress) {
        errors.push('Wallet not connected');
        return {
          tokenAmount: BigInt(0),
          canExecute: false,
          errors
        };
      }

      const tokenInfo = tokenDictionary[tokenSymbol];
      if (!tokenInfo) {
        errors.push(`Token ${tokenSymbol} not supported`);
        return {
          tokenAmount: BigInt(0),
          canExecute: false,
          errors
        };
      }

      const tokenAmount = parseUnits(totalAmount, tokenInfo.decimals || 18);
      const recipientAddresses = recipients.map(r => r.eth_address);
      const amounts = recipients.map(r => parseUnits(r.amount || '0', tokenInfo.decimals || 18));


      // Check balances
      try {
        await this.checkBalance(userAddress, tokenSymbol, totalAmount);
      } catch (error) {
        errors.push((error as Error).message);
      }

      // Check ETH balance for gas
      const ethBalance = await getBalance(wagmiConfig, {
        address: userAddress as `0x${string}`,
        chainId: base.id
      });


      // Check allowance for ERC-20 tokens
      if (tokenSymbol !== 'ETH') {
        const hasAllowance = await this.checkAllowance(userAddress, tokenSymbol, totalAmount);
        if (!hasAllowance) {
          errors.push(`Insufficient allowance for ${tokenSymbol}. Please approve tokens first.`);
        }
      }

      return {
        tokenAmount,
        canExecute: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push((error as Error).message);
      return {
        tokenAmount: BigInt(0),
        canExecute: false,
        errors
      };
    }
  }

  async executeAirdrop(
    tokenSymbol: string,
    recipients: AirdropUser[],
    totalAmount: string,
    onStatusUpdate?: (status: Partial<TransactionStatus>) => void
  ): Promise<AirdropResult> {
    try {
      // Initial validation
      onStatusUpdate?.({ state: 'preparing', message: 'Validating network and connection...' });
      await this.validateNetwork();
      const userAddress = await this.validateConnection();

      const tokenInfo = tokenDictionary[tokenSymbol];
      if (!tokenInfo || tokenInfo.network !== 'base') {
        throw new Error(`Token ${tokenSymbol} not supported on Base`);
      }

      // Pre-flight checks
      onStatusUpdate?.({ state: 'preparing', message: 'Checking balances and allowances...' });
      const costEstimate = await this.estimateAirdropCost(tokenSymbol, recipients, totalAmount, userAddress);
      

      // Prepare transaction data
      onStatusUpdate?.({ state: 'preparing', message: 'Preparing transaction data...' });
      const recipientAddresses = recipients.map(r => r.eth_address as `0x${string}`);
      const amounts = recipients.map(r => parseUnits(r.amount || '0', tokenInfo.decimals || 18));

      // Execute the airdrop via individual transfers
      onStatusUpdate?.({ 
        state: 'transfer-pending', 
        message: `Executing airdrop to ${recipients.length} recipients...`,
      });

      let hash: string;

      if (tokenSymbol === 'ETH') {
        // For ETH airdrops, we need to send individual transactions
        // This is a simplified approach - in production, you'd want to batch these
        throw new Error('ETH airdrops not yet implemented. Use ERC-20 tokens.');
      } else {
        // For ERC-20 tokens, use the airdrop contract's bulkTransfer function
        onStatusUpdate?.({ 
          state: 'transfer-pending', 
          message: `Executing bulk transfer to ${recipients.length} recipients...`,
        });
        
        hash = await writeContract(wagmiConfig, {
          address: AIRDROP_CONTRACT as `0x${string}`,
          abi: airdropABI,
          functionName: 'bulkTransfer',
          args: [tokenInfo.address as `0x${string}`, recipientAddresses, amounts]
        });
      }

      onStatusUpdate?.({ 
        state: 'transfer-confirming', 
        message: 'Transaction submitted, waiting for confirmation...',
        hash 
      });

      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: hash as `0x${string}`,
        confirmations: 1
      });

      onStatusUpdate?.({ 
        state: 'completed', 
        message: `Bulk transfer completed successfully to ${recipients.length} recipients!`,
        hash,
        confirmations: 1
      });

      return {
        hash,
        recipients: recipients.length
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onStatusUpdate?.({ 
        state: 'failed', 
        message: errorMessage,
        error: errorMessage 
      });
      throw error;
    }
  }

  async approveToken(
    tokenSymbol: string,
    amount: string,
    onStatusUpdate?: (status: Partial<TransactionStatus>) => void
  ): Promise<string> {
    try {
      await this.validateNetwork();
      await this.validateConnection();

      const tokenInfo = tokenDictionary[tokenSymbol];
      if (!tokenInfo?.address || tokenSymbol === 'ETH') {
        throw new Error(`Token ${tokenSymbol} does not require approval`);
      }

      onStatusUpdate?.({ state: 'approval-pending', message: 'Approving token spending...' });

      const tokenAmount = parseUnits(amount, tokenInfo.decimals || 18);

      const hash = await writeContract(wagmiConfig, {
        address: tokenInfo.address as `0x${string}`,
        abi: tokenInfo.abi,
        functionName: 'approve',
        args: [AIRDROP_CONTRACT, tokenAmount]
      });

      onStatusUpdate?.({ state: 'approval-confirming', message: 'Waiting for approval confirmation...', hash });

      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash as `0x${string}`,
        confirmations: 1
      });

      onStatusUpdate?.({ state: 'completed', message: 'Token approval confirmed!', hash });

      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Approval failed';
      onStatusUpdate?.({ state: 'failed', message: errorMessage, error: errorMessage });
      throw error;
    }
  }
}
