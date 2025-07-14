import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    console.log('🚀 [CustomNotification] Starting custom notification request at', new Date().toISOString());

    try {
        const { title, body, targetUrl } = await req.json();
        console.log('📝 [CustomNotification] Request payload:', { title, body, targetUrl });

        if (!title || !body) {
            console.log('❌ [CustomNotification] Missing required fields - title or body');
            return NextResponse.json({
                success: false,
                message: "Title and body are required"
            }, { status: 400 });
        }

        // Import notification service
        console.log('📡 [CustomNotification] Importing notification service...');
        const { farcasterNotificationService } = await import('@/lib/farcaster/notification-service');
        console.log('✅ [CustomNotification] Notification service imported successfully');

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
        console.log('📋 [CustomNotification] Created notification object:', customNotification);

        // Send notification to all active users (don't specify targetUsers to send to all)
        console.log('📤 [CustomNotification] Sending notification to all active users...');
        const result = await farcasterNotificationService.sendNotification(customNotification);
        console.log('📨 [CustomNotification] Notification service result:', {
            success: result.success,
            resultsCount: result.results?.length || 0,
            results: result.results
        });

        if (result.success && result.results) {
            console.log('🔢 [CustomNotification] Processing results for counting...');

            // Count successful notifications - fix the structure access
            const sentCount = result.results.reduce((count: number, r: any) => {
                // Handle both direct structure and nested result structure
                const tokens = r.successfulTokens || (r.result && r.result.successfulTokens) || [];
                console.log(`📊 [CustomNotification] Result entry tokens:`, tokens.length);
                return count + tokens.length;
            }, 0);
            const totalUsers = result.results.reduce((count: number, r: any) => {
                const successful = r.successfulTokens || (r.result && r.result.successfulTokens) || [];
                const invalid = r.invalidTokens || (r.result && r.result.invalidTokens) || [];
                const rateLimited = r.rateLimitedTokens || (r.result && r.result.rateLimitedTokens) || [];
                return count + successful.length + invalid.length + rateLimited.length;
            }, 0);

            console.log(`📈 [CustomNotification] Final counts - Sent: ${sentCount}, Total Users: ${totalUsers}`);

            // Log to database for record keeping
            console.log('💾 [CustomNotification] Logging to database...');
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
            console.log('✅ [CustomNotification] Database log entry created');

            await pool.end();

            const elapsedTime = Date.now() - startTime;
            console.log(`🎉 [CustomNotification] SUCCESS! Completed in ${elapsedTime}ms`);

            return NextResponse.json({
                success: true,
                sentCount,
                totalUsers,
                results: result.results
            });
        } else {
            console.log('❌ [CustomNotification] Notification service returned failure:', result);
            return NextResponse.json({
                success: false,
                message: "Failed to send notifications"
            }, { status: 500 });
        }

    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.error('💥 [CustomNotification] ERROR after', elapsedTime + 'ms:', error);
        console.error('📚 [CustomNotification] Error stack:', error instanceof Error ? error.stack : 'Unknown error');
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
