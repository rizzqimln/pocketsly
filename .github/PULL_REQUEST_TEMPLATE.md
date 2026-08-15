## What does this PR do?
A short description of the change and the problem it solves.

## Why is this needed?
Link any related issue, or explain the motivation.

## How was it tested?
- [ ] `pytest tests/test_api.py` passes
- [ ] `pytest tests/test_perf_security.py` passes (server running)
- [ ] E2E suites pass (server running, Playwright installed)
- [ ] Manually verified in the browser

## Checklist
- [ ] No new dependencies added (project is zero-dependency by design)
- [ ] Follows the existing `LEARN:` comment style in the touched files
- [ ] If JS changed: `python3 scripts/lint_js.py` passes
- [ ] If JS/CSS changed: ran `python3 scripts/build.py` **and** bumped the `?v=` in `static/index.html` + `static/sw.js`
- [ ] If behavior changed: updated the relevant docs (`README.md` / `docs/`)
