/**
 * Client Error Logger
 * Utility for sending client-side errors to the centralized logging system
 */

interface ErrorDetails {
    userAgent?: string;
    url?: string;
    userId?: string;
    fileSize?: number;
    fileName?: string;
    errorCode?: string;
    stack?: string;
    [key: string]: any;
}

interface ErrorReport {
    level: 'error' | 'warning' | 'info';
    type: string;
    message: string;
    details?: ErrorDetails;
}

class ClientErrorLogger {
    private static instance: ClientErrorLogger;
    private apiEndpoint = '/api/logs/client-errors';
    private isEnabled = true;

    private constructor() { }

    static getInstance(): ClientErrorLogger {
        if (!ClientErrorLogger.instance) {
            ClientErrorLogger.instance = new ClientErrorLogger();
        }
        return ClientErrorLogger.instance;
    }

    /**
     * Enable or disable error logging
     */
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    /**
     * Log an error
     */
    async logError(type: string, message: string, details?: ErrorDetails) {
        return this.log('error', type, message, details);
    }

    /**
     * Log a warning
     */
    async logWarning(type: string, message: string, details?: ErrorDetails) {
        return this.log('warning', type, message, details);
    }

    /**
     * Log info
     */
    async logInfo(type: string, message: string, details?: ErrorDetails) {
        return this.log('info', type, message, details);
    }

    /**
     * Log an upload error with file details
     */
    async logUploadError(
        error: string,
        fileName?: string,
        fileSize?: number,
        additionalDetails?: ErrorDetails
    ) {
        return this.logError('upload_error', error, {
            fileName,
            fileSize,
            ...additionalDetails
        });
    }

    /**
     * Log a file size restriction error
     */
    async logSizeRestrictionError(
        fileName: string,
        fileSize: number,
        maxSize: number,
        platform?: string
    ) {
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);

        return this.logError('size_restriction',
            `File too large: ${fileSizeMB}MB exceeds ${maxSizeMB}MB limit`,
            {
                fileName,
                fileSize,
                maxSize,
                platform,
                fileSizeMB: parseFloat(fileSizeMB),
                maxSizeMB: parseFloat(maxSizeMB)
            }
        );
    }

    /**
     * Log a video processing error
     */
    async logVideoProcessingError(
        error: string,
        fileName?: string,
        fileSize?: number,
        processingStep?: string,
        serverUrl?: string
    ) {
        return this.logError('video_processing', error, {
            fileName,
            fileSize,
            processingStep,
            serverUrl
        });
    }

    /**
     * Log an API error
     */
    async logApiError(
        endpoint: string,
        statusCode: number,
        error: string,
        responseData?: any
    ) {
        return this.logError('api_error',
            `API ${endpoint} failed with status ${statusCode}: ${error}`,
            {
                endpoint,
                statusCode,
                responseData
            }
        );
    }

    /**
     * Generic log method
     */
    private async log(
        level: 'error' | 'warning' | 'info',
        type: string,
        message: string,
        details?: ErrorDetails
    ) {
        if (!this.isEnabled) {
            return;
        }

        try {
            const errorReport: ErrorReport = {
                level,
                type,
                message,
                details: {
                    ...details,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            };

            // Also log to console for development
            const consoleMethod = level === 'error' ? console.error :
                level === 'warning' ? console.warn : console.log;
            consoleMethod(`🌐 [${type}] ${message}`, details);

            // Send to server
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorReport)
            });

            if (!response.ok) {
                console.warn('Failed to send error log to server:', response.status);
            }

        } catch (error) {
            // Avoid infinite loops by not logging the logging error
            console.warn('Client error logger failed:', error);
        }
    }
}

// Export singleton instance
export const clientErrorLogger = ClientErrorLogger.getInstance();

// Convenience exports for direct use
export const logError = (type: string, message: string, details?: ErrorDetails) =>
    clientErrorLogger.logError(type, message, details);

export const logWarning = (type: string, message: string, details?: ErrorDetails) =>
    clientErrorLogger.logWarning(type, message, details);

export const logInfo = (type: string, message: string, details?: ErrorDetails) =>
    clientErrorLogger.logInfo(type, message, details);

export const logUploadError = (error: string, fileName?: string, fileSize?: number, details?: ErrorDetails) =>
    clientErrorLogger.logUploadError(error, fileName, fileSize, details);

export const logSizeRestrictionError = (fileName: string, fileSize: number, maxSize: number, platform?: string) =>
    clientErrorLogger.logSizeRestrictionError(fileName, fileSize, maxSize, platform);

export const logVideoProcessingError = (error: string, fileName?: string, fileSize?: number, processingStep?: string, serverUrl?: string) =>
    clientErrorLogger.logVideoProcessingError(error, fileName, fileSize, processingStep, serverUrl);

export const logApiError = (endpoint: string, statusCode: number, error: string, responseData?: any) =>
    clientErrorLogger.logApiError(endpoint, statusCode, error, responseData);

// Auto-setup global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        clientErrorLogger.logError('javascript_error',
            event.error?.message || 'Unknown JavaScript error',
            {
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        );
    });

    window.addEventListener('unhandledrejection', (event) => {
        clientErrorLogger.logError('unhandled_promise_rejection',
            event.reason?.message || 'Unhandled promise rejection',
            {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            }
        );
    });
}