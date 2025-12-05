import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { apiLimiter, getClientIP } from '@/lib/utils/rate-limiter';

// Maximum payload size (10KB) to prevent DoS
const MAX_PAYLOAD_SIZE = 10 * 1024;

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

// Sanitize string to prevent log injection
function sanitizeLogString(str: string, maxLength: number = 1000): string {
    return str
        .slice(0, maxLength)
        .replace(/[\r\n]/g, ' ')  // Remove newlines
        .replace(/[^\x20-\x7E]/g, ''); // Keep only printable ASCII
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting check
        const ip = getClientIP(request);
        const { allowed, remaining, resetIn } = apiLimiter.check(ip);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: Math.ceil(resetIn / 1000) },
                { status: 429 }
            );
        }

        // Check content length to prevent DoS
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
            return NextResponse.json(
                { error: 'Payload too large. Maximum size is 10KB.' },
                { status: 413 }
            );
        }

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

        // Validate and sanitize inputs
        const validLevels = ['error', 'warning', 'info'];
        const sanitizedLevel = validLevels.includes(level) ? level : 'error';
        const sanitizedType = sanitizeLogString(String(type), 100);
        const sanitizedMessage = sanitizeLogString(String(message), 500);

        // Get client info from request
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Create log entry with sanitized data
        const logEntry: ClientErrorLog = {
            timestamp: new Date().toISOString(),
            level: sanitizedLevel as 'error' | 'warning' | 'info',
            type: sanitizedType,
            message: sanitizedMessage,
            details: {
                userAgent: sanitizeLogString(userAgent, 200),
                clientIp: sanitizeLogString(clientIp, 50),
                url: sanitizeLogString(details.url || request.nextUrl.toString(), 500),
                ...(details.userId && { userId: sanitizeLogString(String(details.userId), 50) }),
                ...(details.fileSize && { fileSize: Math.min(Number(details.fileSize) || 0, 1e12) }),
                ...(details.fileName && { fileName: sanitizeLogString(String(details.fileName), 200) }),
                ...(details.errorCode && { errorCode: sanitizeLogString(String(details.errorCode), 50) }),
                ...(details.stack && { stack: sanitizeLogString(String(details.stack), 2000) }),
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

        // Also log to console for immediate visibility (use sanitized values)
        console.log(`🌐 Client ${sanitizedLevel.toUpperCase()}: [${sanitizedType}] ${sanitizedMessage}`);

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