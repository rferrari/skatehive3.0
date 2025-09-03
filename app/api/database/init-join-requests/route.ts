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
        const sqlFilePath = path.join(process.cwd(), 'sql', 'join_requests.sql');
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
            message: 'Join requests database initialization completed',
            results
        });
    } catch (error) {
        console.error('Join requests database initialization error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Check if join_requests table exists
        const tablesCheck = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'join_requests';
        `;

        const tableExists = tablesCheck.rows.length > 0;

        return NextResponse.json({
            success: true,
            tableExists,
            tableName: 'join_requests'
        });
    } catch (error) {
        console.error('Join requests table check error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
