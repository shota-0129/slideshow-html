import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getPresentationData } from "@/lib/server-utils";
import logger from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limiter";

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
}

// Static export configuration
export const dynamic = "force-dynamic";