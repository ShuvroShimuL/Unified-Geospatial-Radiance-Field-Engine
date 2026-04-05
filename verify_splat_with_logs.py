from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Browser console [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173", wait_until="networkidle")

        print("Waiting for Cesium to load...")
        time.sleep(5)

        # Click the OK button on the dev token panel if it exists
        try:
            ok_button = page.locator('.cesium-widget-errorPanel-button')
            if ok_button.count() > 0:
                print("Dismissing Cesium DeveloperError popup")
                ok_button.click()
        except Exception as e:
            pass

        print("Clicking Fly to Demo button")
        page.click("#demo-fly-btn", force=True)

        print("Waiting for flight and splat to load...")
        time.sleep(10)

        page.screenshot(path="/home/jules/verification/splat-demo-flown-logs.png")
        print("Done")
        browser.close()

if __name__ == "__main__":
    run()
