import typer
from playwright.sync_api import sync_playwright
import sys

app = typer.Typer()

@app.callback()
def callback():
    """
    WebLens: A utility to let LLMs see web pages.
    """
    pass

@app.command()
def explore(url: str, screenshot: bool = False, show_all: bool = False):
    """
    Navigates to a URL and returns a simplified Markdown table of all interactive elements.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Smart Filtering: hidden elements are filtered out during collection

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                # Wait a bit for dynamic content if needed, though domcontentloaded is usually enough for structure
                page.wait_for_timeout(1000)
            except Exception as e:
                print(f"Error navigating to {url}: {e}", file=sys.stderr)
                browser.close()
                return

            if screenshot:
                page.screenshot(path="screenshot.png", full_page=False)
                print("Screenshot saved to screenshot.png", file=sys.stderr)

            # Selector Discovery
            # We look for interactive elements
            # Smart Filtering: We will filter out elements inside scripts/styles by default as query_selector won't pick them up usually,
            # but we must ensure we don't pick hidden ones.

            # Collect all interactive elements and their data in one go for performance
            data = page.evaluate(r"""() => {
                const elements = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='link']"));
                const visible = elements.filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
                });

                return visible.map(el => {
                    const parent = el.closest('header, nav, main, footer, form, section, article, aside');
                    let region = 'body';
                    if (parent) {
                        region = parent.tagName.toLowerCase();
                        if (parent.id) region += '#' + parent.id;
                        else if (parent.className && typeof parent.className === 'string') {
                            const classes = parent.className.trim().split(/\s+/);
                            if (classes.length > 0 && classes[0]) region += '.' + classes[0];
                        }
                    }

                    return {
                        tag: el.tagName.toLowerCase(),
                        text: (el.textContent || el.value || '').trim(),
                        id: el.id || '',
                        className: el.className || '',
                        ariaLabel: el.getAttribute('aria-label') || '',
                        region: region
                    };
                });
            }""")

            # Context Window Optimisation
            if len(data) > 50 and not show_all:
                print(f"Found {len(data)} interactive elements. Summarizing main functional areas...\n")

                # Group by region
                regions = {}
                for item in data:
                    region = item['region']
                    if region not in regions:
                        regions[region] = 0
                    regions[region] += 1

                # Print Summary Table
                print("| Functional Area | Interactive Elements Count |")
                print("|---|---|")
                # Sort by count desc
                sorted_regions = sorted(regions.items(), key=lambda item: item[1], reverse=True)
                for region, count in sorted_regions:
                    print(f"| {region} | {count} |")

            else:
                # Full Detail Table
                print("| Tag | Text/Value | ID | Class | ARIA-label |")
                print("|---|---|---|---|---|")

                for item in data:
                    tag = item['tag']
                    text = " ".join(item['text'].split())
                    if len(text) > 40:
                        text = text[:37] + "..."

                    el_id = item['id']

                    el_class = item['className']
                    if len(el_class) > 30:
                        el_class = el_class[:27] + "..."

                    aria_label = item['ariaLabel']
                    if len(aria_label) > 30:
                        aria_label = aria_label[:27] + "..."

                    print(f"| {tag} | {text} | {el_id} | {el_class} | {aria_label} |")

            browser.close()

    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

@app.command()
def forms(url: str):
    """
    Analyzes forms on the page and lists all input fields with their labels and attributes.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(1000)
            except Exception as e:
                print(f"Error navigating to {url}: {e}", file=sys.stderr)
                browser.close()
                return

            # Extract form data
            data = page.evaluate(r"""() => {
                const forms = Array.from(document.querySelectorAll('form'));
                const results = [];

                // Helper to extract input data
                function extractInputData(el) {
                    let label = '';

                    // 1. aria-label
                    if (el.getAttribute('aria-label')) {
                        label = el.getAttribute('aria-label');
                    }
                    // 2. aria-labelledby
                    else if (el.getAttribute('aria-labelledby')) {
                        const ids = el.getAttribute('aria-labelledby').split(' ');
                        label = ids.map(id => document.getElementById(id)?.textContent).join(' ');
                    }
                    // 3. label[for]
                    else if (el.id) {
                        const labelEl = document.querySelector(`label[for="${el.id}"]`);
                        if (labelEl) {
                            label = labelEl.textContent;
                        }
                    }

                    if (!label) {
                        // 4. parent label
                        const parentLabel = el.closest('label');
                        if (parentLabel) {
                            // Clone to avoid modifying DOM, remove children (like the input itself) if we want just text?
                            // Actually textContent of parent label usually includes the input value if it's text? No.
                            // It includes text nodes.
                            // Let's just take textContent and trim.
                            label = parentLabel.textContent;
                        }
                    }

                    // 5. placeholder (fallback)
                    if (!label && el.placeholder) {
                        label = el.placeholder;
                    }

                    // 6. Value/Text (for buttons)
                    if (!label && (el.tagName === 'BUTTON' || el.type === 'submit' || el.type === 'button')) {
                         label = el.textContent || el.value;
                    }

                    return {
                        tag: el.tagName.toLowerCase(),
                        type: el.type || el.tagName.toLowerCase(),
                        name: el.name || '',
                        id: el.id || '',
                        label: (label || '').trim().replace(/\s+/g, ' '),
                        required: el.required || false,
                        value: el.value || ''
                    };
                }

                // Process forms
                forms.forEach((form, index) => {
                    const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'));
                    const visibleInputs = inputs.filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0 && el.type !== 'hidden';
                    });

                    if (visibleInputs.length > 0) {
                        results.push({
                            type: 'form',
                            id: form.id || `form-${index}`,
                            name: form.getAttribute('name') || '',
                            inputs: visibleInputs.map(el => extractInputData(el))
                        });
                    }
                });

                // Process standalone inputs (not in any form)
                const allInputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
                const standaloneInputs = allInputs.filter(el => {
                     const style = window.getComputedStyle(el);
                     const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0 && el.type !== 'hidden';
                     return isVisible && !el.closest('form');
                });

                if (standaloneInputs.length > 0) {
                    results.push({
                        type: 'standalone',
                        id: 'standalone-inputs',
                        name: 'Standalone Inputs',
                        inputs: standaloneInputs.map(el => extractInputData(el))
                    });
                }

                return results;
            }""")

            if not data:
                print("No forms or interactive inputs found.")
            else:
                for group in data:
                    print(f"### {group['name']} (ID: {group['id']})")
                    print("| Label | Type | Name | ID | Required | Current Value |")
                    print("|---|---|---|---|---|---|")
                    for item in group['inputs']:
                        label = item['label']
                        if len(label) > 30: label = label[:27] + "..."

                        val = item['value']
                        if len(val) > 20: val = val[:17] + "..."

                        print(f"| {label} | {item['type']} | {item['name']} | {item['id']} | {item['required']} | {val} |")
                    print("\n")

            browser.close()

    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    app()
