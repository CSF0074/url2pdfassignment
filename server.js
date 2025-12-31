import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import { crawlWebsite } from "./crawler.js";
import { generatePDF } from "./pdf.js";
import { mergePDFs } from "./merge.js";

const app = express();
app.use(cors());
app.use(express.json());

const OUTPUT_DIR = path.join(process.cwd(), "output");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

app.post("/process", async (req, res) => {
  try {
    let { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const pages = await crawlWebsite(url);
    const pdfPaths = [];

    for (let i = 0; i < pages.length; i++) {
      const pdfPath = path.join(
        OUTPUT_DIR,
        `page-${i + 1}.pdf`
      );

      await generatePDF(pages[i], pdfPath);
      pdfPaths.push(pdfPath);
    }

    const mergedPath = path.join(OUTPUT_DIR, "merged.pdf");
    await mergePDFs(pdfPaths, mergedPath);

    res.json({
      pages: pdfPaths.map((_, i) => ({
        name: `Page ${i + 1}`,
        downloadUrl: `/output/page-${i + 1}.pdf`
      })),
      mergedDownloadUrl: "/output/merged.pdf"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.use("/output", express.static(OUTPUT_DIR));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
