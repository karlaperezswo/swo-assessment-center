# E2E tests

Playwright smoke tests covering the UX introduced in phases 1-7.

## First-time setup

```sh
cd frontend
npx playwright install chromium
```

## Running

The config spawns Vite automatically on port 3005 and reuses an existing
instance if one is already running.

```sh
npm run e2e            # headless
npm run e2e:headed     # watch the browser
npm run e2e:ui         # Playwright inspector
```

Point at a different target with `E2E_BASE_URL`, or skip the managed
server when running against staging with `E2E_SKIP_SERVER=1`.

## Coverage

- Header and phase navigator render on load.
- Theme toggle flips the `.dark` class on `<html>`.
- Session menu opens and exposes Save / Export / Cloud actions.
- Assess subtabs render and carry prerequisite hints when the MPA has
  not been loaded.
- Migration Readiness empty state surfaces the MRA copy before any
  upload.

The AI analysis path (opportunities, readiness scoring from a real
MPA, business case parsing) is not covered here — those require live
Cognito + Bedrock credentials.
