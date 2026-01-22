import json
import datetime
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
        # headless=True is mandatory for GitHub Actions
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="ForraCorp-Intelligence-Bot/3.0")
        page = context.new_page()
        
        try:
            for query in search_queries:
                print(f"📡 Scanning: {query}...")
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}+last+24+hours"
                page.goto(search_url, timeout=60000)
                page.wait_for_timeout(3000) 

                results = page.locator("div.g").all() 
                
                category_findings = []
                for result in results[:3]: 
                    try:
                        title_el = result.locator("h3")
                        link_el = result.locator("a").first
                        
                        position = title_el.inner_text()
                        link = link_el.get_attribute("href")
                        
                        # Snippet/Details extraction
                        details = "No extra details."
                        snippet_selectors = ["div.VwiC3b", "div[style*='-webkit-line-clamp']"]
                        for selector in snippet_selectors:
                            if result.locator(selector).count() > 0:
                                details = result.locator(selector).first.inner_text()
                                break
                        
                        company = link.split('.')[1].capitalize() if "http" in link else "Source"

                        category_findings.append({
                            "position": position,
                            "company": company,
                            "link": link,
                            "details": details[:150] + "..." 
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
            
            print(f"✅ JSON Updated at {timestamp_display}.")
            browser.close()

if __name__ == "__main__":
    # GitHub Actions calls the script, it runs once, saves the JSON, and exits.
    run_forracorp_intelligence_gathering()
