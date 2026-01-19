import { NextRequest, NextResponse } from 'next/server'
import { APP_CONFIG } from '@/config/app.config';

export async function GET(request: NextRequest) {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username')

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 })
        }

        // Test URL generation with the current environment
        const baseUrl = APP_CONFIG.ORIGIN || 'http://localhost:3000'

        // Test URL construction like the notification service does
        const testHiveUrl = `${APP_CONFIG.BASE_URL}/post/hive-196037/@${username}/test-post-permlink`

        // Test URL parsing
        const cleanUrl = testHiveUrl.replace(`${APP_CONFIG.BASE_URL}/`, '')

        // Test final URL construction
        const finalUrl = `${baseUrl}/${cleanUrl}`

        // Test URL validation
        try {
            new URL(finalUrl)
        } catch (urlError) {
            console.error(`[test-notification] ❌ URL is invalid:`, urlError)
        }

        return NextResponse.json({
            username,
            baseUrl,
            testHiveUrl,
            cleanUrl,
            finalUrl,
            urlValid: true
        })
    } catch (error) {
        console.error('Test notification error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
