import { HiveAirdropParams, AirdropUser } from '@/types/airdrop';
import { Operation } from "@hiveio/dhive";
import { KeyTypes } from "@aioha/aioha";

export async function executeHiveAirdrop({
  token,
  recipients,
  totalAmount,
  customMessage,
  user,
  updateStatus,
  aiohaUser,
  aiohaInstance,
}: HiveAirdropParams): Promise<void> {
  try {
    console.log("Starting executeHiveAirdrop with params:", {
      token,
      recipients: recipients.length,
      totalAmount,
      user,
      aiohaUser,
      hasAiohaInstance: !!aiohaInstance,
    });

    // Extract username from user object or use directly
    const username = typeof user === 'string' ? user : user;
    if (!username) {
      throw new Error('No username provided for airdrop');
    }

    // Calculate amount per user
    const amountPerUser = totalAmount / recipients.length;
    const formattedAmount = amountPerUser.toFixed(3);

    updateStatus({ 
      state: 'preparing', 
      message: "Preparing airdrop transactions..." 
    });

    // Create transfer operations
    const operations = recipients.map((recipient: AirdropUser) => [
      "transfer",
      {
        from: username, // Use the extracted username
        to: recipient.hive_author,
        amount: `${formattedAmount} ${token}`,
        memo: customMessage || `SkateHive Community Airdrop - ${token} 🛹`,
      },
    ]) as Operation[];

    console.log("Created operations:", operations);

    updateStatus({ 
      state: 'transfer-pending', 
      message: "Broadcasting transactions..." 
    });

    // Try to use Aioha for broadcasting
    await executeAiohaTransfer(operations, aiohaUser || user, aiohaInstance, updateStatus);

    updateStatus({ 
      state: 'completed', 
      message: "Airdrop completed successfully!" 
    });
  } catch (error) {
    console.error("Airdrop failed:", error);
    updateStatus({ 
      state: 'failed', 
      message: `Airdrop failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

const executeAiohaTransfer = async (
  operations: Operation[], 
  aiohaUser: any,
  aiohaInstance: any,
  updateStatus: (status: any) => void
) => {
  try {
    // Debug information
    console.log('Aioha Debug Info:', {
      aiohaUserExists: !!aiohaUser,
      aiohaUserName: aiohaUser,
      instanceExists: !!aiohaInstance,
      instanceHasSignAndBroadcast: !!(aiohaInstance && typeof aiohaInstance.signAndBroadcastTx === 'function')
    });
    
    // Try to determine which broadcaster to use
    let broadcaster;
    let broadcasterType;
    
 
    if (aiohaInstance && typeof aiohaInstance.signAndBroadcastTx === 'function') {
      broadcaster = aiohaInstance;
      broadcasterType = 'instance';
    } else {
      throw new Error('No valid Aioha instance found. Please ensure your Hive wallet is properly connected.');
    }
    
    console.log('Using broadcaster:', broadcasterType);
    
    updateStatus({
      state: 'transfer-pending',
      message: 'Preparing batch transfer...',
      progress: 60
    });
    
    // Process operations in batches to avoid overwhelming the network
    const BATCH_SIZE = 50;
    const batches = [];
    
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      batches.push(operations.slice(i, i + BATCH_SIZE));
    }
    
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      updateStatus({
        state: 'transfer-pending',
        message: `Processing batch ${batchNumber}/${batches.length} (${batch.length} transfers)...`,
        progress: 60 + (i / batches.length) * 30
      });
      
      try {
        let result;
        
        // Use aioha.signAndBroadcastTx method with Active key for transfers
        result = await broadcaster.signAndBroadcastTx(batch, KeyTypes.Active);
        
        if (result?.result?.id) {
          results.push(result.result.id);
        } else if (result?.id) {
          results.push(result.id);
        }
        
        // Small delay between batches to be nice to the network
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError: any) {
        console.error(`Batch ${batchNumber} failed:`, batchError);
        throw new Error(`Batch ${batchNumber} failed: ${batchError.message || 'Unknown error'}`);
      }
    }
    
    return results.length > 1 ? results : results[0];
    
  } catch (error: any) {
    console.error('Aioha transfer failed:', error);
    throw new Error(`Aioha operation failed: ${error?.message || 'Unknown error'}`);
  }
};
