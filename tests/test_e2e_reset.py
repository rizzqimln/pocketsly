import time
import os
from playwright.sync_api import sync_playwright
import db

test_user = f"e2e_user_{int(time.time())}"

db.DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/pocketsly_test",
)


def fetch_otp(username):
    """The API no longer returns the OTP; read it straight from the DB."""
    with db.get_db() as conn:
        row = conn.execute(
            "SELECT otp_code FROM users WHERE LOWER(username) = LOWER(%s)",
            (username,),
        ).fetchone()
        return row[0] if row else None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1000)

    # 1. Register test user with custom email
    page.click("#landing-signin-btn")
    page.wait_for_timeout(300)
    page.click('#show-register-link')
    page.wait_for_timeout(400)
    page.fill('#reg-username', test_user)
    page.fill('#reg-password', 'initial_pass123')
    page.fill('#reg-email', f'{test_user}@example.com')
    page.click('#register-form button[type="submit"]')
    page.wait_for_selector('#display-username', timeout=5000)
    print(f'1. Registered {test_user} successfully')

    # 2. Logout
    page.wait_for_timeout(500)
    page.click('#logout-btn')
    page.wait_for_selector('#login-form', timeout=5000)
    print('2. Logged out')

    # 3. Click Forgot Password link
    page.click('#show-forgot-link')
    page.wait_for_selector('#forgot-form', timeout=5000)
    print('3. Opened Forgot Password form')

    # 4. Request OTP to Email
    page.fill('#forgot-username', test_user)
    page.click('#btn-send-otp')
    page.wait_for_selector('.toast.toast-success', timeout=5000)
    print('4. Requested OTP successfully')

    # 5. Reset password with OTP
    otp = None
    for _ in range(10):
        otp = fetch_otp(test_user)
        if otp:
            break
        time.sleep(0.5)
    assert otp, "OTP never persisted to the database"
    page.fill('#forgot-otp-code', otp)
    page.fill('#forgot-new-password', 'brand_new_secret123')
    page.fill('#forgot-confirm-password', 'brand_new_secret123')
    page.click('#forgot-form button[type="submit"]')
    page.wait_for_timeout(1000)
    toasts = page.locator('.toast').all_inner_texts()
    print('5. Toasts:', toasts)
    assert any('Password reset successfully' in t for t in toasts)

    # 6. Verify we are back on login form with username prefilled
    page.wait_for_selector('#login-form', timeout=5000)
    assert not page.locator('#login-form').is_hidden()
    assert page.input_value('#login-username') == test_user

    # 7. Sign in with new password
    page.fill('#login-password', 'brand_new_secret123')
    page.click('#login-form button[type="submit"]')
    page.wait_for_selector('#app-container', timeout=5000)
    print('6. Signed in with new password. App layout visible:', not page.locator('#app-container').is_hidden())
    assert not page.locator('#app-container').is_hidden()
    assert page.inner_text('#display-username') == test_user

    browser.close()
    print('🎉 ALL E2E BROWSER TESTS PASSED!')
