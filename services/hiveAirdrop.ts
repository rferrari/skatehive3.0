import { HiveAirdropParams, AirdropUser } from '@/types/airdrop';
import { Operation } from "@hiveio/dhive";

export const executeHiveAirdrop = async ({
  token,
  recipients,
  totalAmount,
  customMessage,
  user,
  updateStatus
}: HiveAirdropParams) => {
  
  updateStatus({
    state: 'preparing',
    message: 'Preparing Hive transfer operations...',
    progress: 10
  });
  
  try {
    const perUserAmount = totalAmount / recipients.length;
    const currency = token === "HBD" ? "HBD" : "HIVE";
    const transferAmount = `${perUserAmount.toFixed(3)} ${currency}`;
    
    // Build operations array
    const operations: Operation[] = recipients.map(recipient => [
      "transfer",
      {
        from: user.name || user,
        to: recipient.hive_author,
        amount: transferAmount,
        memo: customMessage || `SkateHive airdrop from ${user.name || user}`
      }
    ]);
    
    updateStatus({
      state: 'transfer-pending',
      message: 'Broadcasting transactions with Aioha...',
      progress: 50
    });
    
    // Execute via Aioha
    const result = await executeAiohaTransfer(operations, user.name || user, updateStatus);
    
    updateStatus({
      state: 'completed',
      message: `Successfully airdropped ${totalAmount} ${currency} to ${recipients.length} recipients!`,
      progress: 100,
      hash: result
    });
    
    return result;
    
  } catch (error: any) {
    console.error('Hive Airdrop failed:', error);
    updateStatus({
      state: 'failed',
      message: `Airdrop failed: ${error.message || 'Unknown error'}`,
      error: error.message
    });
    throw error;
  }
};

const executeAiohaTransfer = async (
  operations: Operation[], 
  username: string,
  updateStatus: (status: any) => void
) => {
  try {
    // Import Aioha dynamically to avoid SSR issues
    const { Aioha } = await import('@aioha/aioha');
    
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
        const result = await Aioha.broadcast({
          operations: batch
        });
        
        results.push(result.result.id);
        
        // Small delay between batches to be nice to the network
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError: any) {
        console.error(`Batch ${batchNumber} failed:`, batchError);
        throw new Error(`Batch ${batchNumber} failed: ${batchError.message}`);
      }
    }
    
    return results.length > 1 ? results : results[0];
    
  } catch (error: any) {
    console.error('Aioha transfer failed:', error);
    throw new Error(`Aioha operation failed: ${error.message}`);
  }
};
