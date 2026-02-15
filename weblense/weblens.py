import typer
import asyncio
import sys
import json
import os
from typing import Optional, List, Dict, Any
from playwright.async_api import async_playwright, Page, BrowserContext, Browser

app = typer.Typer()

class WebLens:
    def __init__(self, headless: bool = True, session_path: Optional[str] = None):
        self.headless = headless
        self.session_path = session_path
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def start(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        
        if self.session_path and os.path.exists(self.session_path):
            # Load storage state if exists
            self.context = await self.browser.new_context(storage_state=self.session_path)
        else:
            self.context = await self.browser.new_context()
            
        self.page = await self.context.new_page()

    async def stop(self):
        if self.session_path and self.context:
            try:
                # Save storage state
                await self.context.storage_state(path=self.session_path)
            except Exception as e:
                print(f"Warning: Could not save session: {e}", file=sys.stderr)
            
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def navigate(self, url: str, wait_until: str = "domcontentloaded", timeout: int = 60000):
        try:
            await self.page.goto(url, wait_until=wait_until, timeout=timeout) # type: ignore
        except Exception as e:
            print(f"Error navigating to {url}: {e}", file=sys.stderr)
            raise

    async def perform_actions(self, actions: List[str]):
        """
        Executes a list of actions.
        Format: "action:selector:value"
        Examples:
        - "click:#submit"
        - "fill:#username:myuser"
        - "wait:2000"
        """
        for action_str in actions:
            parts = action_str.split(":", 2)
            action_type = parts[0]
            
            try:
                if action_type == "click":
                    selector = parts[1]
                    await self.page.click(selector)
                    # Smart wait after click
                    try:
                        await self.page.wait_for_load_state("networkidle", timeout=2000)
                    except:
                        pass # Timeout is fine, just continue
                        
                elif action_type == "fill":
                    if len(parts) < 3:
                        print(f"Error: 'fill' action requires selector and value. Got: {action_str}", file=sys.stderr)
                        continue
                    selector = parts[1]
                    value = parts[2]
                    await self.page.fill(selector, value)
                    
                elif action_type == "wait":
                    ms = int(parts[1])
                    await self.page.wait_for_timeout(ms)
                    
                print(f"Executed: {action_str}", file=sys.stderr)
                
            except Exception as e:
                print(f"Error executing {action_str}: {e}", file=sys.stderr)


    async def analyze_interactive_elements(self, show_all: bool = False) -> Dict[str, Any]:
        # Collect all interactive elements and their data
        data = await self.page.evaluate(r"""() => {
            const elements = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='link']"));
            const visible = elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
            });

            return visible.map(el => {
                const rect = el.getBoundingClientRect();
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
                    region: region,
                    box: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    }
                };
            });
        }""")
        
        return {
            "url": self.page.url,
            "title": await self.page.title(),
            "elements": data
        }

    async def analyze_forms(self) -> List[Dict[str, Any]]:
         data = await self.page.evaluate(r"""() => {
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
         return data


@app.callback()
def callback():
    """
    WebLens: A utility to let LLMs see web pages.
    """
    pass

async def _explore(url: str, screenshot: bool, show_all: bool, json_output: bool, session: Optional[str], actions: List[str]):
    lens = WebLens(session_path=session)
    try:
        await lens.start()
        await lens.navigate(url)
        
        # Perform interactions if requested
        if actions:
            await lens.perform_actions(actions)
        
        if screenshot:
            await lens.page.screenshot(path="screenshot.png", full_page=False)
            if not json_output:
                print("Screenshot saved to screenshot.png", file=sys.stderr)

        results = await lens.analyze_interactive_elements(show_all=show_all)
        
        if json_output:
            print(json.dumps(results, indent=2))
        else:
            # Legacy Markdown Output
            data = results['elements']
            if len(data) > 50 and not show_all:
                print(f"Found {len(data)} interactive elements. Summarizing main functional areas...\n")
                regions = {}
                for item in data:
                    region = item['region']
                    regions[region] = regions.get(region, 0) + 1
                
                print("| Functional Area | Interactive Elements Count |")
                print("|---|---|")
                sorted_regions = sorted(regions.items(), key=lambda item: item[1], reverse=True)
                for region, count in sorted_regions:
                    print(f"| {region} | {count} |")
            else:
                print("| Tag | Text/Value | ID | Class | ARIA-label |")
                print("|---|---|---|---|---|")
                for item in data:
                    tag = item['tag']
                    text = " ".join(item['text'].split())
                    if len(text) > 40: text = text[:37] + "..."
                    el_id = item['id']
                    el_class = item['className']
                    if len(el_class) > 30: el_class = el_class[:27] + "..."
                    aria_label = item['ariaLabel']
                    if len(aria_label) > 30: aria_label = aria_label[:27] + "..."
                    print(f"| {tag} | {text} | {el_id} | {el_class} | {aria_label} |")

    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        await lens.stop()

@app.command()
def explore(
    url: str, 
    screenshot: bool = False, 
    show_all: bool = False, 
    json_output: bool = typer.Option(False, "--json", help="Output in JSON format"),
    session: str = typer.Option(None, "--session", help="Path to session file (JSON) to save/load cookies"),
    do: List[str] = typer.Option(None, "--do", help="Action to perform: 'fill:<selector>:<text>' or 'click:<selector>' or 'wait:<ms>'")
):
    """
    Navigates to a URL and returns a simplified Markdown table or JSON of all interactive elements.
    """
    asyncio.run(_explore(url, screenshot, show_all, json_output, session, do))

async def _forms(url: str, json_output: bool, session: Optional[str]):
    lens = WebLens(session_path=session)
    try:
        await lens.start()
        await lens.navigate(url)
        data = await lens.analyze_forms()
        
        if json_output:
            print(json.dumps(data, indent=2))
        else:
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
    except Exception as e:
         print(f"An error occurred: {e}", file=sys.stderr)
         sys.exit(1)
    finally:
        await lens.stop()

@app.command()
def forms(
    url: str,
    json_output: bool = typer.Option(False, "--json", help="Output in JSON format"),
    session: str = typer.Option(None, "--session", help="Path to session file (JSON) to save/load cookies"),
):
    """
    Analyzes forms on the page and lists all input fields with their labels and attributes.
    """
    asyncio.run(_forms(url, json_output, session))

if __name__ == "__main__":
    app()
