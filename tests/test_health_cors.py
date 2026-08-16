"""
UNIT & INTEGRATION TEST: Health & CORS Headers
==============================================
Tests the GET /api/health route and OPTIONS preflight CORS handling
added to server.py.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import AppRequestHandler, _PUBLIC_GET, _GET_ROUTES

class HealthAndCorsTest(unittest.TestCase):
    def test_security_headers_contain_cors(self):
        headers = AppRequestHandler._get_security_headers(None)
        self.assertIn("Access-Control-Allow-Origin", headers)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "*")
        self.assertIn("Access-Control-Allow-Methods", headers)
        self.assertIn("Access-Control-Allow-Headers", headers)

    def test_public_routes_include_health(self):
        self.assertIn("/api/health", _PUBLIC_GET)
        self.assertIn("/api/health", _GET_ROUTES)

if __name__ == "__main__":
    unittest.main()
