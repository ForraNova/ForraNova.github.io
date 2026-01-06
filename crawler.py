import asyncio
import json
from playwright.async_api import async_playwright

async def crawl_ml_jobs():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # Search query for Remote ML jobs
        search_url = "https://www.google.com/search?q=remote+machine+learning+engineer+jobs"
        await page.goto(search_url)

        # Wait for results and extract
        await page.wait_for_selector("div.g")
        
        jobs = await page.evaluate('''() => {
            const results = [];
            document.querySelectorAll('div.g').forEach(item => {
                const title = item.querySelector('h3');
                const link = item.querySelector('a');
                if (title && link) {
                    results.push({
                        title: title.innerText,
                        url: link.href,
                        timestamp: new Date().toLocaleString()
                    });
                }
            });
            return results.slice(0, 6); // Limit to top 6 results
        }''')

        # Save to JSON
        with open('jobs.json', 'w') as f:
            json.dump(jobs, f, indent=4)

        await browser.close()
        print("Crawl complete. jobs.json updated.")

if __name__ == "__main__":
    asyncio.run(crawl_ml_jobs())