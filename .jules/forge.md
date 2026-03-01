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

## 2025-02-18 - Performance Metrics
Decision: Implemented `PerformanceMonitor` class decoupled from `Explorer` to capture Core Web Vitals and Navigation Timing.
Reasoning: Separation of concerns allows `Explorer` to focus on DOM structure while `PerformanceMonitor` handles timing and resource metrics. Used `page.evaluate` to bridge to `window.performance`.
Constraint: Initial implementation uses Navigation Timing Level 2 but falls back to Level 1. LCP/CLS are approximated via `paint` entries and `navigation` timing for this MVP.

## 2025-02-18 - Test Code Generation (Codegen)
Decision: Implemented `SessionManager` to handle custom session format (state + history) and `CodeGenerator` to transform history into Playwright test scripts.
Reasoning: Enables agents and manual testers to convert exploration sessions into permanent test artifacts, bridging the gap between exploration and regression testing.
Constraint: `scout explore` now records every `goto` and `--do` action when `--session` is used. The `CodeGenerator` handles basic deduplication of consecutive navigations.

## 2025-02-21 - Smart Form Fuzzing
Decision: Implemented `Fuzzer` class that uses `FormAnalyzer` to identify inputs and injects common attack vectors (SQLi, XSS, Buffer Overflow) to crash-test forms.
Reasoning: Provides automated security/stability testing for agents. Implemented as a separate feature `scout fuzz` to avoid cluttering `explore`.
Constraint: Relies on page reload or navigation handling to reset state between payloads. Current implementation assumes simple forms and re-finds them by index or ID.

## 2025-02-23 - Semantic Test Generation
Decision: Enhanced `ActionExecutor` to return `ActionResult` containing semantic locators (e.g., `getByRole`) derived at runtime via `page.evaluate`, and updated `CodeGenerator` to prioritize these over CSS selectors.
Reasoning: CSS selectors are brittle and prone to breakage. Semantic locators (Role, Text, Label) are more robust and align with Playwright best practices, creating higher-quality tests for users.
Constraint: The semantic detection logic runs inside `page.evaluate` and must handle various element types and attributes gracefully without crashing the browser context.

## 2025-02-23 - Visual Regression Check
Decision: Implemented `VisualMonitor` class using `pixelmatch` and `pngjs` to support pixel-perfect visual comparison.
Reasoning: Enables automated visual regression testing for both manual testers and agents, catching CSS/layout issues that functional tests miss.
Constraint: Requires exact image dimensions for `pixelmatch`. Current implementation assumes exact match for strictness.

## 2025-02-24 - Unified Action Architecture
Decision: Refactored `ActionExecutor` and `CodeGenerator` to use a Command Pattern via `ActionParser` and `Action` interface.
Reasoning: Eliminates duplicated parsing logic and ensures that executed actions and generated code always match. Simplifies adding new action types in the future by encapsulating parsing, execution, and codegen in a single class.
Constraint: Maintained backward compatibility for action strings, which limits support for colons in CSS selectors within the `fill` command (e.g., `fill:div:nth-child(2):value` is tricky).

## 2025-02-25 - Quoted Action Parameters
Decision: Enhanced `ActionParser` to support quoted parameters (e.g., `fill:"div:nth-child(2)":value`) via `parseParams` and `unquote` helpers.
Reasoning: To resolve the limitation where colons in selectors (like pseudo-classes) broke the command parsing. This allows for robust interaction with complex DOM structures.
Constraint: Ensured backward compatibility for existing unquoted commands by falling back to the original split-by-first-colon logic if quotes are absent.

## 2025-02-26 - Control Flow Actions
Decision: Implemented `LoopAction` and `ConditionAction` in `ActionParser` using recursive parsing and `peelParam` helper.
Reasoning: Enables agents to perform repetitive tasks or conditional logic (e.g., closing a banner if it exists) without a full feedback loop.
Constraint: Actions nested within loops or conditions must be carefully quoted if they contain colons.

## 2025-02-27 - Self-Healing Selectors
Decision: Implemented `Healer` class and integrated it into `ActionExecutor.performActions`.
Reasoning: Automatically recovers from brittle selectors (e.g., IDs or classes that change) by applying heuristics (like text or attributes) to find the intended element when the original selector fails. Improves robustness against UI changes.
Constraint: The heuristic approach relies on `page.evaluate` and simple DOM traversal; it might select unintended elements if the extracted keyword is too generic.
