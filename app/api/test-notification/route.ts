import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username')

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 })
        }

        // Test URL generation with the current environment
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        // Test URL construction like the notification service does
        const testHiveUrl = `https://skatehive.app/post/hive-196037/@${username}/test-post-permlink`

        // Test URL parsing
        const cleanUrl = testHiveUrl.replace('https://skatehive.app/', '')

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
