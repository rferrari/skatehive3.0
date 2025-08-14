import { NextRequest, NextResponse } from 'next/server';
import { DatabaseTokenStore } from '@/lib/farcaster/database-token-store';

// Initialize database endpoint - should only be run once
export async function POST(request: NextRequest) {
    try {
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
