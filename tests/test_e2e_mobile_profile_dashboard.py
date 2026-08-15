import time
from playwright.sync_api import sync_playwright

def run():
    test_user = f"e2e_mob_{int(time.time())}"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 667})
        page = context.new_page()

        print("1. Loading app at http://localhost:8000 in mobile viewport (375x667)...")
        page.goto("http://localhost:8000")
        # Guest-first design: landing page loads first, then open the sign-in modal
        page.click("#landing-signin-btn")
        page.wait_for_selector("#login-form")

        # Register fresh test user
        print(f"2. Registering {test_user}...")
        page.wait_for_timeout(300)
        page.click("#show-register-link")
        page.wait_for_timeout(300)
        page.fill("#reg-username", test_user)
        page.fill("#reg-password", "Password123!")
        page.fill("#reg-email", f"{test_user}@test.com")
        page.click('#register-form button[type="submit"]')
        page.wait_for_selector("#view-dashboard:not(.hidden)", timeout=6000)
        print("✓ Registered & on mobile dashboard!")

        # 3. Verify mobile dashboard is streamlined & not overwhelmed
        print("3. Checking mobile dashboard streamlined layout...")
        # A new account shows the onboarding panel; create a first habit so the
        # live dashboard (habits/tasks/events cards) actually renders
        page.wait_for_selector("#dash-onboarding-panel", state="visible")
        page.click('a.onboarding-module-tile[href="#habits"]')
        page.wait_for_selector("#view-habits:not(.hidden)")
        page.click("#view-habits .planner-column:has-text('Habits') button:has-text('+ New Habit')")
        page.fill("#habit-title", "Morning stretch")
        page.click("#create-habit-form button[type='submit']")
        page.wait_for_timeout(800)
        page.click('a[data-view="dashboard"]')
        page.wait_for_selector("#view-dashboard:not(.hidden)")
        page.wait_for_selector("#dash-onboarding-panel", state="hidden")
        # Habits, Tasks, Schedule should be visible
        assert page.locator("#dash-habits-list").is_visible()
        assert page.locator("#dash-tasks-list").is_visible()
        assert page.locator("#dash-events-list").is_visible()
        
        # Desktop-only secondary widgets should be hidden on mobile
        notes_card = page.locator("#dash-notes-preview").locator("xpath=ancestor::div[contains(@class, 'card')][1]")
        budget_card = page.locator("#dash-budget-summary").locator("xpath=ancestor::div[contains(@class, 'card')][1]")
        assert not notes_card.is_visible(), "Notes preview should be hidden on mobile dashboard!"
        assert not budget_card.is_visible(), "Budget summary should be hidden on mobile dashboard!"
        print("✓ Mobile dashboard is clean, streamlined, and not overwhelmed!")

        # 4. Open profile popup via mobile bottom bar
        print("4. Testing mobile profile popup...")
        page.click("a[data-view='profile']")
        page.wait_for_selector("#profile-overlay:not(.hidden)")

        # Verify modal overlay sits above sidebar
        overlay_z = page.evaluate("window.getComputedStyle(document.getElementById('profile-overlay')).zIndex")
        sidebar_z = page.evaluate("window.getComputedStyle(document.querySelector('.sidebar')).zIndex")
        print(f"Overlay z-index: {overlay_z}, Sidebar z-index: {sidebar_z}")
        assert int(overlay_z) > int(sidebar_z), "Profile overlay z-index must be higher than sidebar!"

        # Verify form fields, Save Changes, and Sign Out buttons are visible and scrollable
        save_btn = page.locator("#profile-settings-form button[type='submit']")
        logout_btn = page.locator("#profile-logout-btn")
        assert save_btn.is_visible(), "Save Changes button must be accessible!"
        
        # Scroll to bottom of modal body
        page.evaluate("document.querySelector('#profile-overlay .modal-body').scrollTop = 9999")
        assert logout_btn.is_visible(), "Sign Out button must be accessible and not cut off!"
        print("✓ Profile popup is fully scrollable and actionable on mobile!")

        # 5. Test close profile popup
        print("5. Closing profile popup...")
        page.click("#profile-overlay .btn-icon[aria-label='Close profile']")
        page.wait_for_timeout(300)
        assert page.locator("#profile-overlay").is_hidden()
        print("✓ Profile popup closed cleanly!")

        # 6. Test desktop switch
        print("6. Testing desktop viewport expansion (1280x800)...")
        page.set_viewport_size({"width": 1280, "height": 800})
        page.wait_for_timeout(300)
        assert notes_card.is_visible(), "Notes preview should be visible on desktop!"
        assert budget_card.is_visible(), "Budget summary should be visible on desktop!"
        print("✓ Desktop dashboard displays rich 2-column layout!")

        browser.close()
        print("\n🎉 ALL MOBILE PROFILE & DASHBOARD VERIFICATION TESTS PASSED!")

if __name__ == "__main__":
    run()
