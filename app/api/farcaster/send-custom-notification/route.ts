import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { title, body, targetUrl } = await req.json();

        if (!title || !body) {
            return NextResponse.json({
                success: false,
                message: "Title and body are required"
            }, { status: 400 });
        }

        // Import notification service
        const { farcasterNotificationService } = await import('@/lib/farcaster/notification-service');

        // Create notification object
        const customNotification = {
            type: 'mention' as const, // Use mention type for custom notifications
            title: title.substring(0, 32), // Farcaster title limit
            body: body.substring(0, 128), // Farcaster body limit
            hiveUsername: 'skatehive', // System username
            sourceUrl: targetUrl || 'https://skatehive.app',
            metadata: {
                author: 'skatehive',
                permlink: ''
            }
        };

        // Send notification to all active users (don't specify targetUsers to send to all)
        const result = await farcasterNotificationService.sendNotification(customNotification);

        if (result.success && result.results) {
            // Count successful notifications - fix the structure access
            const sentCount = result.results.reduce((count: number, r: any) => {
                // Handle both direct structure and nested result structure
                const tokens = r.successfulTokens || (r.result && r.result.successfulTokens) || [];
                return count + tokens.length;
            }, 0);
            const totalUsers = result.results.reduce((count: number, r: any) => {
                const successful = r.successfulTokens || (r.result && r.result.successfulTokens) || [];
                const invalid = r.invalidTokens || (r.result && r.result.invalidTokens) || [];
                const rateLimited = r.rateLimitedTokens || (r.result && r.result.rateLimitedTokens) || [];
                return count + successful.length + invalid.length + rateLimited.length;
            }, 0);

            // Log to database for record keeping
            const { Pool } = await import('pg');
            const pool = new Pool({
                connectionString: process.env.STORAGE_POSTGRES_URL || process.env.POSTGRES_URL
            });

            await pool.query(`
                INSERT INTO farcaster_notification_logs 
                (hive_username, fid, notification_type, title, body, target_url, success)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'system', // system-generated notification
                null,
                'custom',
                title,
                body,
                targetUrl || "https://skatehive.app",
                true
            ]);

            await pool.end();

            return NextResponse.json({
                success: true,
                sentCount,
                totalUsers,
                results: result.results
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Failed to send notifications"
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error sending custom notification:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
