"""E2E: Mobile Budget UX (FAB quick actions) + landing PWA install option.

Runs against a live server on http://localhost:8000 (start `python3 server.py` first).
Uses a 390x844 phone viewport to exercise the mobile-first budget layout.
"""
import time
from playwright.sync_api import sync_playwright


def test_budget_mobile_ux_and_landing_install():
    test_user = f"budget_mobile_{int(time.time())}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        page.goto('http://localhost:8000')
        page.wait_for_timeout(800)

        # ── 1. Landing: install guide section + CTA present ────────────────
        assert page.locator('#install').count() == 1
        assert page.locator('#landing-install-cta-btn').count() == 1
        assert page.locator('.ld-install-card').count() == 3
        print('1. Landing install section present (3 device cards + CTA)')

        # ── 2. beforeinstallprompt → install button triggers native prompt ──
        page.evaluate("""
            window.__promptCalled = false;
            const evt = new Event('beforeinstallprompt', { cancelable: true });
            evt.prompt = () => { window.__promptCalled = true; };
            window.dispatchEvent(evt);
        """)
        page.wait_for_timeout(200)
        page.click('#landing-install-cta-btn')
        page.wait_for_timeout(300)
        assert page.evaluate('window.__promptCalled') is True
        print('2. Install CTA fires the native PWA prompt')

        # ── 3. Register test user (guest-first, mobile viewport) ────────────
        page.click('#landing-signin-btn')
        page.wait_for_timeout(300)
        page.click('#show-register-link')
        page.wait_for_timeout(300)
        page.fill('#reg-username', test_user)
        page.fill('#reg-password', 'password123')
        page.click('#register-form button[type="submit"]')
        page.wait_for_selector('#app-container', timeout=5000)
        assert page.evaluate('Auth.currentUser && Auth.currentUser.username') == test_user
        print('3. Registered test user')

        # ── 4. Budget view via the mobile More drawer ───────────────────────
        page.click('.mobile-more-btn')
        page.wait_for_timeout(400)
        assert page.locator('#more-sheet-overlay').is_visible()
        page.click('#more-sheet-overlay .more-menu-tile:has-text("Budget")')
        page.wait_for_timeout(800)
        assert page.locator('#view-budget').is_visible()
        assert page.locator('#budget-fab').is_visible(), 'budget FAB should be visible on mobile'
        fab_box = page.locator('#budget-fab').bounding_box()
        assert fab_box is not None and fab_box['x'] >= 0 and fab_box['y'] >= 0 \
            and fab_box['x'] + fab_box['width'] <= 390 and fab_box['y'] + fab_box['height'] <= 844, \
            f'budget FAB should sit inside the 390x844 viewport, got {fab_box}'
        print('4. Budget view reached via More drawer; FAB visible inside mobile viewport')

        # ── 5. Quick actions bottom sheet opens with all 4 actions ──────────
        page.click('#budget-fab')
        page.wait_for_timeout(400)
        assert page.locator('#budget-quick-overlay').is_visible()
        for action in ('income', 'expense', 'scan', 'budget'):
            assert page.locator(f'[data-quick-action="{action}"]').count() == 1
        print('5. Quick actions sheet opened (Income / Expense / Scan / Target)')

        # ── 6. Log income via quick action ──────────────────────────────────
        page.click('[data-quick-action="income"]')
        page.wait_for_timeout(400)
        assert not page.locator('#budget-quick-overlay').is_visible()
        assert page.locator('#add-income-form').is_visible()
        page.fill('#income-source', 'Mobile Allowance')
        page.fill('#income-amount', '1000000')
        page.fill('#income-desc', 'Monthly allowance')
        page.click('#add-income-form button[type="submit"]')
        page.wait_for_timeout(1200)
        print('6. Logged income via quick action')

        # ── 7. Log expense via quick action ─────────────────────────────────
        page.click('#budget-fab')
        page.wait_for_timeout(300)
        page.click('[data-quick-action="expense"]')
        page.wait_for_timeout(400)
        assert page.locator('#add-expense-form').is_visible()
        page.fill('#expense-category', 'Transportation')
        page.fill('#expense-amount', '150000')
        page.fill('#expense-desc', 'Bus pass')
        page.click('#add-expense-form button[type="submit"]')
        page.wait_for_timeout(1200)
        print('7. Logged expense via quick action')

        # ── 8. KPIs reflect the new transactions ────────────────────────────
        income_txt = page.inner_text('#kpi-total-income')
        expense_txt = page.inner_text('#kpi-total-spent')
        assert '1.000.000' in income_txt or '1,000,000' in income_txt
        assert '150.000' in expense_txt or '150,000' in expense_txt
        print(f'8. KPIs updated: Income={income_txt}, Expense={expense_txt}')

        # ── 9. Scan quick action opens the receipt scanner ──────────────────
        page.click('#budget-fab')
        page.wait_for_timeout(300)
        page.click('[data-quick-action="scan"]')
        page.wait_for_timeout(400)
        assert page.locator('#receipt-scanner-modal').is_visible()
        page.evaluate('Budget.closeReceiptScanner()')
        page.wait_for_timeout(200)
        assert not page.locator('#receipt-scanner-modal').is_visible()
        print('9. Scan quick action opens the receipt scanner')

        # ── 10. Mobile sign-out via the More drawer returns to landing ───────
        page.click('.mobile-more-btn')
        page.wait_for_timeout(400)
        page.click('#more-sheet-overlay button:has-text("Sign Out")')
        page.wait_for_selector('#landing-container', timeout=5000)
        assert page.locator('#landing-container').is_visible()
        assert not page.locator('#app-container').is_visible()
        print('10. Sign out via More drawer returns to the landing page')

        browser.close()
        print('ALL E2E BUDGET MOBILE & INSTALL TESTS PASSED')
