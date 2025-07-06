import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getPresentationData } from "@/lib/server-utils";
import logger, { LogContext } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limiter";
import { validateRequestParams, IPAddressSchema, safeParseWithSchema } from "@/lib/validation";
import { 
  ErrorHandler, 
  throwRateLimitError, 
  throwNotFoundError, 
  ValidationError,
  SecurityError
} from "@/lib/error-handler";

export async function GET(request: NextRequest) {
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

    const { totalPages } = getPresentationData(slug);
    if (totalPages === 0) {
      throwNotFoundError("Presentation not found");
    }
    
    if (pageNum > totalPages) {
      throw new ValidationError("Page number out of range");
    }

    // Secure path construction with additional validation
    const publicDir = path.join(process.cwd(), "public");
    const htmlFilePath = path.join(publicDir, slug, `${pageNum}.html`);
    
    // Ensure the resolved path is within the public directory
    const resolvedPath = path.resolve(htmlFilePath);
    if (!resolvedPath.startsWith(path.resolve(publicDir))) {
      throw new SecurityError("Path traversal attempt detected", requestContext);
    }

    if (!fs.existsSync(htmlFilePath)) {
      throwNotFoundError("Slide not found");
    }

    // Generate thumbnail using puppeteer with configurable settings
    const puppeteerTimeout = parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10);
    const isHeadless = process.env.PUPPETEER_HEADLESS !== 'false';
    
    let browser = null;
    let page1 = null;
    
    try {
      browser = await puppeteer.launch({
        headless: isHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        timeout: puppeteerTimeout,
      });
      
      page1 = await browser.newPage();
      
      // Set security headers and disable unnecessary features
      await page1.setExtraHTTPHeaders({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      });
      
      // Set viewport to configurable slide size
      const thumbnailWidth = parseInt(process.env.THUMBNAIL_WIDTH || '1280', 10);
      const thumbnailHeight = parseInt(process.env.THUMBNAIL_HEIGHT || '720', 10);
      const thumbnailQuality = parseInt(process.env.THUMBNAIL_QUALITY || '80', 10);
      const cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE || '3600', 10);
      
      await page1.setViewport({
        width: thumbnailWidth,
        height: thumbnailHeight,
      });

      // Set timeout for page operations
      const pageTimeout = Math.min(puppeteerTimeout / 2, 15000);
      page1.setDefaultTimeout(pageTimeout);

      // Load the HTML file with timeout
      await page1.goto(`file://${htmlFilePath}`, {
        waitUntil: "networkidle0",
        timeout: pageTimeout,
      });

      // Take a screenshot with configurable quality
      const screenshot = await page1.screenshot({
        type: "jpeg",
        quality: Math.max(10, Math.min(100, thumbnailQuality)), // Ensure quality is between 10-100
      });

      // Return the screenshot with configurable cache settings
      const response = new Response(screenshot, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": `public, max-age=${cacheMaxAge}`,
          "X-Content-Type-Options": "nosniff",
        },
      });
      return response;
    } catch (error) {
      logger.error("Error generating thumbnail:", error);
      return new Response("Error generating thumbnail", { status: 500 });
    } finally {
      // Ensure browser and page are always closed
      if (page1) {
        await page1.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  } catch (error) {
    // Handle all errors using the structured error handler
    return await ErrorHandler.handleRouteError(
      error instanceof Error ? error : new Error(String(error)),
      request
    );
  }
}

// Static export configuration
export const dynamic = "force-dynamic";