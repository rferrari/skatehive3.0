// lib/hive/server-actions.ts
'use server';

import { PrivateKey, Operation } from '@hiveio/dhive';
import HiveClient from "./hiveclient";

// Import client functions that we need for server-side operations
// Note: This is a workaround since getLastSnapsContainer is in client-functions
// In a real app, you might want to extract this to a shared utilities file
async function getLastSnapsContainer() {
  const author = "peak.snaps";
  const beforeDate = new Date().toISOString().split('.')[0];
  const permlink = '';
  const limit = 1;

  const result = await HiveClient.database.call('get_discussions_by_author_before_date',
    [author, permlink, beforeDate, limit]);

  return {
    author,
    permlink: result[0].permlink
  };
}

/**
 * Create a post on Hive using the skatedev account posting key
 * @param title Post title
 * @param body Post body content
 * @param tags Array of tags
 * @param images Array of image URLs
 * @param ethereumAddress The Ethereum address of the coin creator
 * @param coinAddress The Zora coin address if available
 * @returns Promise with success status and post details
 */
export async function createPostAsSkatedev({
  title,
  body,
  tags = [],
  images = [],
  ethereumAddress,
  coinAddress,
}: {
  title: string;
  body: string;
  tags?: string[];
  images?: string[];
  ethereumAddress: string;
  coinAddress?: string;
}): Promise<{ success: boolean; author: string; permlink: string; error?: string }> {
  try {
    const postingKey = process.env.HIVE_POSTING_KEY;
    const author = process.env.NEXT_PUBLIC_HIVE_USER || 'skatedev';

    if (!postingKey) {
      throw new Error("HIVE_POSTING_KEY is not set in the environment");
    }

    // Generate permlink based on title and timestamp
    const timestamp = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    const permlink = `${titleSlug}-${timestamp}`;

    // Prepare metadata
    const jsonMetadata = {
      app: "Skatehive App 3.0",
      tags: [
        process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
        'skatehive',
        'ethereum',
        'coin-creation',
        ...tags
      ],
      images,
      creator_ethereum_address: ethereumAddress,
      ...(coinAddress && { zora_coin_address: coinAddress }),
      created_via: 'ethereum_wallet'
    };

    // Create the comment operation
    const operation: Operation = [
      'comment',
      {
        parent_author: '',
        parent_permlink: process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
        author,
        permlink,
        title,
        body,
        json_metadata: JSON.stringify(jsonMetadata),
      }
    ];

    // Broadcast the operation
    const privateKey = PrivateKey.fromString(postingKey);
    await HiveClient.broadcast.sendOperations([operation], privateKey);

    console.log(`✅ Posted to Hive as ${author}/${permlink} for Ethereum user ${ethereumAddress}`);

    return {
      success: true,
      author,
      permlink
    };

  } catch (error) {
    console.error('❌ Failed to create post as skatedev:', error);
    return {
      success: false,
      author: '',
      permlink: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a snap comment on Hive using the skatedev account posting key
 * @param body Comment body content
 * @param tags Array of tags
 * @param images Array of image URLs
 * @param ethereumAddress The Ethereum address of the coin creator
 * @param coinAddress The Zora coin address if available
 * @param coinUrl The Zora coin URL if available
 * @returns Promise with success status and comment details
 */
export async function createSnapAsSkatedev({
  body,
  tags = [],
  images = [],
  ethereumAddress,
  coinAddress,
  coinUrl,
}: {
  body: string;
  tags?: string[];
  images?: string[];
  ethereumAddress: string;
  coinAddress?: string;
  coinUrl?: string;
}): Promise<{ success: boolean; author: string; permlink: string; error?: string }> {
  try {
    const postingKey = process.env.HIVE_POSTING_KEY;
    const author = process.env.NEXT_PUBLIC_HIVE_USER || 'skatedev';

    if (!postingKey) {
      throw new Error("HIVE_POSTING_KEY is not set in the environment");
    }

    // Get the latest snaps container for parent
    let parentAuthor = "peak.snaps";
    let parentPermlink = "snaps";
    
    try {
      const lastSnapsContainer = await getLastSnapsContainer();
      parentPermlink = lastSnapsContainer.permlink;
    } catch (error) {
      console.warn("Failed to get last snaps container, using default");
    }

    // Generate permlink based on timestamp
    const timestamp = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const permlink = `snap-${timestamp}`;

    // Prepare metadata
    const jsonMetadata = {
      app: "Skatehive App 3.0",
      tags: [
        process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115',
        'snaps',
        'skatehive',
        'ethereum',
        'coin-creation',
        ...tags
      ],
      images,
      creator_ethereum_address: ethereumAddress,
      ...(coinAddress && { zora_coin_address: coinAddress }),
      ...(coinUrl && { zora_coin_url: coinUrl }),
      created_via: 'ethereum_wallet',
      snap_type: 'coin_creation'
    };

    // Create the comment operation (snap comment)
    const operation: Operation = [
      'comment',
      {
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        author,
        permlink,
        title: '', // Snaps don't have titles
        body,
        json_metadata: JSON.stringify(jsonMetadata),
      }
    ];

    // Broadcast the operation
    const privateKey = PrivateKey.fromString(postingKey);
    await HiveClient.broadcast.sendOperations([operation], privateKey);

    console.log(`✅ Posted snap to Hive as ${author}/${permlink} for Ethereum user ${ethereumAddress}`);

    return {
      success: true,
      author,
      permlink
    };

  } catch (error) {
    console.error('❌ Failed to create snap as skatedev:', error);
    return {
      success: false,
      author: '',
      permlink: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update an existing Hive post to add Zora coin information
 * @param author Original post author
 * @param permlink Original post permlink
 * @param coinAddress Zora coin address to add
 * @param coinUrl Zora coin URL to add to body
 * @returns Promise with success status
 */
export async function updatePostWithCoinInfo({
  author,
  permlink,
  coinAddress,
  coinUrl,
}: {
  author: string;
  permlink: string;
  coinAddress: string;
  coinUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const postingKey = process.env.HIVE_POSTING_KEY;
    const skatedevAccount = process.env.NEXT_PUBLIC_HIVE_USER || 'skatedev';

    if (!postingKey) {
      throw new Error("HIVE_POSTING_KEY is not set in the environment");
    }

    // Only allow updating posts by skatedev account
    if (author !== skatedevAccount) {
      throw new Error("Can only update posts created by skatedev account");
    }

    // Get the current post
    const content = await HiveClient.database.call('get_content', [author, permlink]);
    if (!content || !content.author) {
      throw new Error("Post not found");
    }

    // Parse existing metadata
    let jsonMetadata;
    try {
      jsonMetadata = JSON.parse(content.json_metadata || '{}');
    } catch {
      jsonMetadata = {};
    }

    // Add coin information
    jsonMetadata.zora_coin_address = coinAddress;
    jsonMetadata.coin_created = true;

    // Update body with coin information
    const updatedBody = `${content.body}\n\n---\n\n🎯 **Zora Coin Created!**\n\n[Trade this coin on Zora ↗](${coinUrl})\n\n*This coin was created automatically when this post was shared. The creator can be tipped via Ethereum at the coin address above.*`;

    // Create the edit operation
    const operation: Operation = [
      'comment',
      {
        parent_author: content.parent_author,
        parent_permlink: content.parent_permlink,
        author,
        permlink,
        title: content.title,
        body: updatedBody,
        json_metadata: JSON.stringify(jsonMetadata),
      }
    ];

    // Broadcast the operation
    const privateKey = PrivateKey.fromString(postingKey);
    await HiveClient.broadcast.sendOperations([operation], privateKey);

    console.log(`✅ Updated post ${author}/${permlink} with coin info ${coinAddress}`);

    return { success: true };

  } catch (error) {
    console.error('❌ Failed to update post with coin info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
