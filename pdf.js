import puppeteer from "puppeteer";

export async function generatePDF(url, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // IMPORTANT: desktop viewport
  await page.setViewport({
    width: 1280,
    height: 800
  });

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  // Disable animations & sticky issues
  await page.addStyleTag({
    content: `
      * {
        animation: none !important;
        transition: none !important;
      }
      header, footer {
        position: static !important;
      }
    `
  });

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,

    // 🔥 THIS FIXES BLANK PAGES
    margin: {
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px"
    },

    preferCSSPageSize: true
  });

  await browser.close();
}
