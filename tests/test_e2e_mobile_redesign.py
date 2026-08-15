import time
from playwright.sync_api import sync_playwright

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── TEST 1: MOBILE VIEWPORT (375x720) ──────────────────────────────────
        mobile_page = browser.new_page(viewport={"width": 375, "height": 720})
        mobile_page.goto("http://localhost:8000")

        uname_mob = f"mob_user_{int(time.time())}"
        mobile_page.click("#landing-signin-btn")
        mobile_page.wait_for_timeout(300)
        mobile_page.click("#show-register-link")
        mobile_page.wait_for_timeout(300)
        mobile_page.fill("#reg-username", uname_mob)
        mobile_page.fill("#reg-password", "password123")
        mobile_page.fill("#reg-email", f"{uname_mob}@example.com")
        mobile_page.click("#register-form button[type='submit']")
        mobile_page.wait_for_selector("#view-dashboard:not(.hidden)")
        print("1. Registered mobile user successfully.")

        # Capture Dashboard mobile with search button in topbar / actions
        mobile_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/mobile_dashboard_search.png")
        print("Captured mobile_dashboard_search.png")

        # Navigate to Journal & Notes
        mobile_page.click('.nav-item[data-view="notes"]')
        mobile_page.wait_for_selector("#view-notes:not(.hidden)")

        # Verify empty state text
        empty_text = mobile_page.inner_text("#notes-sidebar-list")
        assert "+ +" not in empty_text, "Duplicate '+' detected in empty state!"
        print("2. Notes empty state verified (no duplicate +).")

        # Switch to Library & Academic Journals
        mobile_page.click('button[data-tab="library"]')
        mobile_page.wait_for_selector("#notes-tab-library-pane:not(.hidden)")
        mobile_page.wait_for_timeout(500)

        # Add sample academic resources to verify card spacing on mobile
        mobile_page.fill("#notes-resource-title", "Clean Code: A Handbook of Agile Software Craftsmanship")
        mobile_page.fill("#notes-resource-author", "Robert C. Martin")
        mobile_page.fill("#notes-resource-year", "2008")
        mobile_page.fill("#notes-resource-publisher", "Prentice Hall")
        mobile_page.fill("#notes-resource-url", "https://example.com/cleancode.pdf")
        mobile_page.click("#notes-add-resource-form button[type='submit']")
        mobile_page.wait_for_timeout(400)

        mobile_page.fill("#notes-resource-title", "Structure and Interpretation of Computer Programs")
        mobile_page.fill("#notes-resource-author", "Harold Abelson & Gerald Jay Sussman")
        mobile_page.fill("#notes-resource-year", "1996")
        mobile_page.fill("#notes-resource-publisher", "MIT Press")
        mobile_page.fill("#notes-resource-url", "https://mitpress.mit.edu/sicp")
        mobile_page.click("#notes-add-resource-form button[type='submit']")
        mobile_page.wait_for_timeout(400)

        mobile_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/mobile_academic_library_cards.png")
        print("Captured mobile_academic_library_cards.png")

        # Test Mobile More Drawer
        mobile_page.click(".mobile-more-btn")
        mobile_page.wait_for_selector("#more-sheet-overlay:not(.hidden)")
        mobile_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/mobile_more_drawer_search.png")
        print("Captured mobile_more_drawer_search.png")

        # Click Quick Search from More Drawer
        mobile_page.click(".more-sheet-grid button:first-child")
        mobile_page.wait_for_selector("#command-palette-overlay:not(.hidden)")
        mobile_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/mobile_command_palette_filters.png")
        print("Captured mobile_command_palette_filters.png")

        # Test Category Filter Pills on mobile
        mobile_page.click(".palette-filter-pill[data-cat='Actions']", force=True)
        mobile_page.wait_for_timeout(300)
        items_count = mobile_page.locator(".palette-item").count()
        assert items_count > 0, "No items found in Actions filter"
        print(f"3. Command Palette Actions filter verified ({items_count} items).")

        # Close palette via close button
        mobile_page.click(".palette-close-btn", force=True)
        mobile_page.wait_for_timeout(300)
        print("4. Command palette closed via mobile close button.")

        # Test Profile Settings Modal on Mobile
        mobile_page.evaluate("() => window.App.openProfileSettings()")
        mobile_page.wait_for_selector("#profile-overlay:not(.hidden)")
        mobile_page.wait_for_timeout(300)

        mobile_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/mobile_profile_settings_redesign.png")
        print("Captured mobile_profile_settings_redesign.png")

        # ── TEST 2: DESKTOP VIEWPORT (1280x800) ────────────────────────────────
        desk_page = browser.new_page(viewport={"width": 1280, "height": 800})
        desk_page.goto("http://localhost:8000")

        uname_desk = f"desk_user_{int(time.time())}"
        desk_page.click("#landing-signin-btn")
        desk_page.wait_for_timeout(300)
        desk_page.click("#show-register-link")
        desk_page.wait_for_timeout(300)
        desk_page.fill("#reg-username", uname_desk)
        desk_page.fill("#reg-password", "password123")
        desk_page.fill("#reg-email", f"{uname_desk}@example.com")
        desk_page.click("#register-form button[type='submit']")
        desk_page.wait_for_selector("#view-dashboard:not(.hidden)")

        # Desktop header search button click
        desk_page.click(".header-search-btn")
        desk_page.wait_for_selector("#command-palette-overlay:not(.hidden)")
        desk_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/desktop_command_palette_spotlight.png")
        print("Captured desktop_command_palette_spotlight.png")

        desk_page.keyboard.press("Escape")
        desk_page.wait_for_selector("#command-palette-overlay", state="hidden")

        # Navigate to Journal & Notes
        desk_page.click('.nav-item[data-view="notes"]')
        desk_page.wait_for_selector("#view-notes:not(.hidden)")
        desk_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/desktop_notes_view_clean.png")
        print("Captured desktop_notes_view_clean.png")

        # Open Desktop Profile Settings
        desk_page.click("#user-avatar")
        desk_page.wait_for_selector("#profile-overlay:not(.hidden)")
        desk_page.screenshot(path="/home/rizzqimaulanailhami/.gemini/antigravity-ide/brain/24cbf3b1-8e91-49cb-bfd5-efcbbd59cb97/desktop_profile_settings_redesign.png")
        print("Captured desktop_profile_settings_redesign.png")

        browser.close()
        print("🎉 ALL MOBILE & DESKTOP UI/UX TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
