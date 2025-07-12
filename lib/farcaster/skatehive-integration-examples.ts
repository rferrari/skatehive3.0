import { SkateHiveNotifications } from '@/lib/farcaster/user-service';

/**
 * Example integration with your existing SkateHive vote system
 * Add this to your vote processing logic
 */
export async function handleVote(
    voterUsername: string,
    postAuthor: string,
    postTitle: string,
    voteWeight: number
) {
    // Your existing vote logic here...

    // Add Farcaster notification
    if (voteWeight > 0 && voterUsername !== postAuthor) {
        try {
            await SkateHiveNotifications.notifyPostVote(
                voterUsername,
                postAuthor,
                postTitle,
                voteWeight
            );
        } catch (error) {
            console.error('Failed to send Farcaster notification:', error);
            // Don't fail the vote if notification fails
        }
    }
}

/**
 * Example integration with your comment system
 */
export async function handleComment(
    commenterUsername: string,
    postAuthor: string,
    postTitle: string,
    comment: string
) {
    // Your existing comment logic here...

    // Add Farcaster notification
    if (commenterUsername !== postAuthor) {
        try {
            await SkateHiveNotifications.notifyNewComment(
                commenterUsername,
                postAuthor,
                postTitle
            );
        } catch (error) {
            console.error('Failed to send Farcaster notification:', error);
        }
    }
}

/**
 * Example integration with your follow system
 */
export async function handleFollow(
    followerUsername: string,
    followedUsername: string
) {
    // Your existing follow logic here...

    // Add Farcaster notification
    try {
        await SkateHiveNotifications.notifyNewFollower(
            followerUsername,
            followedUsername
        );
    } catch (error) {
        console.error('Failed to send Farcaster notification:', error);
    }
}

/**
 * Test functions you can call from browser console or test endpoints
 */
export const testNotifications = {
    async testVote() {
        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '🔥 New Vote',
                body: '@testuser upvoted "Sick kickflip!"',
                targetUsers: ['xvlad'],
                targetUrl: 'https://skatehive.app/post/testuser/sick-kickflip'
            })
        }).then(r => r.json());
    },

    async testComment() {
        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '💬 New Comment',
                body: '@testuser commented on "Sick kickflip!"',
                targetUsers: ['xvlad'],
                targetUrl: 'https://skatehive.app/post/testuser/sick-kickflip'
            })
        }).then(r => r.json());
    },

    async testFollow() {
        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '👤 New Follower',
                body: '@testuser started following you',
                targetUsers: ['xvlad'],
                targetUrl: 'https://skatehive.app/profile/testuser'
            })
        }).then(r => r.json());
    }
};

// Make available globally for testing
if (typeof window !== 'undefined') {
    (window as any).testNotifications = testNotifications;
}
