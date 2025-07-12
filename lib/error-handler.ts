import "server-only";
import logger, { LogContext } from './logger';

// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string, public context?: LogContext) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Error response builder
export interface ErrorResponse {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

export class ErrorHandler {
  static handleApiError(
    error: Error,
    context?: LogContext
  ): ErrorResponse {
    const baseContext = {
      ...context,
      errorName: error.name,
      errorMessage: error.message
    };

    switch (error.constructor) {
      case ValidationError:
        logger.warn('Validation error', baseContext);
        return {
          status: 400,
          body: error.message
        };

      case SecurityError:
        const securityError = error as SecurityError;
        logger.security('Security violation detected', {
          ...baseContext,
          ...securityError.context
        });
        return {
          status: 400,
          body: 'Invalid request'
        };

      case RateLimitError:
        logger.warn('Rate limit exceeded', baseContext);
        return {
          status: 429,
          body: error.message,
          headers: {
            'Retry-After': '60'
          }
        };

      case NotFoundError:
        logger.info('Resource not found', baseContext);
        return {
          status: 404,
          body: error.message
        };

      default:
        // Unexpected errors
        logger.error('Unexpected API error', error, baseContext);
        return {
          status: 500,
          body: 'Internal server error'
        };
    }
  }

  static createResponse(errorResponse: ErrorResponse): Response {
    return new Response(errorResponse.body, {
      status: errorResponse.status,
      headers: {
        'Content-Type': 'text/plain',
        'X-Content-Type-Options': 'nosniff',
        ...errorResponse.headers
      }
    });
  }

  static async handleRouteError(
    error: Error,
    request: Request
  ): Promise<Response> {
    const context: LogContext = {
      path: new URL(request.url).pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    const errorResponse = this.handleApiError(error, context);
    return this.createResponse(errorResponse);
  }
}

// Utility functions for common error scenarios
export const throwValidationError = (message: string, field?: string): never => {
  throw new ValidationError(message, field);
};

export const throwSecurityError = (message: string, context?: LogContext): never => {
  throw new SecurityError(message, context);
};

export const throwRateLimitError = (): never => {
  throw new RateLimitError();
};

export const throwNotFoundError = (message?: string): never => {
  throw new NotFoundError(message);
};

// Safe async wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: LogContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    logger.error('Safe async operation failed', error instanceof Error ? error : new Error(String(error)), context);
    return null;
  }
}