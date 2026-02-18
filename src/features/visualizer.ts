import { CrawlResult } from './crawler';

export function generateMermaidGraph(results: CrawlResult[]): string {
  const urlToId = new Map<string, string>();
  let nextId = 0;

  const getId = (url: string): string => {
    if (!urlToId.has(url)) {
      urlToId.set(url, `N${nextId}`);
      nextId++;
    }
    return urlToId.get(url)!;
  };

  const resultMap = new Map<string, CrawlResult>();
  results.forEach(r => resultMap.set(r.url, r));

  // Populate IDs for all encountered URLs
  results.forEach(res => {
    getId(res.url);
    res.links.forEach(link => getId(link));
  });

  const lines: string[] = ["graph TD"];

  // Add nodes
  for (const [url, id] of urlToId.entries()) {
    const res = resultMap.get(url);
    const isVisited = !!res;

    let label = url;
    try {
      const u = new URL(url);
      label = u.pathname === "/" ? "/" : u.pathname;
      if (!isVisited) {
         label = u.hostname + label;
      }
      if (label.length > 40) label = label.substring(0, 37) + "...";
    } catch {}

    if (isVisited) {
      if (res!.status >= 400 || res!.error) {
        lines.push(`    ${id}["${label} 🚨"]`);
        lines.push(`    style ${id} fill:#ffcccc,stroke:#ff0000,stroke-width:2px`);
      } else if (res!.status >= 300 && res!.status < 400) {
        lines.push(`    ${id}["${label} ➡️"]`);
        lines.push(`    style ${id} fill:#ffffcc,stroke:#ffcc00,stroke-width:2px`);
      } else {
        lines.push(`    ${id}["${label}"]`);
      }
    } else {
      lines.push(`    ${id}("${label}")`);
      lines.push(`    style ${id} stroke-dasharray: 5 5,color:#666`);
    }
    lines.push(`    click ${id} "${url}"`);
  }

  // Add edges
  results.forEach(res => {
    const sourceId = getId(res.url);
    res.links.forEach(link => {
      const targetId = getId(link);
      if (sourceId !== targetId) {
        lines.push(`    ${sourceId} --> ${targetId}`);
      }
    });
  });

  return lines.join("\n");
}
