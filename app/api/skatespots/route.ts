import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    // Fetch more data to ensure we get skatespot posts
    const fetchLimit = Math.max(parseInt(limit) * 10, 100); // Fetch 10x more to find skatespots
    const apiUrl = `https://api.skatehive.app/api/v2/feed?limit=${fetchLimit}&page=${page}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Skatehive-App/3.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter to only include skatespot posts
    const skatespots = data.data.filter((post: any) => {
      const tags = post.tags || [];
      return tags.includes('skatespot') && tags.includes('hive-173115');
    });
    
    // Limit the results to the requested limit
    const limitedSpots = skatespots.slice(0, parseInt(limit));
    
    // Transform the data to match the expected Discussion format
    const transformedSpots = limitedSpots.map((spot: any) => ({
      body: spot.body,
      author: spot.author,
      permlink: spot.permlink,
      parent_author: spot.parent_author,
      parent_permlink: spot.parent_permlink,
      created: spot.created,
      cashout_time: spot.cashout_time,
      last_payout: spot.last_payout,
      category: spot.category,
      pending_payout_value: spot.pending_payout_value,
      author_rewards: spot.author_rewards,
      total_payout_value: spot.total_payout_value,
      curator_payout_value: spot.curator_payout_value,
      beneficiaries: spot.beneficiaries,
      max_accepted_payout: spot.max_accepted_payout,
      percent_hbd: spot.percent_hbd,
      allow_votes: spot.allow_votes,
      allow_curation_rewards: spot.allow_curation_rewards,
      net_rshares: spot.net_rshares,
      total_vote_weight: spot.total_vote_weight,
      title: '',
      abs_rshares: '',
      children: 0,
      reblogged_by: [],
      replies: [],
      vote_rshares: '',
      json_metadata: JSON.stringify(spot.post_json_metadata || {}),
      author_reputation: parseFloat(spot.reputation || 0),
      active_votes: spot.votes?.map((vote: any) => ({
        percent: 0,
        reputation: 0,
        rshares: vote.rshares,
        time: vote.timestamp,
        voter: vote.voter,
        weight: vote.weight
      })) || [],
      url: '',
      root_title: '',
      total_pending_payout_value: '',
      promoted: '',
      body_length: '',
      id: 0,
      last_update: '',
      active: '',
      depth: 0,
      children_abs_rshares: '',
      max_cashout_time: '',
      reward_weight: 0,
      net_votes: 0,
      root_comment: 0,
      allow_replies: true,
    }));
    
    // For debugging, return all posts first
    const allTransformedPosts = data.data.map((post: any) => ({
      body: post.body,
      author: post.author,
      permlink: post.permlink,
      parent_author: post.parent_author,
      parent_permlink: post.parent_permlink,
      created: post.created,
      cashout_time: post.cashout_time,
      last_payout: post.last_payout,
      category: post.category,
      pending_payout_value: post.pending_payout_value,
      author_rewards: post.author_rewards,
      total_payout_value: post.total_payout_value,
      curator_payout_value: post.curator_payout_value,
      beneficiaries: post.beneficiaries,
      max_accepted_payout: post.max_accepted_payout,
      percent_hbd: post.percent_hbd,
      allow_votes: post.allow_votes,
      allow_curation_rewards: post.allow_curation_rewards,
      net_rshares: post.net_rshares,
      total_vote_weight: post.total_vote_weight,
      title: '',
      abs_rshares: '',
      children: 0,
      reblogged_by: [],
      replies: [],
      vote_rshares: '',
      json_metadata: JSON.stringify(post.post_json_metadata || {}),
      author_reputation: parseFloat(post.reputation || 0),
      active_votes: post.votes?.map((vote: any) => ({
        percent: 0,
        reputation: 0,
        rshares: vote.rshares,
        time: vote.timestamp,
        voter: vote.voter,
        weight: vote.weight
      })) || [],
      url: '',
      root_title: '',
      total_pending_payout_value: '',
      promoted: '',
      body_length: '',
      id: 0,
      last_update: '',
      active: '',
      depth: 0,
      children_abs_rshares: '',
      max_cashout_time: '',
      reward_weight: 0,
      net_votes: 0,
      root_comment: 0,
      allow_replies: true,
    }));
    
    // Calculate proper pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const totalSpots = skatespots.length;
    const totalPages = Math.ceil(totalSpots / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedSpots = transformedSpots.slice(startIndex, endIndex);
    
    // Debug pagination info
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('API Pagination:', {
        totalSpots,
        limitNum,
        pageNum,
        totalPages,
        startIndex,
        endIndex,
        paginatedSpotsLength: paginatedSpots.length,
        hasNextPage: pageNum < totalPages
      });
    }
    
    return NextResponse.json({
      success: true,
      data: paginatedSpots,
      pagination: {
        total: totalSpots,
        totalPages: totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      }
    });
    
  } catch (error) {
    console.error('Error fetching skatespots:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch skatespots',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 