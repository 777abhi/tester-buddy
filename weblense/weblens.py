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
def explore(url: str, screenshot: bool = False):
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
            if len(data) > 50:
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

if __name__ == "__main__":
    app()
