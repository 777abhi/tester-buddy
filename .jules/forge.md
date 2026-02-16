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
