import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import http from "http";
import handler from "serve-handler";

// Helper functions to discover presentations
function getAllPresentations() {
  try {
    const presentationsDir = path.join(process.cwd(), "out", "presentations");
    const items: any[] = require('fs').readdirSync(presentationsDir, { withFileTypes: true });
    
    return items
      .filter((item: any) => item.isDirectory())
      .map((item: any) => ({ slug: item.name }));
  } catch (error) {
    console.error("Error reading presentation directories:", error);
    return [];
  }
}

function getPresentationData(slug: string) {
  try {
    const presentationDir = path.join(process.cwd(), "out", "presentations", slug);
    const items: any[] = require('fs').readdirSync(presentationDir, { withFileTypes: true });
    
    const pageNumbers = items
      .filter((item: any) => item.isDirectory() && /^\d+$/.test(item.name))
      .map((item: any) => parseInt(item.name))
      .sort((a, b) => a - b);
    
    return { totalPages: pageNumbers.length > 0 ? Math.max(...pageNumbers) : 0 };
  } catch (error) {
    console.error(`Error reading presentation ${slug}:`, error);
    return { totalPages: 0 };
  }
}

// Main async function to generate thumbnails
(async () => {
  const outDir = path.join(process.cwd(), "out");
  const thumbsRoot = path.join(outDir, "thumb");

  // Ensure the root thumbnail directory exists
  await fs.mkdir(thumbsRoot, { recursive: true });

  // Create an HTTP server to serve the 'out' directory statically
  const server = http.createServer((request, response) => {
    // Use serve-handler to handle requests
    return handler(request, response, { public: outDir });
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  // Start the server and then run the puppeteer script
  server.listen(5050, async () => {
    console.log("🚀 Server running at http://localhost:5050 for thumbnail generation...");

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    try {
      const presentations = getAllPresentations();
      for (const pres of presentations) {
        const { slug } = pres;
        const { totalPages } = getPresentationData(slug);
        const slugDir = path.join(thumbsRoot, slug);
        await fs.mkdir(slugDir, { recursive: true });

        // Only generate thumbnail for the first slide
        const p = 1;
        const outFile = path.join(slugDir, `${p}.jpg`);
        try {
          await fs.access(outFile);
          console.log(`⏩ Skipping ${slug}/${p}.jpg (already exists)`);
        } catch {
          // HTMLファイルを直接読み込むように変更
          // publicとprivateの両方をチェック
          const publicPath = path.join(process.cwd(), 'public', 'slides', 'public', slug, `${p}.html`);
          const privatePath = path.join(process.cwd(), 'public', 'slides', 'private', slug, `${p}.html`);
          
          let htmlPath: string;
          if (require('fs').existsSync(publicPath)) {
            htmlPath = publicPath;
          } else if (require('fs').existsSync(privatePath)) {
            htmlPath = privatePath;
          } else {
            console.error(`❌ HTML file not found for ${slug}/${p}`);
            continue;
          }
          
          const htmlUrl = `file://${htmlPath}`;
          console.log(`⏳ Generating thumbnail for ${slug}/${p}.jpg...`);
          
          await page.goto(htmlUrl, { waitUntil: "networkidle0" });
          await page.setViewport({ width: 1280, height: 720 });
          const buf = await page.screenshot({ type: "jpeg", quality: 80, fullPage: false });
          await fs.writeFile(outFile, buf);
          
          console.log(`✅ Generated ${slug}/${p}.jpg`);
        }
      }
    } catch (error) {
        console.error("❌ An error occurred during thumbnail generation:", error);
    } finally {
        // Ensure browser and server are closed
        console.log("shutting down...");
        await browser.close();
        server.close(() => {
          console.log("🛑 Server stopped.");
        });
    }
  });
})();