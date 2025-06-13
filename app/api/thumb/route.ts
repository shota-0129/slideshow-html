import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { getPresentationData } from "@/lib/server-utils";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const page = searchParams.get("page");

    if (!slug || !page) {
      return new Response("Missing slug or page parameter", { status: 400 });
    }

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum)) {
      return new Response("Invalid page number", { status: 400 });
    }

    const { totalPages } = getPresentationData(slug);
    if (pageNum < 1 || pageNum > totalPages) {
      return new Response("Page number out of range", { status: 400 });
    }

    // Check if HTML file exists
    const htmlFilePath = path.join(process.cwd(), "public", slug, `${pageNum}.html`);
    if (!fs.existsSync(htmlFilePath)) {
      return new Response("Slide not found", { status: 404 });
    }

    // Generate thumbnail using puppeteer
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page1 = await browser.newPage();
    
    // Set viewport to a standard slide size
    await page1.setViewport({
      width: 1280,
      height: 720,
    });

    // Load the HTML file
    await page1.goto(`file://${htmlFilePath}`, {
      waitUntil: "networkidle0",
    });

    // Take a screenshot
    const screenshot = await page1.screenshot({
      type: "jpeg",
      quality: 80,
    });

    await browser.close();

    // Return the screenshot as the response
    return new Response(screenshot, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    logger.error("Error generating thumbnail:", error);
    return new Response("Error generating thumbnail", { status: 500 });
  }
}

// Static export configuration
export const dynamic = "force-dynamic";