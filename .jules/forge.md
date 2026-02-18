## 2025-02-17 - Dynamic Configuration
Decision: Implement configuration loading via `src/config.ts` and inject it into `Buddy` class.
Reasoning: To replace hardcoded values for cookies and local storage, allowing users to customize the tool without code changes. This is a foundational step for future features like network mocking.
Constraint: Ensure backward compatibility or graceful handling if the configuration file is missing.

## 2025-02-17 - Network Mocking
Decision: Implement network interception via `page.route()` driven by `buddy.config.json`.
Reasoning: Enables testing of edge cases and specific data states without backend dependency, a critical feature for robust exploratory testing.
Constraint: Ensure `applyMocks` handles multiple mocks correctly and falls back to network if methods do not match.

## 2025-02-18 - Crawler Integration
Decision: Implement `crawl` feature within `Buddy` class using Breadth-First Search (BFS) and queue.
Reasoning: Simple and effective way to map site structure and find broken links without complex recursive state management.
Constraint: Ensure `visited` set normalizes URLs (stripping fragments) to avoid duplicate crawling.

## 2025-02-18 - Network & Console Monitoring
Decision: Integrated passive monitoring of console errors and network failures (4xx/5xx) into `BrowserManager`.
Reasoning: Allows agents and testers to catch "invisible" bugs that don't manifest in the UI but indicate underlying issues. This is exposed via the `--monitor-errors` flag.
Constraint: Ensure monitoring is optional and errors are collected silently until the exploration step completes, preventing interruption of partial flows unless explicitly checked.

## 2025-02-18 - Visual Sitemap Generator
Decision: Implemented `generateMermaidGraph` as a pure function utility in `src/features/visualizer.ts` decoupled from `Crawler` logic.
Reasoning: Keeps core crawling logic clean and focused on data collection. Visualization is treated as a presentation layer transformation.
Constraint: Large crawl results might generate huge Mermaid graphs; future improvements should consider pagination or file output.
