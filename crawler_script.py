import json
import datetime
import os
import requests
from playwright.sync_api import sync_playwright

def send_discord_alert(webhook_url, message):
    if not webhook_url: return
    try:
        requests.post(webhook_url, json={"content": message})
    except:
        pass

def run_forracorp_intelligence_gathering():
    DISCORD_URL = os.getenv("DISCORD_WEBHOOK_URL")
    search_queries = [
        "Remote Machine Learning jobs",
        "Remote Front End Developer jobs React Tailwind",
        "Remote Grant Writing jobs",
        "Remote Creative Storytelling and Songwriting opportunities",
        "Remote Systems Support",
        "Virtual Assistant jobs vacancy"
    ]
    
    findings = []
    total_jobs_found = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0")
        page = context.new_page()
        
        try:
            for query in search_queries:
                print(f"📡 Scanning: {query}...")
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}&tbs=qdr:d"
                page.goto(search_url, timeout=60000)
                
                # Handle Google Cookie Consent
                try:
                    page.get_by_role("button", name="Accept all").click(timeout=3000)
                except:
                    pass

                page.wait_for_timeout(2000)
                
                # BROAD SELECTOR: Grab all H3 headers (usually titles)
                titles = page.locator("h3").all()
                category_findings = []
                
                count = 0
                for title_el in titles:
                    if count >= 3: break
                    text = title_el.inner_text()
                    
                    # Ignore generic Google headers (like "People also ask")
                    if len(text) < 15 or "People also" in text: continue
                    
                    try:
                        # Find the parent link
                        link = "https://google.com"
                        parent_a = title_el.locator("xpath=./ancestor::a")
                        if parent_a.count() > 0:
                            link = parent_a.get_attribute("href")

                        category_findings.append({
                            "position": text,
                            "company": "Intelligence Source",
                            "link": link,
                            "details": "Lead identified via ForraCorp Sentinel."
                        })
                        total_jobs_found += 1
                        count += 1
                    except:
                        continue

                findings.append({"query": query, "jobs": category_findings})

            status = "Success"
        except Exception as e:
            status = "Failed"
            print(f"Error: {e}")
            
        finally:
            timestamp_display = datetime.datetime.now().strftime("%B %d, %Y | %I:%M %p")
            update_data = {
                "last_update": timestamp_display,
                "status": status,
                "total_found": total_jobs_found,
                "findings": findings
            }
            
            with open("last_run.json", "w") as f:
                json.dump(update_data, f, indent=4)
            
            if total_jobs_found > 0:
                send_discord_alert(DISCORD_URL, f"🛡️ **Intel Synced**: {total_jobs_found} leads found at {timestamp_display}")
            
            browser.close()

if __name__ == "__main__":
    run_forracorp_intelligence_gathering()
