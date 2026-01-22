import json
import datetime
import os
import requests
from playwright.sync_api import sync_playwright

def send_discord_alert(webhook_url, message):
    """Sends a notification to Discord."""
    if not webhook_url:
        print("⚠️ No Discord Webhook URL found. Skipping notification.")
        return
    
    data = {"content": message}
    try:
        response = requests.post(webhook_url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ Failed to send Discord alert: {e}")

def run_forracorp_intelligence_gathering():
    # Load Webhook from Environment Variable (Set in GitHub Secrets)
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
    timestamp_log = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n--- 🛡️ Intelligence Gathering Started: {timestamp_log} ---")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Added a real User Agent to avoid being flagged as a bot
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            for query in search_queries:
                print(f"📡 Scanning: {query}...")
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}&tbs=qdr:d"
                page.goto(search_url, timeout=60000)
                
                # Handle Google Consent Pop-up if it appears
                if page.get_by_role("button", name="Accept all").is_visible():
                    page.get_by_role("button", name="Accept all").click()

                page.wait_for_timeout(2000) 

                # Wait for results or skip
                try:
                    page.wait_for_selector("div.g", timeout=5000)
                except:
                    continue

                results = page.locator("div.g").all() 
                category_findings = []
                
                for result in results[:3]: 
                    try:
                        title_el = result.locator("h3")
                        link_el = result.locator("a").first
                        
                        position = title_el.inner_text()
                        link = link_el.get_attribute("href")
                        
                        details = "No extra details."
                        if result.locator("div.VwiC3b").count() > 0:
                            details = result.locator("div.VwiC3b").first.inner_text()
                        
                        company = link.split('.')[1].capitalize() if "http" in link else "Source"

                        category_findings.append({
                            "position": position,
                            "company": company,
                            "link": link,
                            "details": details[:150] + "..." 
                        })
                        total_jobs_found += 1
                    except:
                        continue

                findings.append({"query": query, "jobs": category_findings})

            status = "Success"
            message = f"Found {total_jobs_found} new opportunities."
            
        except Exception as e:
            status = "Failed"
            message = str(e)
            print(f"❌ Error: {e}")
            
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
            
            # Send the Discord notification if jobs were found
            if total_jobs_found > 0:
                notification_text = f"🚀 **ForraCorp Intel Update**: {total_jobs_found} new jobs identified at {timestamp_display}."
                send_discord_alert(DISCORD_URL, notification_text)
            
            print(f"✅ Process Complete. Results saved.")
            browser.close()

if __name__ == "__main__":
    run_forracorp_intelligence_gathering()
