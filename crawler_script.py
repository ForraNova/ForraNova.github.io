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
    
    # Targeting specific remote job boards is more reliable for DevOps bots than Google
    targets = [
        {"name": "Machine Learning", "url": "https://remoteok.com/remote-ml-jobs"},
        {"name": "Front-End / React", "url": "https://remoteok.com/remote-react-jobs"},
        {"name": "Writing / Creative", "url": "https://jobspresso.co/remote-writing-editing-jobs/"},
        {"name": "Virtual Assistant", "url": "https://jobspresso.co/remote-virtual-assistant-jobs/"}
    ]
    
    findings = []
    total_jobs_found = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        for target in targets:
            print(f"📡 Scanning Sector: {target['name']}...")
            try:
                page.goto(target['url'], timeout=60000, wait_until="domcontentloaded")
                page.wait_for_timeout(3000) # Allow JS to settle

                # Extraction logic for RemoteOK and Jobspresso (standardized)
                # We look for common link patterns in job boards
                job_links = page.locator("a[href*='/remote-jobs/'], a[href*='/job/']").all()
                
                category_findings = []
                unique_links = set()
                
                for link_el in job_links:
                    if len(category_findings) >= 3: break
                    
                    url = link_el.get_attribute("href")
                    if url.startswith("/"): url = f"https://remoteok.com{url}"
                    
                    title = link_el.inner_text().split('\n')[0].strip()
                    
                    if len(title) > 10 and url not in unique_links:
                        category_findings.append({
                            "position": title,
                            "company": "Remote Global",
                            "link": url,
                            "details": f"New {target['name']} opportunity identified."
                        })
                        unique_links.add(url)
                        total_jobs_found += 1

                findings.append({"query": target['name'], "jobs": category_findings})

            except Exception as e:
                print(f"⚠️ Failed to scan {target['name']}: {e}")
                continue

        # Metadata Update
        timestamp_display = datetime.datetime.now().strftime("%B %d, %Y | %I:%M %p")
        update_data = {
            "last_update": timestamp_display,
            "status": "Success" if total_jobs_found > 0 else "Limited Data",
            "total_found": total_jobs_found,
            "findings": findings
        }
        
        with open("last_run.json", "w") as f:
            json.dump(update_data, f, indent=4)
        
        if total_jobs_found > 0:
            send_discord_alert(DISCORD_URL, f"🛡️ **Intel Synced**: {total_jobs_found} leads found.")
            
        browser.close()

if __name__ == "__main__":
    run_forracorp_intelligence_gathering()
