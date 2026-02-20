# Tester Buddy

Tester Buddy is a CLI-based utility designed to bridge the gap between manual exploratory testing and automated browser interactions. It empowers both human testers and autonomous AI agents to explore, test, and validate web applications efficiently.

## Key Capabilities

-   **For Manual Testers**: Acts as a "sidekick" browser that handles repetitive tasks (like login bypass), manages data seeding, and performs on-demand accessibility and error audits.
-   **For AI Agents**: Provides a structured text-based interface to "see" and "interact" with web pages, enabling autonomous exploration, form filling, and test generation.

## Documentation

The documentation has been consolidated into the `docs` folder for better organization:

-   **[Usage Guide](./docs/usage-guide.md)**: The primary manual covering installation, getting started, and detailed feature usage for both manual testers and agents.
-   **[Examples](./docs/examples.md)**: A collection of real-world scenarios and recipes to help you get the most out of Tester Buddy.
-   **[Agent Prompt Guide](./docs/prompt-guide.md)**: Specific instructions and workflows designed for LLM agents using this tool.
-   **[FAQ & Design Decisions](./docs/faq.md)**: Answers to common questions and explanations of architectural choices.

## Quick Start

1.  **Install**:
    ```bash
    npm install
    ```
2.  **Run Help**:
    ```bash
    npm run buddy -- help
    ```

For detailed setup and usage, please refer to the **[Usage Guide](./docs/usage-guide.md)**.
