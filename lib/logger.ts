import "server-only";

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Structured log context
export interface LogContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  timestamp?: Date;
  requestId?: string;
  [key: string]: unknown;
}

// Structured log entry
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
  timestamp: Date;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  security(event: string, context: LogContext): void;
}

class StructuredLogger implements Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, context, error, timestamp } = entry;
    
    if (this.isDevelopment) {
      // Detailed logging for development
      const contextStr = context ? ` | Context: ${JSON.stringify(context, null, 2)}` : '';
      const errorStr = error ? ` | Error: ${error.message}\n${error.stack}` : '';
      return `[${timestamp.toISOString()}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
    } else {
      // Structured JSON logging for production
      return JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        message,
        context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack
        } : undefined
      });
    }
  }

  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: new Date()
      },
      error,
      timestamp: new Date()
    };

    const formatted = this.formatLogEntry(entry);

    // Output to appropriate stream
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, error, context);
  }

  security(event: string, context: LogContext): void {
    this.log('warn', `SECURITY EVENT: ${event}`, undefined, {
      ...context,
      securityAlert: true
    });
  }
}

// Create singleton instance
const logger = new StructuredLogger();

// Global declaration for compatibility
declare global {
   
  var logger: Logger;
}

globalThis.logger = logger;
export default logger;
