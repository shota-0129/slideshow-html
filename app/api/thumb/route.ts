import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getPresentationData } from "@/lib/server-utils";
import logger from "@/lib/logger";

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

/**
 * Simple rate limiting function
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Validates slug parameter to prevent path traversal
 */
function validateSlug(slug: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(slug) &&
         !slug.includes('..') &&
         slug.length > 0 &&
         slug.length <= 100;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';
    if (!checkRateLimit(ip)) {
      return new Response("Too many requests", { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const page = searchParams.get("page");

    if (!slug || !page) {
      return new Response("Missing slug or page parameter", { status: 400 });
    }

    // Validate slug to prevent path traversal
    if (!validateSlug(slug)) {
      logger.warn(`Invalid slug provided: "${slug}" from IP: ${ip}`);
      return new Response("Invalid slug parameter", { status: 400 });
    }

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      return new Response("Invalid page number", { status: 400 });
    }

    const { totalPages } = getPresentationData(slug);
    if (totalPages === 0) {
      return new Response("Presentation not found", { status: 404 });
    }
    
    if (pageNum > totalPages) {
      return new Response("Page number out of range", { status: 400 });
    }

    // Secure path construction with additional validation
    const publicDir = path.join(process.cwd(), "public");
    const htmlFilePath = path.join(publicDir, slug, `${pageNum}.html`);
    
    // Ensure the resolved path is within the public directory
    const resolvedPath = path.resolve(htmlFilePath);
    if (!resolvedPath.startsWith(path.resolve(publicDir))) {
      logger.warn(`Path traversal attempt detected: "${slug}" from IP: ${ip}`);
      return new Response("Invalid file path", { status: 400 });
    }

    if (!fs.existsSync(htmlFilePath)) {
      return new Response("Slide not found", { status: 404 });
    }

    // Generate thumbnail using puppeteer with configurable settings
    const puppeteerTimeout = parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10);
    const isHeadless = process.env.PUPPETEER_HEADLESS !== 'false';
    
    const browser = await puppeteer.launch({
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

    let page1;
    try {
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
      return new Response(screenshot, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": `public, max-age=${cacheMaxAge}`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    } finally {
      // Ensure browser is always closed
      if (page1) {
        await page1.close().catch(() => {});
      }
      await browser.close().catch(() => {});
    }
  } catch (error) {
    logger.error("Error generating thumbnail:", error);
    return new Response("Error generating thumbnail", { status: 500 });
  }
}

// Static export configuration
export const dynamic = "force-dynamic";