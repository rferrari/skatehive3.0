import { NextRequest, NextResponse } from 'next/server';
import { DatabaseTokenStore } from '@/lib/farcaster/database-token-store';

// Initialize database endpoint - should only be run once
export async function POST(request: NextRequest) {
    try {
        // Add basic security for database initialization
        const body = await request.json().catch(() => ({}));
        const { password } = body;

        // Allow initialization in development without password
        const isDevelopment = process.env.NODE_ENV === 'development';
        const initPassword = process.env.FARCASTER_INIT_PASSWORD || 'dev';

        if (!isDevelopment && password !== initPassword) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!isDevelopment && !password) {
            return NextResponse.json(
                { error: 'Password required for production' },
                { status: 401 }
            );
        }

        const tokenStore = new DatabaseTokenStore();
        await tokenStore.initializeDatabase();

        return NextResponse.json({
            success: true,
            message: 'Database initialized successfully',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Database initialization failed:', error);

        return NextResponse.json(
            {
                error: 'Database initialization failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Get database status
export async function GET() {
    try {
        const tokenStore = new DatabaseTokenStore();
        const tokens = await tokenStore.getAllTokens();

        return NextResponse.json({
            status: 'connected',
            totalTokens: tokens.length,
            activeTokens: tokens.filter(t => t.isActive).length,
            lastUpdated: tokens.length > 0 ? Math.max(...tokens.map(t => t.updatedAt.getTime())) : null,
        });

    } catch (error) {
        console.error('Database status check failed:', error);

        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
