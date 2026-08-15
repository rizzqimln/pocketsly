"""
AUTOMATED API TEST SUITE (tests/test_api.py)
=============================================
LEARN: Testing Web Applications in Pure Python
1. unittest: Built-in Python test framework (TestCase, setUpClass, tearDownClass).
2. http.client: Standard library HTTP client used to send raw requests to live endpoints.
3. Integration Testing: Boots an actual HTTP server thread against a clean temp database.
"""

import http.client
import json
import os
import sys
import threading
import time
import unittest
from datetime import datetime

# Add parent directory to module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import db
import auth
from server import AppRequestHandler, PORT

TEST_PORT = 8999
TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_daily.db")


class ApiIntegrationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Runs once before all tests: sets test DB path and starts background server."""
        # Override DB_PATH in db module
        db.DB_PATH = TEST_DB_PATH
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

        db.init_db()

        # Start HTTP server on test port in background thread
        import http.server
        cls.server = http.server.HTTPServer(("127.0.0.1", TEST_PORT), AppRequestHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        time.sleep(0.2)  # Give server thread time to bind port

    @classmethod
    def tearDownClass(cls):
        """Runs once after all tests: shuts down server and cleans temp database."""
        cls.server.shutdown()
        cls.server.server_close()
        db.DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "daily_app.db")
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass

    def request(self, method, path, body=None, cookie=None):
        """Helper to send HTTP requests to test server and return (status, headers, parsed_json_dict)."""
        conn = http.client.HTTPConnection("127.0.0.1", TEST_PORT)
        headers = {"Content-Type": "application/json"}
        if cookie:
            headers["Cookie"] = cookie

        json_body = json.dumps(body) if body is not None else None
        conn.request(method, path, body=json_body, headers=headers)
        res = conn.getresponse()

        res_headers = dict(res.getheaders())
        res_data = res.read().decode("utf-8")
        parsed = json.loads(res_data) if res_data else None

        conn.close()
        return res.status, res_headers, parsed

    # =========================================================================
    # TEST CASES
    # =========================================================================

    def test_01_auth_flow(self):
        """Test registration, login, session validation, and logout."""
        # 1. Unauthenticated request to /api/session should return authenticated=False
        status, _, data = self.request("GET", "/api/session")
        self.assertEqual(status, 200)
        self.assertFalse(data["authenticated"])

        # 2. Register user 'student_dev'
        status, headers, data = self.request("POST", "/api/register", {"username": "student_dev", "password": "password123"})
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        self.assertIn("Set-Cookie", headers)
        cookie = headers["Set-Cookie"].split(";")[0]

        # 3. Check session with cookie
        status, _, data = self.request("GET", "/api/session", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user"]["username"], "student_dev")

        # 4. Logout
        status, headers, data = self.request("POST", "/api/logout", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])

    def test_02_habits_api(self):
        """Test habit creation, listing, and daily completion logging."""
        # Register and login test user
        status, headers, _ = self.request("POST", "/api/register", {"username": "habit_tester", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Create habit
        status, _, data = self.request("POST", "/api/habits", {"title": "Read 20 Mins", "icon": "📚", "color": "#20C997"}, cookie=cookie)
        self.assertEqual(status, 201)
        habit_id = data["id"]

        # 2. List habits
        status, _, data = self.request("GET", "/api/habits", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Read 20 Mins")

        # 3. Log completion for today
        status, _, data = self.request("POST", f"/api/habits/{habit_id}/log", {"date": "2026-08-13", "done": True}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(data["done"])

    def test_03_tasks_api(self):
        """Test task creation, priority updates, done toggling, and deletion."""
        status, headers, _ = self.request("POST", "/api/register", {"username": "task_tester", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Create High Priority Task
        status, _, data = self.request("POST", "/api/tasks", {
            "title": "Submit Final Lab Report",
            "priority": "high",
            "due_date": "2026-08-20"
        }, cookie=cookie)
        self.assertEqual(status, 201)
        task_id = data["id"]

        # 2. Patch task to done
        status, _, data = self.request("PATCH", f"/api/tasks/{task_id}", {"done": True}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])

        # 3. Delete task
        status, _, data = self.request("DELETE", f"/api/tasks/{task_id}", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])

    def test_04_curriculum_api(self):
        """Test the educational curriculum SQL playground and schema endpoints."""
        # 1. Register and login test user
        status, headers, _ = self.request("POST", "/api/register", {"username": "edu_tester", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 2. Test schema retrieval
        status, _, schema = self.request("GET", "/api/curriculum/schema", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertIn("users", schema)
        self.assertIn("tasks", schema)

        # 3. Test SELECT query on the playground
        status, _, res = self.request("POST", "/api/curriculum/playground", {"query": "SELECT username FROM users WHERE username = 'edu_tester'"}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(res["type"], "select")
        self.assertEqual(res["rows"][0]["username"], "edu_tester")

        # 4. Test forbidden statement block
        status, _, res = self.request("POST", "/api/curriculum/playground", {"query": "DROP TABLE users"}, cookie=cookie)
        self.assertEqual(status, 400)
        self.assertIn("blocked", res["error"].lower())

    def test_05_resources_seeding(self):
        """Test that freeCodeCamp and The Odin Project resources are seeded when accessing empty list."""
        status, headers, _ = self.request("POST", "/api/register", {"username": "resource_tester", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # Fetch resources (which starts empty, triggering the default seeding)
        status, _, resources = self.request("GET", "/api/resources", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(len(resources) >= 6)

        # Verify freeCodeCamp and Odin resources exist in the response
        titles = [r["title"] for r in resources]
        self.assertTrue(any("freeCodeCamp" in t for t in titles))
        self.assertTrue(any("Odin Project" in t for t in titles))

    def test_06_performance_analytics_crud(self):
        """Test adding, updating, and removing courses and study logs in performance analytics."""
        status, headers, _ = self.request("POST", "/api/register", {"username": "perf_tester", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Add course with initial progress
        status, _, course = self.request("POST", "/api/courses", {
            "code": "CS-101",
            "name": "Fullstack Web Architecture",
            "credits": 3,
            "progress": 45
        }, cookie=cookie)
        self.assertEqual(status, 201)
        course_id = course["id"]
        self.assertEqual(course["progress"], 45)

        # 2. Update course progress via PATCH
        status, _, updated = self.request("PATCH", f"/api/courses/{course_id}", {"progress": 85}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(updated["progress"], 85)

        # 3. Add study log
        status, _, log = self.request("POST", "/api/study-logs", {
            "course_name": "Fullstack Web Architecture",
            "hours": 3.5,
            "activity_type": "practice",
            "log_date": "2026-08-14",
            "notes": "Built burger navigation and responsive timetable"
        }, cookie=cookie)
        self.assertEqual(status, 201)
        log_id = log["id"]

        # 4. Get study logs
        status, _, logs = self.request("GET", "/api/study-logs", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0]["hours"], 3.5)

        # 5. Delete study log
        status, _, del_log = self.request("DELETE", f"/api/study-logs/{log_id}", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(del_log["success"])

        # 6. Delete course
        status, _, del_course = self.request("DELETE", f"/api/courses/{course_id}", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(del_course["success"])

    def test_07_password_reset_flow(self):
        """Test password reset workflow with email/phone verification and credential updates."""
        # 1. Register a new user with email & phone
        status, _, reg_data = self.request("POST", "/api/register", {
            "username": "reset_student",
            "password": "old_password_123",
            "email": "reset@example.com",
            "phone": "+19998887777"
        })
        self.assertEqual(status, 200)
        self.assertTrue(reg_data["success"])

        # 2. Reset attempt with wrong recovery contact should fail (400)
        status, _, err_data = self.request("POST", "/api/reset-password", {
            "username": "reset_student",
            "recovery_contact": "wrong@example.com",
            "new_password": "new_password_456"
        })
        self.assertEqual(status, 400)
        self.assertIn("error", err_data)

        # 3. Reset attempt with valid registered Email should succeed (200)
        status, _, res_data = self.request("POST", "/api/reset-password", {
            "username": "reset_student",
            "recovery_contact": "reset@example.com",
            "new_password": "new_password_456"
        })
        self.assertEqual(status, 200)
        self.assertTrue(res_data["success"])

        # 4. Login attempt with OLD password should fail (400)
        status, _, old_login = self.request("POST", "/api/login", {
            "username": "reset_student",
            "password": "old_password_123"
        })
        self.assertEqual(status, 400)

        # 5. Login attempt with NEW password should succeed (200) and return valid session
        status, headers, new_login = self.request("POST", "/api/login", {
            "username": "reset_student",
            "password": "new_password_456"
        })
        self.assertEqual(status, 200)
        self.assertTrue(new_login["success"])
        self.assertIn("Set-Cookie", headers)
        cookie = headers["Set-Cookie"].split(";")[0]

        # 6. Verify session works with new session cookie
        status, _, session_data = self.request("GET", "/api/session", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(session_data["authenticated"])
        self.assertEqual(session_data["user"]["username"], "reset_student")

    def test_08_budget_cashflow_flow(self):
        """Test creating incomes, querying incomes, logging expenses, and deleting income entries."""
        status, headers, _ = self.request("POST", "/api/register", {
            "username": "cashflow_dev",
            "password": "password123"
        })
        self.assertEqual(status, 200)
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Add income 1
        status, _, inc1 = self.request("POST", "/api/incomes", {
            "source": "Scholarship",
            "amount": 2500000,
            "description": "Semester academic scholarship award",
            "income_date": "2026-08-01"
        }, cookie=cookie)
        self.assertEqual(status, 201)
        self.assertEqual(inc1["amount"], 2500000)
        inc1_id = inc1["id"]

        # 2. Add income 2
        status, _, inc2 = self.request("POST", "/api/incomes", {
            "source": "Freelance Web Design",
            "amount": 1200000,
            "description": "Landing page client project",
            "income_date": "2026-08-10"
        }, cookie=cookie)
        self.assertEqual(status, 201)
        inc2_id = inc2["id"]

        # 3. Query all incomes
        status, _, incomes = self.request("GET", "/api/incomes", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(len(incomes), 2)
        self.assertEqual(incomes[0]["source"], "Freelance Web Design")

        # 4. Add expense
        status, _, exp = self.request("POST", "/api/expenses", {
            "category": "Textbooks & Tools",
            "amount": 350000,
            "description": "Database Systems textbook & domain",
            "expense_date": "2026-08-12"
        }, cookie=cookie)
        self.assertEqual(status, 201)

        # 5. Delete income 1
        status, _, del_res = self.request("DELETE", f"/api/incomes/{inc1_id}", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(del_res["success"])

        # 6. Verify remaining incomes
        status, _, remaining_incomes = self.request("GET", "/api/incomes", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(len(remaining_incomes), 1)
        self.assertEqual(remaining_incomes[0]["id"], inc2_id)

    def test_09_backup_and_restore_flow(self):
        """Test full JSON export and restore API with transaction safety."""
        _, headers, _ = self.request("POST", "/api/register", {"username": "backup_user", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Create a habit, task, and note for backup_user
        self.request("POST", "/api/habits", {"title": "Backup Habit", "icon": "📦", "color": "#10B981"}, cookie=cookie)
        self.request("POST", "/api/tasks", {"title": "Backup Task", "priority": "high"}, cookie=cookie)
        self.request("POST", "/api/notes", {"title": "Backup Note", "body": "Important note content", "mood": "productive"}, cookie=cookie)

        # 2. Export JSON backup
        status, _, backup = self.request("GET", "/api/backup/export", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(backup["version"], "1.0")
        self.assertEqual(len(backup["data"]["habits"]), 1)
        self.assertEqual(len(backup["data"]["tasks"]), 1)
        self.assertEqual(len(backup["data"]["notes"]), 1)
        self.assertEqual(backup["data"]["habits"][0]["title"], "Backup Habit")

        # 3. Add extra task that will be wiped upon restore
        self.request("POST", "/api/tasks", {"title": "Temporary Task"}, cookie=cookie)
        _, _, tasks_before = self.request("GET", "/api/tasks", cookie=cookie)
        self.assertEqual(len(tasks_before), 2)

        # 4. Restore original backup
        status, _, restore_res = self.request("POST", "/api/backup/restore", backup, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(restore_res["success"])

        # 5. Verify restored state (Temporary Task is gone, original task is back)
        _, _, tasks_after = self.request("GET", "/api/tasks", cookie=cookie)
        self.assertEqual(len(tasks_after), 1)
        self.assertEqual(tasks_after[0]["title"], "Backup Task")

    def test_10_budget_summary_and_dashboard_cashflow(self):
        """Test that /api/budget/summary returns accurate net balance and /api/dashboard contains budget_summary."""
        status, headers, data = self.request("POST", "/api/register", {"username": "budgetuser", "password": "password123"})
        self.assertEqual(status, 200)
        cookie = headers.get("Set-Cookie", "").split(";")[0]

        # Log income 500,000 and expense 150,000
        today = datetime.now().strftime("%Y-%m-%d")
        self.request("POST", "/api/incomes", {"source": "Freelance", "amount": 500000, "income_date": today, "description": "Design"}, cookie=cookie)
        self.request("POST", "/api/expenses", {"category": "Food", "amount": 150000, "expense_date": today, "description": "Lunch"}, cookie=cookie)

        # Verify /api/budget/summary
        status, _, summary = self.request("GET", "/api/budget/summary", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(summary["total_income"], 500000.0)
        self.assertEqual(summary["total_expense"], 150000.0)
        self.assertEqual(summary["net_balance"], 350000.0)

        # Verify /api/dashboard includes budget_summary
        status, _, dash = self.request("GET", "/api/dashboard", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertIn("budget_summary", dash)
        self.assertEqual(dash["budget_summary"]["net_balance"], 350000.0)

    def test_11_profile_currency_and_citation_fields(self):
        """Test updating currency in user profile and saving academic resources with citation metadata."""
        status, headers, data = self.request("POST", "/api/register", {"username": "cite_user", "password": "password123"})
        self.assertEqual(status, 200)
        cookie = headers.get("Set-Cookie", "").split(";")[0]

        # 1. Update preferred currency to USD
        status, _, prof = self.request("PATCH", "/api/profile", {"currency": "USD"}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(prof["user"]["currency"], "USD")

        # 2. Check session endpoint returns updated currency
        status, _, sess = self.request("GET", "/api/session", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(sess["user"]["currency"], "USD")

        # 3. Add academic resource with citation metadata (year, publisher, doi)
        status, _, res = self.request("POST", "/api/resources", {
            "title": "Attention Is All You Need",
            "author": "Vaswani et al.",
            "year": "2017",
            "publisher": "NeurIPS",
            "doi": "10.48550/arXiv.1706.03762",
            "resource_type": "journal",
            "category": "ai",
            "url_or_path": "https://arxiv.org/abs/1706.03762",
            "notes": "Introduced Transformer architecture"
        }, cookie=cookie)
        self.assertEqual(status, 201)
        self.assertEqual(res["year"], "2017")
        self.assertEqual(res["publisher"], "NeurIPS")
        self.assertEqual(res["doi"], "10.48550/arXiv.1706.03762")

        # 4. Fetch resources and verify citation metadata persists
        status, _, all_res = self.request("GET", "/api/resources", cookie=cookie)
        self.assertEqual(status, 200)
        saved = next(r for r in all_res if r["title"] == "Attention Is All You Need")
        self.assertEqual(saved["year"], "2017")
        self.assertEqual(saved["publisher"], "NeurIPS")
        self.assertEqual(saved["doi"], "10.48550/arXiv.1706.03762")

    def test_12_receipt_scan_endpoint(self):
        """Test the receipt OCR endpoint extracts merchant + total amount."""
        from PIL import Image, ImageDraw, ImageFont

        status, headers, _ = self.request("POST", "/api/register", {"username": "receipt_user", "password": "password123"})
        cookie = headers["Set-Cookie"].split(";")[0]

        # 1. Unauthorized request is rejected
        status, _, data = self.request("POST", "/api/receipt/scan", {"image": ""})
        self.assertEqual(status, 401)

        # 2. Missing image is rejected
        status, _, data = self.request("POST", "/api/receipt/scan", {}, cookie=cookie)
        self.assertEqual(status, 400)

        # 3. Generate a synthetic receipt image and scan it
        import io
        import base64
        img = Image.new("RGB", (700, 260), "white")
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("/usr/share/fonts/dejavu/DejaVuSans.ttf", 32)
        except Exception:
            font = None
        draw.text((30, 40), "TOTAL: Rp 47.500", fill="black", font=font)
        draw.text((30, 100), "Indomaret Point", fill="black", font=font)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        status, _, data = self.request("POST", "/api/receipt/scan", {"image": image_b64}, cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(data["amount"], 47500)
        self.assertEqual(data["category"], "Food & Dining")


if __name__ == "__main__":
    unittest.main()
