import json
import datetime
from playwright.sync_api import sync_playwright

def run_forracorp_intelligence_gathering():
    # Define the search targets (What you want it to go out there and look for)
    search_queries = [
        "Remote Machine Learning jobs",
        "Remote Front End Developer jobs React Tailwind",
        "Remote Grant Writing jobs",
        "Remote Creative Storytelling and Songwriting opportunities",
        "Remote Systems Support",
        "Remote Work",
        "Virtual Assistant jobs vacancy"
    ]
    
    findings = []
    # Initialize Playwright
    with sync_playwright() as p:
        # CRITICAL: headless=True tells the code to run without a GUI window
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="ForraCorp-Intelligence-Bot/2.0")
        page = context.new_page()
        
        try:
            # 1. Perform the crawl
            for query in search_queries:
                print(f"Scanning for: {query}...")
                # Search Google Jobs/Search. You can replace with the actual URL you are targeting
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}+last+24+hours"
                page.goto(search_url, timeout=60000)
                page.wait_for_timeout(2000) # Wait for JS to render
                
                # Extracting top 3 headers for each category
                titles = page.locator("h3").all_inner_texts()
                category_results = [t for t in titles if len(t) > 10][:3]
                findings.append({
                    "category": query.split(' ')[1:3], # Extracts keywords
                    "results": category_results
                })

            status = "Success"
            message = f"Market surveillance complete across {len(search_queries)} sectors."
            
        except Exception as e:
            status = "Failed"
            message = str(e)
            
        finally:
            # 2. Update the metadata for your website display
            timestamp = datetime.datetime.now().strftime("%B %d, %Y | %I:%M %p")
            update_data = {
                "last_update": timestamp,
                "status": status,
                "message": message,
                "findings": findings # This can be used to show actual job titles on your site
            }
            
            # 3. Save as a JSON file for the HTML to read
            with open("last_run.json", "w") as f:
                json.dump(update_data, f, indent=4)
                
            browser.close()

if __name__ == "__main__":
    run_forracorp_intelligence_gathering()

