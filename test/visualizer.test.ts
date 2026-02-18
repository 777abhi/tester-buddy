import { expect, test, describe } from "bun:test";
import { generateMermaidGraph } from "../src/features/visualizer";
import { CrawlResult } from "../src/features/crawler";

describe("Visualizer", () => {
  test("generateMermaidGraph creates valid Mermaid syntax with correct nodes and edges", () => {
    const mockResults: CrawlResult[] = [
      {
        url: "https://example.com",
        status: 200,
        links: ["https://example.com/about", "https://google.com"]
      },
      {
        url: "https://example.com/about",
        status: 200,
        links: ["https://example.com"]
      }
    ];

    const graph = generateMermaidGraph(mockResults);

    // Check header
    expect(graph).toStartWith("graph TD");

    // Check nodes (N0, N1, N2 should exist)
    expect(graph).toContain('N0["/"]'); // Root
    expect(graph).toContain('N1["/about"]'); // Internal page
    expect(graph).toContain('N2("google.com/")'); // External/Unvisited

    // Check styling
    expect(graph).toContain('style N2 stroke-dasharray: 5 5,color:#666'); // Unvisited style

    // Check edges
    // N0 -> N1 (Home to About)
    expect(graph).toContain("N0 --> N1");
    // N0 -> N2 (Home to Google)
    expect(graph).toContain("N0 --> N2");
    // N1 -> N0 (About to Home)
    expect(graph).toContain("N1 --> N0");

    // Check interaction
    expect(graph).toContain('click N0 "https://example.com"');
  });

  test("generateMermaidGraph handles errors correctly", () => {
    const mockResults: CrawlResult[] = [
      {
        url: "https://example.com/broken",
        status: 404,
        links: []
      }
    ];

    const graph = generateMermaidGraph(mockResults);
    expect(graph).toContain('N0["/broken 🚨"]');
    expect(graph).toContain('style N0 fill:#ffcccc,stroke:#ff0000,stroke-width:2px');
  });
});
