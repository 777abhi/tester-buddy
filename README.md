# Tester Buddy

Tester Buddy is a CLI-based utility designed to bridge the gap between manual exploratory testing and automated browser interactions. It serves two primary audiences:
1.  **Exploratory Manual Testers**: Provides a powerful "sidekick" browser that handles repetitive tasks, state injection, and accessibility audits.
2.  **Chat LLM Agents**: Offers a text-based interface to "see" and "interact" with web pages, enabling agents to autonomously verify UI, fill forms, and validate flows without a GUI.

## Installation

```bash
git clone https://github.com/777abhi/tester-buddy.git
cd tester-buddy
npm install
npx playwright install
```

## Quick Start

**Manual Testing Sidekick:**
```bash
npm run buddy -- sidekick --url https://www.saucedemo.com/
```

**Agent Exploration:**
```bash
npm run buddy -- scout explore https://www.saucedemo.com/ --json
```

## Documentation

*   [Comprehensive Usage Guide](./docs/usage-guide.md) - Detailed instructions for Manual Testers and Agents.
*   [Examples & Scenarios](./docs/examples.md) - Real-world usage scenarios.
*   [Agent Prompt Guide](./docs/prompt-guide.md) - Instructions for prompting LLMs to use this tool.
*   [FAQ & Design Decisions](./docs/faq.md) - Common questions and architectural choices.

## License

ISC
