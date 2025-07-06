import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getPresentationData } from "@/lib/server-utils";
import logger, { LogContext } from "@/lib/logger";
import { 
  SecurityError
} from "@/lib/error-handler";

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  timeout?: number;
  headless?: boolean;
}

export interface ThumbnailResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

export async function generateThumbnail(
  slug: string,
  pageNum: number,
  options: ThumbnailOptions = {},
  requestContext?: LogContext
): Promise<ThumbnailResult> {
  const {
    width = parseInt(process.env.THUMBNAIL_WIDTH || '1280', 10),
    height = parseInt(process.env.THUMBNAIL_HEIGHT || '720', 10),
    quality = parseInt(process.env.THUMBNAIL_QUALITY || '80', 10),
    timeout = parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10),
    headless = process.env.PUPPETEER_HEADLESS !== 'false'
  } = options;

  try {
    const { totalPages } = getPresentationData(slug);
    if (totalPages === 0) {
      return { success: false, error: "Presentation not found" };
    }
    
    if (pageNum > totalPages) {
      return { success: false, error: "Page number out of range" };
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
      return { success: false, error: "Slide not found" };
    }

    let browser = null;
    let page = null;
    
    try {
      browser = await puppeteer.launch({
        headless,
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
        timeout,
      });
      
      page = await browser.newPage();
      
      // Set security headers and disable unnecessary features
      await page.setExtraHTTPHeaders({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      });
      
      await page.setViewport({ width, height });

      // Set timeout for page operations
      const pageTimeout = Math.min(timeout / 2, 15000);
      page.setDefaultTimeout(pageTimeout);

      // Load the HTML file with timeout
      await page.goto(`file://${htmlFilePath}`, {
        waitUntil: "networkidle0",
        timeout: pageTimeout,
      });

      // Take a screenshot with configurable quality
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: Math.max(10, Math.min(100, quality)), // Ensure quality is between 10-100
      });

      return { success: true, data: screenshot };
    } finally {
      // Ensure browser and page are always closed
      if (page) {
        await page.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  } catch (error) {
    logger.error("Error generating thumbnail:", error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function generateAllThumbnails(
  outputDir: string = path.join(process.cwd(), "public", "thumb"),
  options: ThumbnailOptions = {}
): Promise<{ success: number; failed: number; errors: string[] }> {
  const publicDir = path.join(process.cwd(), "public");
  const presentationDirs = fs.readdirSync(publicDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'thumb')
    .map(dirent => dirent.name);

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const slug of presentationDirs) {
    try {
      const { totalPages } = getPresentationData(slug);
      
      // Create output directory for this presentation
      const slugOutputDir = path.join(outputDir, slug);
      if (!fs.existsSync(slugOutputDir)) {
        fs.mkdirSync(slugOutputDir, { recursive: true });
      }

      for (let page = 1; page <= totalPages; page++) {
        const result = await generateThumbnail(slug, page, options);
        
        if (result.success && result.data) {
          const outputPath = path.join(slugOutputDir, `${page}.jpg`);
          fs.writeFileSync(outputPath, result.data);
          success++;
          logger.info(`Generated thumbnail: ${slug}/${page}`);
        } else {
          failed++;
          const errorMsg = `Failed to generate ${slug}/${page}: ${result.error}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process presentation ${slug}: ${error}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      failed++;
    }
  }

  return { success, failed, errors };
}