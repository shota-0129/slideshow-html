import { NextRequest } from "next/server";
import { generateThumbnail } from "@/lib/thumb/generator";
import { LogContext } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limiter";
import { validateRequestParams, IPAddressSchema, safeParseWithSchema } from "@/lib/validation";
import { 
  ErrorHandler, 
  throwRateLimitError, 
  throwNotFoundError, 
  ValidationError
} from "@/lib/error-handler";

// Static export compatibility - only force static in production static builds
export const dynamic = process.env.STATIC_EXPORT === 'true' ? 'force-static' : 'auto';
export const revalidate = false;

export async function GET(request: NextRequest) {
  // In static export mode, always return 404
  if (process.env.STATIC_EXPORT === 'true') {
    return new Response('Not available in static export', { status: 404 });
  }

  try {
    // Create request context for logging
    const requestContext: LogContext = {
      path: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown'
    };

    // Enhanced IP validation with Zod
    const rawIp = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown';
    
    const ipValidation = safeParseWithSchema(IPAddressSchema, rawIp);
    const ip = ipValidation.success ? ipValidation.data : 'unknown';
    requestContext.ip = ip;
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      throwRateLimitError();
    }

    // Comprehensive parameter validation with Zod
    const paramsValidation = validateRequestParams(request.nextUrl.searchParams);
    if (!paramsValidation.success) {
      throw new ValidationError(paramsValidation.error);
    }

    const { slug, page: pageNum } = paramsValidation.data;
    requestContext.slug = slug;
    requestContext.page = pageNum;

    // Generate thumbnail using the extracted generator function
    const cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE || '3600', 10);
    const result = await generateThumbnail(slug, pageNum, {}, requestContext);

    if (!result.success) {
      if (result.error === "Presentation not found" || result.error === "Slide not found") {
        throwNotFoundError(result.error);
      }
      // Check if it's a server-side error (Puppeteer, etc.) vs validation error
      if (result.error && (
        result.error.includes('Puppeteer') || 
        result.error.includes('Screenshot') ||
        result.error.includes('Browser') ||
        result.error.includes('launch') ||
        result.error.includes('timeout')
      )) {
        // Server-side errors should return 500 with specific message
        return new Response("Error generating thumbnail", { status: 500 });
      }
      throw new ValidationError(result.error || "Unknown error generating thumbnail");
    }

    // Return the screenshot with configurable cache settings
    const response = new Response(result.data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": `public, max-age=${cacheMaxAge}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
    return response;
  } catch (error) {
    // Handle all errors using the structured error handler
    return await ErrorHandler.handleRouteError(
      error instanceof Error ? error : new Error(String(error)),
      request
    );
  }
}