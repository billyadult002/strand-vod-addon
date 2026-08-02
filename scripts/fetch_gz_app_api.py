from playwright.sync_api import sync_playwright
import json
import time

def intercept_api():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        api_urls = []

        def handle_response(response):
            try:
                if "json" in response.headers.get("content-type", "") or "api" in response.url.lower():
                    print(f"Detected API Response: {response.url}")
                    if response.status == 200:
                        body = response.json()
                        print(f"JSON Body (snippet): {str(body)[:200]}")
                        api_urls.append(response.url)
            except Exception as e:
                pass

        page.on("response", handle_response)
        
        print("Navigating to https://gz.app ...")
        try:
            page.goto("https://gz.app", wait_until="networkidle", timeout=15000)
            time.sleep(5)  # Wait extra for dynamic content
        except Exception as e:
            print(f"Navigation error: {e}")
            
        print("Found APIs:", api_urls)
        browser.close()

if __name__ == "__main__":
    intercept_api()
