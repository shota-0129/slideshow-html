import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import serve from "serve";
import { getAllPresentations, getPresentationData } from "@/lib/server-utils"; // Adjust the import path as needed

(async () => {
  const outDir = path.join(process.cwd(), "out");       // next export 出力先
  const thumbsRoot = path.join(outDir, "thumbs");
  await fs.mkdir(thumbsRoot, { recursive: true });

  // out/ を一時配信して Puppeteer が URL を開けるように
  const server = serve(outDir, { port: 5050, silent: true });

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  for (const pres of getAllPresentations()) {
    const { slug } = pres;
    const { totalPages } = getPresentationData(slug);
    const slugDir = path.join(thumbsRoot, slug);
    await fs.mkdir(slugDir, { recursive: true });

    for (let p = 1; p <= totalPages; p++) {
      const outFile = path.join(slugDir, `${p}.jpg`);
      try { await fs.access(outFile); continue; } catch {}
      const url = `http://localhost:5050/presentations/${slug}/${p}/`;
      await page.goto(url, { waitUntil: "networkidle0" });
      const buf = await page.screenshot({ type: "jpeg", quality: 80 });
      await fs.writeFile(outFile, buf);
      console.log(`✅  ${outFile}`);
    }
  }

  await browser.close();
  server.stop();
})();
