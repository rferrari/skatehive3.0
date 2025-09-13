import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface ClientErrorLog {
    timestamp: string;
    level: 'error' | 'warning' | 'info';
    type: string;
    message: string;
    details?: {
        userAgent?: string;
        url?: string;
        userId?: string;
        fileSize?: number;
        fileName?: string;
        errorCode?: string;
        stack?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            level = 'error',
            type,
            message,
            details = {}
        } = body;

        // Validate required fields
        if (!type || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: type and message' },
                { status: 400 }
            );
        }

        // Get client info from request
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Create log entry
        const logEntry: ClientErrorLog = {
            timestamp: new Date().toISOString(),
            level,
            type,
            message,
            details: {
                ...details,
                userAgent,
                clientIp,
                url: details.url || request.nextUrl.toString()
            }
        };

        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!existsSync(logsDir)) {
            await mkdir(logsDir, { recursive: true });
        }

        // Write to log file
        const logFile = path.join(logsDir, 'client-errors.log');
        const logLine = JSON.stringify(logEntry) + '\n';

        await appendFile(logFile, logLine);

        // Also log to console for immediate visibility
        console.log(`🌐 Client ${level.toUpperCase()}: [${type}] ${message}`, details);

        return NextResponse.json({
            success: true,
            message: 'Error logged successfully'
        });

    } catch (error) {
        console.error('❌ Failed to log client error:', error);
        return NextResponse.json(
            { error: 'Failed to log error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const level = searchParams.get('level');
        const type = searchParams.get('type');

        const logsDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logsDir, 'client-errors.log');

        if (!existsSync(logFile)) {
            return NextResponse.json({ logs: [] });
        }

        // Read log file
        const fs = require('fs');
        const logs = fs.readFileSync(logFile, 'utf8')
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(Boolean)
            .reverse() // Most recent first
            .slice(0, limit);

        // Apply filters
        let filteredLogs = logs;
        if (level) {
            filteredLogs = filteredLogs.filter((log: ClientErrorLog) => log.level === level);
        }
        if (type) {
            filteredLogs = filteredLogs.filter((log: ClientErrorLog) => log.type === type);
        }

        return NextResponse.json({
            logs: filteredLogs,
            total: logs.length,
            filtered: filteredLogs.length
        });

    } catch (error) {
        console.error('❌ Failed to read client logs:', error);
        return NextResponse.json(
            { error: 'Failed to read logs' },
            { status: 500 }
        );
    }
}