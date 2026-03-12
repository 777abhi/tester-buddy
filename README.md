# Tester Buddy

Tester Buddy is a CLI-based utility designed to bridge the gap between manual exploratory testing and automated browser interactions. It empowers both human testers and autonomous AI agents to explore, test, and validate web applications efficiently.

## Key Capabilities

-   **For Manual Testers**: Acts as a "sidekick" browser that handles repetitive tasks (like login bypass), manages data seeding, and performs on-demand accessibility and error audits.
-   **For AI Agents**: Provides a structured text-based interface to "see" and "interact" with web pages, enabling autonomous exploration, form filling, and test generation.

## Documentation

The documentation is organized by user role:

-   **[Manual Tester Guide](./docs/manual/README.md)**: For QA engineers using the tool interactively.
    -   [Step-by-Step Walkthrough](./docs/manual/walkthrough.md)
    -   [Examples](./docs/manual/examples.md)
-   **[LLM Agent Guide](./docs/agent/README.md)**: For AI agents and developers building them.
    -   [Agent Tasks Walkthrough](./docs/agent/walkthrough.md)
    -   [Agent Examples](./docs/agent/examples.md)

**Shared Resources**:
-   **[Configuration](./docs/common/configuration.md)**: How to set up roles, mocks, and seeding.
-   **[FAQ](./docs/common/faq.md)**: Common questions and design decisions.

## Quick Start

1.  **Install**:
    ```bash
    npm install
    ```
2.  **Run Help**:
    ```bash
    npm run buddy -- help
    ```

For detailed setup and usage, please refer to the specific guide for your role above.

## Roadmap

-   **AI-Powered Test Generation**: Easily generate Playwright test suites via LLM prompts from exploration sessions using the `--prompt` option in `codegen`, or generate the test directly using the `--llm` flag. Supported via OpenAI API, Anthropic API (Claude), or local Ollama instances.
-   **Architecture**: The codebase uses a Unified Action Architecture (Command Pattern) for parsing and executing CLI actions.
-   **Status Update**: Supported defining fallback logic directly within the `RetryAction` string via `retry:<count>:[interval:]<action>:[fallback_action]` for custom recovery strategies if the target action fails.
-   **Status Update**: Implemented exponential backoff for the wait interval in `RetryAction` to provide more robust handling of temporary network or performance delays.
-   **Status Update**: Added support for dynamic jitter in exponential backoff to avoid thundering herd problems in concurrent test execution or aggressive scraping.
-   **Status Update**: Added support for dynamic fallback policies in `RetryAction`, enabling the execution of specific recovery actions based on the encountered error message, alongside a catch-all default fallback.
-   **Future Improvement**: Develop an intelligent test flakiness analyzer that leverages ML or historical data to automatically tune retry limits, exponential backoff bases, and dynamic fallback strategies.
