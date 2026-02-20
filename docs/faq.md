# FAQ & Design Decisions

## Question: Will the implementation be cleaner and more robust if I replace the LLM agent helpers (eyes on terminal) with the official Playwright CLI?

**Answer:**
No, replacing the "LLM agent helpers eyes on terminal" (specifically the `explore` and `forms` commands in `src/buddy.ts` and `src/cli.ts`) with the official Playwright CLI will **not** make the implementation cleaner or more robust. In fact, it would remove the core functionality that allows an LLM agent to "see" and interact with the page.

For more details on the capabilities of this tool, please refer to the **[Usage Guide](./usage-guide.md)**.

## Key Reasons

1.  **Missing Functionality in Official CLI:** The official Playwright CLI commands (`codegen`, `test`, `open`, `screenshot`) do not have a built-in feature to output a structured text or JSON representation of the page's interactive elements (e.g., buttons, inputs, accessibility roles). This text-based "view" is essential for an LLM to understand the page state and decide on actions.
2.  **Specialized Logic:** The `buddy` tool contains custom logic (in `src/buddy.ts`) to:
    *   Traverse the DOM and identify *interactive* elements.
    *   Filter out invisible or irrelevant elements.
    *   Extract critical accessibility attributes (ARIA labels, roles) which are crucial for reliable automation.
    *   Format this data into Markdown tables or JSON for LLM consumption.
    This logic is specific to the "agent" use case and is not part of standard Playwright tools.
3.  **Robustness:** The current implementation uses `page.evaluate()` to extract data directly from the browser context. This is the most robust and performant method for bulk introspection. Trying to replicate this using standard Playwright CLI commands (which are designed for single-interaction recording or testing) would likely be slower and less effective for this specific purpose.

## Recommendation
Retain the custom `buddy` CLI tool. It acts as a necessary bridge between the raw browser automation capabilities of Playwright and the text-based interface required by an LLM agent. You could potentially improve the internal implementation (e.g., by using `page.accessibility.snapshot()` for better semantic tree extraction), but the custom CLI wrapper itself is required.
