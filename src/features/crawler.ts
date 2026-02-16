import { Page } from 'playwright';

export interface CrawlResult {
  url: string;
  status: number;
  links: string[];
  error?: string;
}

export class Crawler {
  async crawl(page: Page, startUrl: string, maxDepth: number = 2): Promise<CrawlResult[]> {
    console.log(`Starting crawl from ${startUrl} with depth ${maxDepth}...`);

    const rootUrl = new URL(startUrl);
    const origin = rootUrl.origin;

    const normalize = (u: string) => {
      try {
        const urlObj = new URL(u);
        urlObj.hash = ''; // Strip hash
        let normalized = urlObj.href;
        if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
        return normalized;
      } catch {
        return u;
      }
    };

    const visited = new Set<string>();
    const results: CrawlResult[] = [];
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    visited.add(normalize(startUrl));

    while (queue.length > 0) {
      const { url, depth } = queue.shift()!;

      console.log(`Crawling: ${url} (Depth: ${depth})`);

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = response ? response.status() : 0;

        let links: string[] = [];
        let internalLinks: string[] = [];

        if (status >= 200 && status < 300) {
          links = await page.$$eval('a', (anchors) =>
            anchors.map(a => a.href).filter(href => href.startsWith('http'))
          );

          // Add to results
          const uniqueLinks = Array.from(new Set(links));

          results.push({
            url: url,
            status: status,
            links: uniqueLinks
          });

          // Filter for next steps
          internalLinks = links.filter(link => {
            try {
              return new URL(link).origin === origin;
            } catch { return false; }
          });
        } else {
          results.push({
            url: url,
            status: status,
            links: []
          });
        }

        if (depth < maxDepth) {
          for (const link of internalLinks) {
            const normLink = normalize(link);
            if (!visited.has(normLink)) {
              visited.add(normLink);
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }

      } catch (e: any) {
        console.error(`Failed to crawl ${url}:`, e.message);
        results.push({
          url: url,
          status: 0,
          links: [],
          error: e.message
        });
      }
    }

    return results;
  }
}
