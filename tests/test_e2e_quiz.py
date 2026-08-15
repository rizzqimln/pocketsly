import time
from playwright.sync_api import sync_playwright

def test_quiz_and_flat_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Navigate to application
        page.goto("http://localhost:8000")
        page.wait_for_selector("#landing-signin-btn", state="visible")

        # Register a unique user
        uname = f"quiztest_{int(time.time())}"
        page.click("#landing-signin-btn")
        page.wait_for_timeout(300)
        page.click("#show-register-link")
        page.wait_for_timeout(300)
        page.fill("#reg-username", uname)
        page.fill("#reg-password", "password123")
        page.fill("#reg-email", f"{uname}@example.com")
        page.click("#register-form button[type='submit']")

        page.wait_for_selector("#view-dashboard:not(.hidden)", state="visible")
        print("1. Logged in successfully.")

        # Navigate to Curriculum Lab
        page.click('a[data-view="curriculum"]')
        page.wait_for_selector("#view-curriculum:not(.hidden)", state="visible")
        print("2. Navigated to Curriculum view.")

        # Switch to Flashcards & Quiz Tab
        page.evaluate("() => window.Curriculum.switchTab('flashcards')")
        page.wait_for_selector("#curr-flashcards:not(.hidden)", state="visible")
        print("3. Switched to Flashcards & Quiz tab.")

        # Verify question bank count text (should show 'Question 1 of 25')
        progress_el = page.query_selector("#quiz-progress-text")
        assert progress_el is not None
        progress_text = progress_el.inner_text()
        print(f"Quiz progress text: {progress_text}")
        assert "of 25" in progress_text, f"Expected 25 questions, got {progress_text}"

        # Check question 1 text
        q_text = page.query_selector("#quiz-question-text").inner_text()
        print(f"Question 1: {q_text}")
        assert len(q_text) > 10

        # Check 4 option buttons exist
        options = page.query_selector_all(".quiz-opt-btn")
        assert len(options) == 4, f"Expected 4 option buttons, got {len(options)}"

        # Click the first option to answer
        options[0].click()
        time.sleep(0.8) # Wait for 3D flip animation

        # Verify card has .flipped class
        card_3d = page.query_selector("#quiz-card-3d")
        card_classes = card_3d.get_attribute("class")
        assert "flipped" in card_classes, f"Expected card to have flipped class, got {card_classes}"
        print("4. 3D card flipped successfully.")

        # Verify feedback badge and explanation
        result_badge = page.query_selector("#quiz-result-badge")
        assert result_badge is not None
        print(f"Quiz result badge content: {result_badge.inner_text()}")

        # Next question button
        page.click("#quiz-next-btn")
        time.sleep(0.5)

        # Verify card flipped back and now on Question 2
        card_classes_after = page.query_selector("#quiz-card-3d").get_attribute("class")
        assert "flipped" not in card_classes_after, "Expected card to reset flip"
        new_progress = page.query_selector("#quiz-progress-text").inner_text()
        print(f"Quiz progress after Next: {new_progress}")
        assert "Question 2 of 25" in new_progress

        print("5. Quiz card flip and question progression verified 100%!")
        browser.close()

if __name__ == "__main__":
    test_quiz_and_flat_icons()
