import { createSnapAsSkatedev } from '@/lib/hive/server-actions';
import { uploadToHiveImagesWithRetry } from '@/lib/utils/imageUpload';

export interface AirdropRecipient {
  hive_author: string;
  eth_address?: string;
  points?: number;
  amount?: string;
}

export interface AirdropAnnouncementParams {
  token: string;
  recipients: AirdropRecipient[];
  totalAmount: number;
  sortOption: string;
  customMessage?: string;
  screenshotDataUrl?: string;
  isWeighted: boolean;
  includeSkateHive: boolean;
  creator?: {
    hiveUsername?: string;
    ethereumAddress?: string;
  };
  isAnonymous?: boolean;
}

export interface AnnouncementResult {
  postUrl?: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * Generate recipient mentions for the post content
 */
function generateRecipientMentions(recipients: AirdropRecipient[], maxMentions: number = 20): string {
  const mentions = recipients
    .slice(0, maxMentions)
    .map(user => `@${user.hive_author}`)
    .join(' ');
  
  const remaining = recipients.length - maxMentions;
  if (remaining > 0) {
    return `${mentions} +${remaining} more recipients`;
  }
  
  return mentions;
}

/**
 * Generate the announcement snap content (shorter format for snaps)
 */
export function generateAnnouncementContent(params: AirdropAnnouncementParams, imageUrl?: string): string {
  const {
    token,
    recipients,
    totalAmount,
    customMessage,
    creator,
    isAnonymous
  } = params;

  // Determine user display
  let userDisplay = 'anonymous user';
  if (!isAnonymous && creator) {
    if (creator.hiveUsername) {
      userDisplay = `@${creator.hiveUsername}`;
    } else if (creator.ethereumAddress) {
      userDisplay = `${creator.ethereumAddress.slice(0, 6)}...${creator.ethereumAddress.slice(-4)}`;
    }
  }

  // Start with image if available
  let content = '';
  if (imageUrl) {
    content += `![Airdrop Network Visualization](${imageUrl})\n\n`;
  }

  // Compose the main message
  content += `${userDisplay} just made an airdrop of ${totalAmount} ${token} tokens.  \n\n`;

  // Add custom message if provided
  if (customMessage && customMessage.trim()) {
    content += `Message: \n > ${customMessage}\n\n`;
  }

  // Add sponsored skaters with tagged users (up to 10)
  content += `Sponsored Skaters: ${generateRecipientMentions(recipients, 10)}\n\n`;

  content += `Thanks for being part of skatehive cult`;

  return content;
}

/**
 * Convert sort option to readable label
 */
function getSortOptionLabel(sortOption: string): string {
  const labels: Record<string, string> = {
    points: 'Community Points',
    hp_balance: 'Hive Power',
    hive_balance: 'Hive Balance',
    hbd_savings_balance: 'HBD Savings',
    posts_score: 'Posts Score',
    has_voted_in_witness: 'Witness Voters',
    gnars_balance: 'Gnars Balance',
    skatehive_nft_balance: 'SkateHive NFTs',
    gnars_votes: 'Gnars Votes',
    giveth_donations_usd: 'Giveth Donations',
    airdrop_the_poor: 'Support for Community Members'
  };
  
  return labels[sortOption] || sortOption;
}

/**
 * Create automated airdrop announcement snap
 */
export async function createAirdropAnnouncement(params: AirdropAnnouncementParams): Promise<AnnouncementResult> {
  try {
    let imageUrl: string | undefined;
    
    // Check if screenshotDataUrl is already a URL (uploaded) or raw data
    if (params.screenshotDataUrl) {
      if (params.screenshotDataUrl.startsWith('http')) {
        // Already uploaded URL
        imageUrl = params.screenshotDataUrl;
      } else {
        // Raw screenshot data - upload it
        try {
          const uploadResult = await uploadToHiveImagesWithRetry(
            params.screenshotDataUrl,
            `airdrop-${params.token.toLowerCase()}-${Date.now()}.png`
          );
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          // Continue without image - don't fail the entire announcement
        }
      }
    }
    
    // Generate post content
    const content = generateAnnouncementContent(params, imageUrl);
    
    // Create the snap with the image both in content and metadata
    const snapResult = await createSnapAsSkatedev({
      body: content,
      tags: ['skatehive', 'airdrop', params.token.toLowerCase(), 'community'],
      ethereumAddress: params.creator?.ethereumAddress || '0x0000000000000000000000000000000000000000',
      images: imageUrl ? [imageUrl] : [] // Include image in metadata for proper display
    });
    
    if (snapResult.success && snapResult.permlink) {
      const postUrl = `https://skatehive.app/post/skatedev/${snapResult.permlink}`;
      
      return {
        postUrl,
        imageUrl,
        success: true
      };
    } else {
      throw new Error(snapResult.error || 'Failed to create snap');
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
