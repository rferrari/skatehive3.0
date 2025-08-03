import { createSnapAsSkatedev } from '@/lib/hive/server-actions';
import { uploadToHiveImagesWithRetry } from '@/lib/utils/imageUpload';

export interface AirdropAnnouncementParams {
  token: string;
  recipients: any[];
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
function generateRecipientMentions(recipients: any[], maxMentions: number = 20): string {
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
    isWeighted,
    includeSkateHive,
    creator,
    isAnonymous
  } = params;

  const amountPerUser = totalAmount / recipients.length;
  const distributionType = isWeighted ? 'weighted' : 'equal';
  const includeSkateHiveText = includeSkateHive ? ' (including @skatehive)' : '';
  
  let content = `🛹 **${token} Airdrop Complete!** 🎯

`;

  // Add creator attribution (unless anonymous)
  if (!isAnonymous && creator) {
    if (creator.hiveUsername) {
      content += `🎁 **Airdrop by:** @${creator.hiveUsername}

`;
    } else if (creator.ethereumAddress) {
      content += `🎁 **Airdrop by:** ${creator.ethereumAddress.slice(0, 6)}...${creator.ethereumAddress.slice(-4)}

`;
    }
  }

  // Add custom message if provided
  if (customMessage && customMessage.trim()) {
    content += `${customMessage}

`;
  }

  content += `📊 **${recipients.length} recipients**${includeSkateHiveText} • ${totalAmount.toFixed(3)} ${token} total
💰 ~${amountPerUser.toFixed(3)} ${token} per user (${distributionType})

`;

  // Add network visualization if screenshot provided
  if (imageUrl) {
    content += `![Airdrop Network Visualization](${imageUrl})

`;
  }

  // Add recipient mentions (fewer for snap format)
  content += `Recipients: ${generateRecipientMentions(recipients, 10)}

Thanks for being part of SkateHive! 🙏`;

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
    post_count: 'Post Count',
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
    
    // Upload screenshot if provided
    if (params.screenshotDataUrl) {
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
      const postUrl = `https://peakd.com/@skatedev/${snapResult.permlink}`;
      
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
