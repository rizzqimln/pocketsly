/**
 * REST API CLIENT MODULE (api.js)
 * ================================
 * LEARN: Modern Asynchronous Web Communication
 *
 * 1. Fetch API     — The browser's built-in way to make HTTP requests without
 *                    reloading the page. Returns a Promise you must await.
 * 2. Async/Await   — Syntactic sugar over Promises. `await` pauses only the
 *                    current async function; it never blocks the browser.
 * 3. Credentials   — 'same-origin' tells the browser to include the session
 *                    cookie automatically on every request to the same origin.
 * 4. Error Pattern — We throw on non-2xx responses so every caller can use a
 *                    single try/catch instead of manual status checks.
 */

// LEARN: A plain object module (not a class) keeps the API client lightweight.
// All methods share `this` via dot notation: API.get(), API.post(), etc.
const API = {

  /**
   * Universal fetch wrapper — all HTTP calls go through here.
   *
   * LEARN: Centralising fetch logic means every module gets consistent
   * error handling, headers, and JSON serialisation automatically.
   *
   * @param {string} endpoint  e.g. '/api/habits'
   * @param {object} options   standard fetch init options
   * @returns {Promise<any>}   parsed JSON response body
   * @throws {Error}           on non-OK HTTP status or network failure
   */
  async request(endpoint, options = {}) {
    const config = {
      // LEARN: Content-Type: application/json tells the server how to parse
      // the request body. Without it, Python's json.loads() would fail.
      headers: { 'Content-Type': 'application/json' },
      // LEARN: 'same-origin' forwards session cookies only to the same
      // host+port. Using 'include' would send them cross-origin (security risk).
      credentials: 'same-origin',
      ...options,
    };

    // LEARN: JSON.stringify() converts a JS object into a JSON string.
    // fetch() accepts only strings or FormData as a body, not plain objects.
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(endpoint, config);
      // LEARN: response.json() is also async — it reads and parses the body stream.
      const data = await response.json();

      // LEARN: response.ok is true for status codes 200–299. We throw an Error
      // so callers can handle all failures uniformly in a single catch block.
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      // LEARN: Re-throwing keeps the original error stack for the caller's
      // catch block while logging it here for easier debugging.
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // ── HTTP Method Shortcuts ───────────────────────────────────────────────
  // LEARN: These thin wrappers make call sites read like plain English:
  //   API.get('/api/habits') vs API.request('/api/habits', { method: 'GET' })

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  patch(endpoint, body) {
    // LEARN: PATCH sends only the changed fields (partial update).
    // PUT would replace the entire resource — use PATCH for field-level edits.
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
