import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

// Configure the database connection for this endpoint
if (process.env.STORAGE_POSTGRES_URL && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = process.env.STORAGE_POSTGRES_URL;
}

export async function POST() {
    try {
        // Read the SQL file
        const sqlFilePath = path.join(process.cwd(), 'sql', 'farcaster_notifications.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split the SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        const results = [];

        // Execute each statement
        for (const statement of statements) {
            try {
                console.log('Executing SQL:', statement.substring(0, 100) + '...');
                await sql.query(statement);
                results.push({ statement: statement.substring(0, 50) + '...', success: true });
            } catch (error) {
                console.error('Error executing statement:', statement, error);
                results.push({
                    statement: statement.substring(0, 50) + '...',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database initialization completed',
            results
        });
    } catch (error) {
        console.error('Database initialization error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Check if tables exist
        const tablesCheck = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('farcaster_notifications', 'farcaster_tokens', 'farcaster_notification_log');
        `;

        const existingTables = tablesCheck.rows.map(row => row.table_name);

        return NextResponse.json({
            success: true,
            existingTables,
            missingTables: [
                'farcaster_notifications',
                'farcaster_tokens',
                'farcaster_notification_log'
            ].filter(table => !existingTables.includes(table))
        });
    } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
