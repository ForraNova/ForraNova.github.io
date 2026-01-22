import json
import datetime
import time
import schedule
from playwright.sync_api import sync_playwright

def run_forracorp_intelligence_gathering():
    search_queries = [
        "Remote Machine Learning jobs",
        "Remote Front End Developer jobs React Tailwind",
        "Remote Grant Writing jobs",
        "Remote Creative Storytelling and Songwriting opportunities",
        "Remote Systems Support",
        "Virtual Assistant jobs vacancy"
    ]
    
    findings = []
    timestamp_log = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n--- 🛡️ Intelligence Gathering Started: {timestamp_log} ---")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="ForraCorp-Intelligence-Bot/3.0")
        page = context.new_page()
        
        try:
            for query in search_queries:
                print(f"📡 Scanning: {query}...")
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}+last+24+hours"
                page.goto(search_url, timeout=60000)
                page.wait_for_timeout(3000) # Give it time to load

                # Locate the result blocks
                # Note: Google's CSS classes change, so we look for 'h3' and its parent containers
                results = page.locator("div.g").all() # 'div.g' is the standard Google result container
                
                category_findings = []
                for result in results[:3]: # Get top 3 per category
                    try:
                        title_el = result.locator("h3")
                        link_el = result.locator("a").first
                        
                        # Get Position (Title) and Link
                        position = title_el.inner_text()
                        link = link_el.get_attribute("href")
                        
                        # Extract "Details" (Snippet text)
                        details = result.locator("div[style*='-webkit-line-clamp']").inner_text() or "No extra details."
                        
                        # Logic to guess Company Name (often in the URL or the first part of the snippet)
                        # For a true job site, we'd target specific IDs, but for Google Search:
                        company = link.split('.')[1].capitalize() if "http" in link else "Unknown"

                        category_findings.append({
                            "position": position,
                            "company": company,
                            "link": link,
                            "details": details[:150] + "..." # Truncate for clean JSON
                        })
                    except:
                        continue

                findings.append({
                    "query": query,
                    "jobs": category_findings
                })

            status = "Success"
            message = "Intelligence loop closed. Data synchronized."
            
        except Exception as e:
            status = "Failed"
            message = str(e)
            print(f"❌ Error: {e}")
            
        finally:
            timestamp_display = datetime.datetime.now().strftime("%B %d, %Y | %I:%M %p")
            update_data = {
                "last_update": timestamp_display,
                "status": status,
                "message": message,
                "findings": findings
            }
            
            with open("last_run.json", "w") as f:
                json.dump(update_data, f, indent=4)
            
            print(f"✅ JSON Updated. Next run in 3 hours.")
            browser.close()

# --- THE 3-HOUR SENTINEL SCHEDULE ---
times = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]

for t in times:
    schedule.every().day.at(t).do(run_forracorp_intelligence_gathering)

if __name__ == "__main__":
    # Optional: Run once immediately on start to verify
    run_forracorp_intelligence_gathering()
    
    print(f"Sentinel Crawler Active. Waiting for schedule: {times}")
    while True:
        schedule.run_pending()
        time.sleep(30) # Check every 30 seconds
