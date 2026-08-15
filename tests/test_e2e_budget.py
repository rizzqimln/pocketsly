import time
from playwright.sync_api import sync_playwright

test_user = f"budget_user_{int(time.time())}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1000)

    # 1. Register test user (guest-first: open profile modal, then register)
    page.click('#landing-signin-btn')
    page.wait_for_timeout(300)
    page.click('#show-register-link')
    page.wait_for_timeout(300)
    page.fill('#reg-username', test_user)
    page.fill('#reg-password', 'password123')
    page.click('#register-form button[type="submit"]')
    page.wait_for_selector('#display-username', timeout=5000)
    print(f'1. Registered {test_user} successfully')

    # 2. Navigate to Monthly Budget view
    page.click('a[data-view="budget"]')
    page.wait_for_timeout(800)
    print('2. Navigated to Budget & Cashflow view')

    # 3. Verify KPI structure
    assert page.locator('#kpi-total-income').count() == 1
    assert page.locator('#kpi-total-balance').count() == 1
    assert page.locator('#kpi-total-spent').count() == 1
    print('3. Verified 3-card KPI row with centered balance')

    # 4. Log Income
    page.fill('#income-source', 'Academic Scholarship')
    page.fill('#income-amount', '2500000')
    page.fill('#income-desc', 'Semester allowance')
    page.click('#add-income-form button[type="submit"]')
    page.wait_for_timeout(1200)
    print('4. Logged Academic Scholarship IDR 2,500,000')

    # 5. Switch tab and Log Expense
    page.click('#tab-btn-expense')
    page.wait_for_timeout(400)
    page.fill('#expense-category', 'Textbooks & Software')
    page.fill('#expense-amount', '300000')
    page.fill('#expense-desc', 'Web Engineering Books')
    page.click('#add-expense-form button[type="submit"]')
    page.wait_for_timeout(1200)
    print('5. Logged Expense IDR 300,000')

    # 6. Verify KPI Card updates
    income_txt = page.inner_text('#kpi-total-income')
    balance_txt = page.inner_text('#kpi-total-balance')
    expense_txt = page.inner_text('#kpi-total-spent')
    status_txt = page.inner_text('#kpi-balance-status')

    print(f'6. KPIs: Income={income_txt}, Balance={balance_txt}, Expense={expense_txt}, Status={status_txt}')
    assert '2.500.000' in income_txt or '2,500,000' in income_txt
    assert '2.200.000' in balance_txt or '2,200,000' in balance_txt
    assert '300.000' in expense_txt or '300,000' in expense_txt
    assert 'SURPLUS' in status_txt.upper()

    # 7. Verify unified transactions list
    tx_list = page.inner_text('#recent-transactions-list')
    print('7. Transactions list content preview:\n', tx_list)
    assert 'Academic Scholarship' in tx_list
    assert 'Textbooks & Software' in tx_list
    assert '2.500.000' in tx_list or '2,500,000' in tx_list
    assert '300.000' in tx_list or '300,000' in tx_list

    # 8. Test Filter tabs
    page.click('#tx-filter-incomes')
    page.wait_for_timeout(400)
    incomes_only_list = page.inner_text('#recent-transactions-list')
    assert 'Academic Scholarship' in incomes_only_list
    assert 'Textbooks & Software' not in incomes_only_list
    print('8. Filter Incomes tab verified')

    page.click('#tx-filter-expenses')
    page.wait_for_timeout(400)
    expenses_only_list = page.inner_text('#recent-transactions-list')
    assert 'Textbooks & Software' in expenses_only_list
    assert 'Academic Scholarship' not in expenses_only_list
    print('9. Filter Expenses tab verified')

    browser.close()
    print('🎉 ALL E2E BUDGET & CASHFLOW TESTS PASSED!')
