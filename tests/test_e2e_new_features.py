import time
import os
from playwright.sync_api import sync_playwright

test_user = f"newfeat_{int(time.time())}"

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
    page.fill('#reg-email', f"{test_user}@example.com")
    page.click('#register-form button[type="submit"]')
    page.wait_for_selector('#display-username', timeout=5000)
    print(f'1. Registered user {test_user} successfully')

    # =========================================================================
    # FEATURE 1: CLEAN NUMERIC BUDGET TRACKING
    # =========================================================================
    page.click('a[data-view="budget"]')
    page.wait_for_timeout(800)
    print('2. Navigated to Budget & Cash Flow')

    # Log income 5000000 and expense 1200000
    page.fill('#income-source', 'Monthly Salary')
    page.fill('#income-amount', '5000000')
    page.click('#add-income-form button[type="submit"]', force=True)
    page.wait_for_timeout(1000)

    page.evaluate("() => Budget.switchFormTab('expense')")
    page.wait_for_timeout(300)
    page.fill('#expense-category', 'Groceries & Supplies')
    page.fill('#expense-amount', '1200000')
    page.click('#add-expense-form button[type="submit"]', force=True)
    page.wait_for_timeout(1000)

    # Verify clean numeric display without currency prefixes
    kpi_inc = page.inner_text('#kpi-total-income')
    kpi_bal = page.inner_text('#kpi-total-balance')
    print(f'3. Clean KPI display: Income={kpi_inc}, Balance={kpi_bal}')
    assert '5,000,000' in kpi_inc or '5000000' in kpi_inc
    assert '3,800,000' in kpi_bal or '3800000' in kpi_bal

    # =========================================================================
    # FEATURE 2: RECEIPT SCANNER IN MONTHLY BUDGET
    # =========================================================================
    # Open Receipt Scanner from top button
    page.click('.budget-top-bar button:has-text("Scan Receipt")', force=True)
    page.wait_for_timeout(600)

    scanner_modal = page.locator('#receipt-scanner-modal')
    assert not scanner_modal.get_attribute('class').count('hidden')
    print('9. Receipt Scanner modal opened successfully')

    # Create dummy receipt image file for upload test
    dummy_img_path = '/tmp/starbucks_coffee_receipt.png'
    with open(dummy_img_path, 'wb') as f:
        # 1x1 valid PNG bytes
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')

    # Upload receipt file
    file_input = page.locator('#receipt-file-input')
    file_input.set_input_files(dummy_img_path)
    page.wait_for_timeout(1200)

    # Verify Results View is displayed with OCR extracted details
    assert not page.locator('#receipt-results-view').get_attribute('class').count('hidden')
    parsed_merchant = page.input_value('#receipt-parsed-merchant')
    parsed_amt = page.input_value('#receipt-parsed-amount')
    parsed_cat = page.input_value('#receipt-parsed-category')

    print(f'10. OCR Extracted details: Merchant={parsed_merchant}, Amount={parsed_amt}, Category={parsed_cat}')
    assert 'Starbucks' in parsed_merchant or 'Coffee' in parsed_merchant or len(parsed_merchant) > 0
    assert len(parsed_amt) > 0

    # Click Apply to Expense Form
    page.click('#receipt-results-view button:has-text("Apply to Expense Form")', force=True)
    page.wait_for_timeout(800)

    # Verify Scanner closed and Log Expense form populated
    assert scanner_modal.get_attribute('class').count('hidden') > 0
    exp_amt = page.input_value('#expense-amount')
    exp_desc = page.input_value('#expense-desc')
    print(f'11. Applied to Expense Form: Amount={exp_amt}, Desc={exp_desc}')
    assert len(exp_amt) > 0
    assert 'Starbucks' in exp_desc or 'Receipt' in exp_desc

    # Submit expense from scanned receipt
    page.click('#add-expense-form button[type="submit"]', force=True)
    page.wait_for_timeout(1000)
    print('12. Successfully submitted expense logged from scanned receipt')

    # =========================================================================
    # FEATURE 3: ACADEMIC CITATION GENERATOR IN LIBRARY & JOURNALS
    # =========================================================================
    page.click('a[data-view="notes"]')
    page.wait_for_timeout(800)
    print('13. Navigated to Journal & Notes view')

    # Switch to Library tab
    page.click('.notes-main-tab[data-tab="library"]', force=True)
    page.wait_for_timeout(800)
    print('14. Switched to Academic Library pane')

    # Add Academic Paper with Citation Metadata
    page.fill('#notes-resource-title', 'Design Patterns: Elements of Reusable Object-Oriented Software')
    page.fill('#notes-resource-author', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides')
    page.fill('#notes-resource-year', '1994')
    page.fill('#notes-resource-publisher', 'Addison-Wesley Professional')
    page.fill('#notes-resource-doi', '10.5555/275330')
    page.select_option('#notes-resource-type', 'book')
    page.select_option('#notes-resource-category', 'backend')
    page.fill('#notes-resource-notes', 'Foundational gang of four design patterns')
    page.click('#notes-add-resource-form button[type="submit"]', force=True)
    page.wait_for_timeout(1200)
    print('15. Added GoF Design Patterns book with citation metadata')

    # Find the added resource card and click Cite button
    page.locator('.resource-card', has_text='Design Patterns').locator('button:has-text("Cite")').click(force=True)
    page.wait_for_timeout(800)

    citation_modal = page.locator('#citation-modal')
    assert not citation_modal.get_attribute('class').count('hidden')
    print('16. Citation Generator modal opened')

    # Test APA 7 style
    apa_txt = page.inner_text('#citation-preview-box')
    print(f'17. APA 7 Citation preview:\n{apa_txt}')
    assert '1994' in apa_txt
    assert 'Design Patterns' in apa_txt or 'Gamma' in apa_txt

    # Test IEEE style
    page.click('.citation-tab-btn[data-style="ieee"]', force=True)
    page.wait_for_timeout(300)
    ieee_txt = page.inner_text('#citation-preview-box')
    print(f'18. IEEE Citation preview:\n{ieee_txt}')
    assert 'Addison-Wesley' in ieee_txt or '1994' in ieee_txt

    # Test BibTeX style
    page.click('.citation-tab-btn[data-style="bibtex"]', force=True)
    page.wait_for_timeout(300)
    bib_txt = page.inner_text('#citation-preview-box')
    print(f'19. BibTeX preview:\n{bib_txt}')
    assert '@book' in bib_txt or '@article' in bib_txt
    assert 'author' in bib_txt.lower()
    assert 'year' in bib_txt.lower()

    # Test MLA 9 style
    page.click('.citation-tab-btn[data-style="mla"]', force=True)
    page.wait_for_timeout(300)
    mla_txt = page.inner_text('#citation-preview-box')
    print(f'20. MLA 9 preview:\n{mla_txt}')
    assert '1994' in mla_txt

    # Test Chicago 17 style
    page.click('.citation-tab-btn[data-style="chicago"]', force=True)
    page.wait_for_timeout(300)
    chicago_txt = page.inner_text('#citation-preview-box')
    print(f'21. Chicago 17 preview:\n{chicago_txt}')
    assert '1994' in chicago_txt

    # Test Harvard style
    page.click('.citation-tab-btn[data-style="harvard"]', force=True)
    page.wait_for_timeout(300)
    harvard_txt = page.inner_text('#citation-preview-box')
    print(f'22. Harvard preview:\n{harvard_txt}')
    assert '1994' in harvard_txt

    # Test Insert to Note
    page.click('#citation-modal button:has-text("Insert to Note")', force=True)
    page.wait_for_timeout(800)

    # Verify switched to Notes editor and citation text was inserted into note body
    assert citation_modal.get_attribute('class').count('hidden') > 0
    note_body = page.input_value('#note-body-input')
    print(f'23. Inserted Citation in note editor:\n{note_body}')
    assert 'Citation:' in note_body
    assert '1994' in note_body

    # Save note with citation
    page.fill('#note-title-input', 'Study Notes: Software Architecture & Patterns')
    page.click('#save-note-btn', force=True)
    page.wait_for_timeout(1000)
    print('24. Successfully saved Note containing generated Academic Citation!')

    browser.close()
    if os.path.exists(dummy_img_path):
        os.remove(dummy_img_path)
    print('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!')
