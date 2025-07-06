import "server-only";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import http from "http";
import handler from "serve-handler";
import { getAllPresentations, getPresentationData } from "@/lib/server-utils"; // Adjust the import path as needed

// Main async function to generate thumbnails
(async () => {
  const outDir = path.join(process.cwd(), "out");
  const thumbsRoot = path.join(outDir, "thumbs");

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

        for (let p = 1; p <= totalPages; p++) {
          const outFile = path.join(slugDir, `${p}.jpg`);
          try {
            await fs.access(outFile);
            console.log(`⏩ Skipping ${slug}/${p}.jpg (already exists)`);
            continue;
          } catch {}

          const url = `http://localhost:5050/presentations/${slug}/${p}/`;
          console.log(`⏳ Generating thumbnail for ${slug}/${p}.jpg...`);
          
          await page.goto(url, { waitUntil: "networkidle0" });
          const buf = await page.screenshot({ type: "jpeg", quality: 80 });
          await fs.writeFile(outFile, buf);
          
          console.log(`✅ Generated ${slug}/${p}.jpg`);
        }
      }
    } catch (error) {
        console.error("❌ An error occurred during thumbnail generation:", error);
    } finally {
        // Ensure browser and server are closed
        console.log(" shutting down...");
        await browser.close();
        server.close(() => {
          console.log("🛑 Server stopped.");
        });
    }
  });
})();