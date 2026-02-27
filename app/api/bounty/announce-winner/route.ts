import { NextRequest, NextResponse } from 'next/server';
import { Client, PrivateKey, Operation } from '@hiveio/dhive';
import { APP_CONFIG } from '@/config/app.config';

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://anyx.io',
  'https://api.deathwing.me',
];

const client = new Client(HIVE_API_NODES);

async function getLastSnapsContainer(): Promise<{ author: string; permlink: string }> {
  // Mirror logic from lib/hive/client-functions.ts:getLastSnapsContainer
  const author = 'peak.snaps';
  const beforeDate = new Date().toISOString().split('.')[0];
  const permlink = '';
  const limit = 1;

  const result = await client.database.call('get_discussions_by_author_before_date', [
    author,
    permlink,
    beforeDate,
    limit,
  ]);

  if (!result?.[0]?.permlink) {
    throw new Error('Failed to resolve snaps container permlink');
  }

  return { author, permlink: result[0].permlink };
}

interface WinnerInfo {
  username: string;
  place: number;
  rewardAmount: number;
}

interface AnnouncementRequest {
  winners: WinnerInfo[];
  bountyTitle: string;
  bountyAuthor: string;
  bountyPermlink: string;
  totalReward: number;
  currency: string;
}

/**
 * POST /api/bounty/announce-winner
 * 
 * Automatically posts bounty winner announcement to Snaps Feed via @skateuser
 */
export async function POST(req: NextRequest) {
  try {
    const body: AnnouncementRequest = await req.json();
    const { winners, bountyTitle, bountyAuthor, bountyPermlink, totalReward, currency } = body;

    // Validate input
    if (!winners || winners.length === 0) {
      return NextResponse.json(
        { error: 'No winners provided' },
        { status: 400 }
      );
    }

    if (!process.env.SKATEHIVE_API_KEY && !process.env.DEFAULT_HIVE_POSTING_KEY) {
      console.error('Neither SKATEHIVE_API_KEY nor DEFAULT_HIVE_POSTING_KEY configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log(`[Bounty Announcement] Processing ${winners.length} winners for: ${bountyTitle}`);

    // Step 1: Extract winner's video from their submission
    const winnerVideo = await extractWinnerVideo(bountyAuthor, bountyPermlink, winners[0].username);

    // Step 2: Generate announcement post body
    const postBody = generateAnnouncementPost(
      winners,
      bountyTitle,
      bountyAuthor,
      bountyPermlink,
      totalReward,
      currency,
      winnerVideo
    );

    // Step 3: Post announcement (prefer SkateHive API posting service; fallback to local dhive)
    const result = await postAnnouncement(postBody, bountyTitle);

    console.log(`[Bounty Announcement] Success! Posted: @${result.author}/${result.permlink} via ${result.via}`);

    return NextResponse.json({
      success: true,
      author: result.author,
      permlink: result.permlink,
      transaction_id: result.transaction_id,
      via: result.via,
    });

  } catch (error: any) {
    console.error('[Bounty Announcement] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to post announcement',
      },
      { status: 500 }
    );
  }
}

/**
 * Extracts video URL from winner's comment on the bounty post
 */
async function extractWinnerVideo(
  bountyAuthor: string,
  bountyPermlink: string,
  winnerUsername: string
): Promise<string | null> {
  try {
    // Get all comments on the bounty post
    const comments = await client.database.call('get_content_replies', [
      bountyAuthor,
      bountyPermlink,
    ]);

    // Find winner's comment
    const winnerComment = comments.find((c: any) => c.author === winnerUsername);

    if (!winnerComment) {
      console.log(`[Video Extract] No comment found for winner: ${winnerUsername}`);
      return null;
    }

    const body = winnerComment.body;

    // Extract video URLs (YouTube, 3Speak, IPFS, direct links)
    const videoPatterns = [
      // YouTube
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // 3Speak
      /https?:\/\/(?:www\.)?3speak\.tv\/watch\?v=([^&\s]+)/,
      // IPFS (various gateways)
      /https?:\/\/(?:ipfs\.skatehive\.app|gateway\.pinata\.cloud|ipfs\.io)\/ipfs\/([a-zA-Z0-9]+)/,
      // Direct video files
      /https?:\/\/[^\s]+\.(?:mp4|webm|mov)/i,
    ];

    for (const pattern of videoPatterns) {
      const match = body.match(pattern);
      if (match) {
        console.log(`[Video Extract] Found video for ${winnerUsername}: ${match[0]}`);
        return match[0];
      }
    }

    console.log(`[Video Extract] No video found in ${winnerUsername}'s comment`);
    return null;

  } catch (error: any) {
    console.error('[Video Extract] Error:', error.message);
    return null;
  }
}

/**
 * Generates the announcement post body with visual formatting
 */
function generateAnnouncementPost(
  winners: WinnerInfo[],
  bountyTitle: string,
  bountyAuthor: string,
  bountyPermlink: string,
  totalReward: number,
  currency: string,
  videoUrl: string | null
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# 🏆 BOUNTY COMPLETE: ${bountyTitle}`);
  lines.push('');

  // Video embed (if available)
  if (videoUrl) {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // YouTube embed
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        lines.push(`<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`);
        lines.push('');
      }
    } else if (videoUrl.includes('3speak.tv')) {
      // 3Speak embed
      lines.push(`[![Watch on 3Speak](${videoUrl}/thumbnail.png)](${videoUrl})`);
      lines.push('');
    } else if (videoUrl.includes('ipfs')) {
      // IPFS video
      lines.push(`<video width="100%" controls>`);
      lines.push(`  <source src="${videoUrl}" type="video/mp4">`);
      lines.push(`</video>`);
      lines.push('');
    } else {
      // Generic video link
      lines.push(`🎥 **Winning Submission:** ${videoUrl}`);
      lines.push('');
    }
  }

  // Winners section
  lines.push('## 🎉 Winners');
  lines.push('');

  const medals = ['🥇', '🥈', '🥉'];
  const places = ['1st Place', '2nd Place', '3rd Place'];

  winners.forEach((winner, index) => {
    const medal = medals[index] || '🏅';
    const place = places[index] || `${index + 1}th Place`;
    lines.push(`${medal} **${place}:** @${winner.username} - **${winner.rewardAmount.toFixed(3)} ${currency}**`);
  });

  lines.push('');
  lines.push(`💰 **Total Distributed:** ${totalReward.toFixed(3)} ${currency}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Call to action
  lines.push('🛹 **Think you can land it?** Keep an eye out for the next bounty!');
  lines.push('');
  lines.push(`📖 **Check out the full bounty:** [@${bountyAuthor}/${bountyPermlink}](https://skatehive.app/post/hive-173115/@${bountyAuthor}/${bountyPermlink})`);
  lines.push('');

  // Tags go in json_metadata only — never inline hashtags in body

  return lines.join('\n');
}

/**
 * Extracts YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function postAnnouncement(body: string, title: string): Promise<{ author: string; permlink: string; transaction_id: string; via: 'api' | 'fallback' }> {
  // 1) Preferred path: consolidated posting service in skatehive-api
  if (process.env.SKATEHIVE_API_KEY) {
    try {
      return await postViaSkatehiveApi(body, title);
    } catch (error) {
      console.warn('[Bounty Announcement] API posting failed, falling back to local dhive:', error);
    }
  }

  // 2) Fallback path: keep existing local method working in skatehive3.0
  const fallback = await postWithSkateuser(body, title);
  return {
    author: fallback.author,
    permlink: fallback.permlink,
    transaction_id: fallback.transaction_id,
    via: 'fallback',
  };
}

async function postViaSkatehiveApi(body: string, title: string): Promise<{ author: string; permlink: string; transaction_id: string; via: 'api' }> {
  const baseUrl = process.env.SKATEHIVE_API_URL || APP_CONFIG.API_BASE_URL;

  const response = await fetch(`${baseUrl}/api/v2/postFeedInternal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SKATEHIVE_API_KEY}`,
    },
    body: JSON.stringify({
      author_alias: 'skateuser',
      body,
      tags: ['bounty', 'winner', 'announcement'],
      context: `bounty-winner:${title}`,
    }),
  });

  const json = await response.json();
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || `postFeedInternal failed with status ${response.status}`);
  }

  return {
    author: json.data.author,
    permlink: json.data.permlink,
    transaction_id: json.data.transaction_id,
    via: 'api',
  };
}

/**
 * Fallback: Posts to Hive blockchain using default posting account
 */
async function postWithSkateuser(body: string, title: string) {
  const postingKey = process.env.DEFAULT_HIVE_POSTING_KEY!;
  const author = process.env.DEFAULT_HIVE_POSTING_ACCOUNT || 'skateuser';

  // Generate permlink
  const permlink = generatePermlink(title);

  // IMPORTANT: Snaps feed posts must be comments under the latest "snaps container"
  const snapsContainer = await getLastSnapsContainer();

  // Build metadata — hive-173115 is REQUIRED to appear in SkateHive feed
  const metadata = {
    tags: ['hive-173115', 'skatehive', 'bounty', 'snaps', 'skateboarding'],
    app: 'skatehive/1.0',
    format: 'markdown',
    description: `Bounty winner announcement: ${title}`,
  };

  // Create comment operation (Snaps reply)
  const operation: Operation = [
    'comment',
    {
      parent_author: snapsContainer.author,
      parent_permlink: snapsContainer.permlink,
      author,
      permlink,
      title: '',
      body,
      json_metadata: JSON.stringify(metadata),
    },
  ];

  // Sign and broadcast
  const privateKey = PrivateKey.fromString(postingKey);
  const result = await client.broadcast.sendOperations([operation], privateKey);

  return {
    author,
    permlink,
    transaction_id: result.id,
    parent_author: snapsContainer.author,
    parent_permlink: snapsContainer.permlink,
  };
}

/**
 * Generates a URL-safe permlink from title
 */
function generatePermlink(title: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  const maxSlugLength = 255 - (random.length + 1);

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxSlugLength);

  return slug ? `${slug}-winners-${random}` : `bounty-winners-${random}`;
}
