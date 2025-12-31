import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

export async function crawlWebsite(startUrl) {
  const visited = new Set();
  const queue = [startUrl];
  const pages = [];

  const baseDomain = new URL(startUrl).origin;
  const MAX_PAGES = 5;

  while (queue.length > 0 && pages.length < MAX_PAGES) {

    const currentUrl = queue.shift();

    if (
      currentUrl.includes("/login") ||
      currentUrl.includes("/tag")
    ) {
      continue;
    }    

    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    pages.push(currentUrl);

    try {
      const { data } = await axios.get(currentUrl, {
        timeout: 10000
      });

      const $ = cheerio.load(data);

      $("a[href]").each((_, el) => {
        let href = $(el).attr("href");
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, currentUrl).href;

          // Crawl only same-domain links
          if (
            absoluteUrl.startsWith(baseDomain) &&
            !visited.has(absoluteUrl)
          ) {
            queue.push(absoluteUrl);
          }
        } catch {
          // Ignore malformed URLs
        }
      });

    } catch (err) {
      console.error("Failed to crawl:", currentUrl);
    }
  }

  return pages;
}
