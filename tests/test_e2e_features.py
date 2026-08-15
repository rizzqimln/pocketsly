import time
from playwright.sync_api import sync_playwright

def run():
    test_user = f"e2e_dash_{int(time.time())}"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("1. Loading application at http://localhost:8000...")
        page.goto("http://localhost:8000")
        # Guest-first design: landing page loads first, then open the sign-in modal
        page.click("#landing-signin-btn")
        page.wait_for_selector("#login-form")

        # Register a fresh user
        print(f"2. Registering fresh test user {test_user}...")
        page.wait_for_timeout(300)
        page.click("#show-register-link")
        page.wait_for_timeout(300)
        page.fill("#reg-username", test_user)
        page.fill("#reg-password", "Password123!")
        page.fill("#reg-email", f"{test_user}@test.com")
        page.click('#register-form button[type="submit"]')
        page.wait_for_selector("#view-dashboard:not(.hidden)", timeout=6000)
        print("✓ Registered & entered dashboard successfully!")

        # Verify Dashboard structure & 4 KPIs
        print("3. Verifying Dashboard structure and 4 KPIs...")
        # A brand-new account starts in the first-run onboarding state
        page.wait_for_selector("#dash-onboarding-panel", state="visible")
        # Create a first habit via the onboarding tile so the dashboard leaves
        # the new-user state and the live KPI grid renders
        page.click('a.onboarding-module-tile[href="#habits"]')
        page.wait_for_selector("#view-habits:not(.hidden)")
        page.click("#view-habits .planner-column:has-text('Habits') button:has-text('+ New Habit')")
        page.fill("#habit-title", "Morning stretch")
        page.click("#create-habit-form button[type='submit']")
        page.wait_for_timeout(800)
        page.click('a[data-view="dashboard"]')
        page.wait_for_selector("#view-dashboard:not(.hidden)")
        page.wait_for_selector("#dash-onboarding-panel", state="hidden")
        page.wait_for_selector("#dash-kpi-habits-val")
        page.wait_for_selector("#dash-kpi-tasks-val")
        page.wait_for_selector("#dash-kpi-events-val")
        page.wait_for_selector("#dash-kpi-budget-val")
        page.wait_for_selector("#dash-habits-list")
        page.wait_for_selector("#dash-tasks-list")
        page.wait_for_selector("#dash-notes-preview")
        page.wait_for_selector("#dash-events-list")
        page.wait_for_selector("#dash-budget-summary")
        print("✓ Dashboard 4 KPIs and 2-column rich widgets loaded!")

        # Test Habits & Tasks in Mobile Viewport (375x667)
        print("4. Testing Habits & Tasks view in mobile viewport (375x667)...")
        page.set_viewport_size({"width": 375, "height": 667})
        page.click("a[href='#habits']")
        page.wait_for_selector("#view-habits:not(.hidden)")

        # Verify + New Habit and + New Task buttons in column headers
        habit_add_btn = page.locator("#view-habits .planner-column:has-text('Habits') button:has-text('+ New Habit')")
        assert habit_add_btn.is_visible(), "Habit add button not visible in column header!"
        
        task_add_btn = page.locator("#view-habits .planner-column:has-text('Tasks') button:has-text('+ New Task')")
        assert task_add_btn.is_visible(), "Task add button not visible in column header!"
        print("✓ Mobile + New Habit & + New Task buttons visible in planner column headers!")

        # Test Curriculum Lab 3-section topbar & switching
        print("5. Testing Curriculum Lab 3-section topbar navigation...")
        page.set_viewport_size({"width": 1280, "height": 800})
        page.click("a[href='#curriculum']")
        page.wait_for_selector("#view-curriculum:not(.hidden)")

        # Verify 3 Section Tab Buttons
        assert page.locator(".curr-tab-btn[data-tab='hub']").is_visible()
        assert page.locator(".curr-tab-btn[data-tab='general-sec']").is_visible()
        assert page.locator(".curr-tab-btn[data-tab='frontend-sec']").is_visible()
        assert page.locator(".curr-tab-btn[data-tab='backend-sec']").is_visible()
        print("✓ 3-Section tab buttons present in topbar!")

        # Click Frontend Section filter
        page.click(".curr-tab-btn[data-tab='frontend-sec']")
        page.wait_for_timeout(200)
        assert page.locator("#curr-sec-frontend").is_visible()
        assert not page.locator("#curr-sec-general").is_visible()
        print("✓ Frontend Development section filtering works!")

        # Click Backend Section filter
        page.click(".curr-tab-btn[data-tab='backend-sec']")
        page.wait_for_timeout(200)
        assert page.locator("#curr-sec-backend").is_visible()
        assert not page.locator("#curr-sec-frontend").is_visible()
        print("✓ Backend Development section filtering works!")

        # Click All Catalog
        page.click(".curr-tab-btn[data-tab='hub']")
        page.wait_for_timeout(200)
        assert page.locator("#curr-sec-general").is_visible()
        assert page.locator("#curr-sec-frontend").is_visible()
        assert page.locator("#curr-sec-backend").is_visible()
        print("✓ All Catalog displays all 3 sections!")

        # Check Alternative Playgrounds in SQL Sandbox
        print("6. Verifying Alternative Playgrounds in SQL Sandbox...")
        page.evaluate("window.Curriculum.switchTab('db')")
        page.wait_for_selector("#curr-db:not(.hidden)")
        assert page.locator("#curr-db a:has-text('SQLite Online Playground')").is_visible()
        assert page.locator("#curr-db a:has-text('SQLime In-Browser SQLite')").is_visible()
        assert page.locator("#curr-db a:has-text('SQLZoo Interactive Challenges')").is_visible()
        assert page.locator("#curr-db a:has-text('W3Schools SQL TryIt Editor')").is_visible()
        print("✓ SQL Sandbox contains all 4 alternative online playgrounds!")

        # Check Alternative API Explorers in Backend Lab
        print("7. Verifying Alternative Playgrounds in API Explorer...")
        page.evaluate("window.Curriculum.switchTab('backend')")
        page.wait_for_selector("#curr-backend:not(.hidden)")
        assert page.locator("#curr-backend a:has-text('ReqBin Online REST Client')").is_visible()
        assert page.locator("#curr-backend a:has-text('JSONPlaceholder Mock API')").is_visible()
        assert page.locator("#curr-backend a:has-text('Postman Web Platform')").is_visible()
        print("✓ API Explorer contains alternative API testers!")

        # Check Alternative DSA Visualizers
        print("8. Verifying Alternative Playgrounds in DSA Visualizer...")
        page.evaluate("window.Curriculum.switchTab('algorithms')")
        page.wait_for_selector("#curr-algorithms:not(.hidden)")
        assert page.locator("#curr-algorithms a:has-text('VisuAlgo Interactive Visualizer')").is_visible()
        assert page.locator("#curr-algorithms a:has-text('CodePen Frontend Sandbox')").is_visible()
        assert page.locator("#curr-algorithms a:has-text('NeetCode Interactive DSA Roadmap')").is_visible()
        print("✓ Algorithms lab contains alternative DSA & code visualizers!")

        browser.close()
        print("\n🎉 ALL E2E FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
