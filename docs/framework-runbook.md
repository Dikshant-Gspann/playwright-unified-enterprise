Playwright Enterprise Framework – Capabilities & Run Book

**1. What this framework is
**This repo is a multi-client, multi-channel testing framework built on top of Playwright with a plugin-based architecture.
It’s designed so that:

GSPANN keeps the core IP (framework code, plugins, patterns).
Each client (World Market, Alo Yoga, London Drugs, etc.) only needs:
A lightweight config JSON (configs/<Client>.json)

A CI workflow in their own repo
Their tests + secrets wired in

**1.1 Capabilities
**
Test Types

✅ UI (web):
Located under: playwright-tests/ui/specs/**
Multi-browser: chromium, firefox, webkit

✅ API:
Located under: playwright-tests/api/spec/**
Uses Playwright’s request object for REST/GraphQL-style flows

✅ DB (extensible):
Add DB tests under playwright-tests/db/spec/**
Supports any DB via small utility wrappers (Postgres, SQL Server, etc.)

✅ Mobile (separate track):
WebdriverIO/Appium based mobile tests under playwright-tests/mobile/**
Typically run via separate workflows or device cloud

Runtime / Integrations

Per-client configuration:
configs/<Client>.json controls CI system selection, webhooks, email, TestRail, etc.

CI/CD options (pluggable):

GitHub Actions (currently wired)
Azure DevOps / CircleCI / others possible via plugins/ci/*

Webhooks:

Microsoft Teams (implemented)
Slack (pluggable)

Reporting:
Allure results (via allure-playwright)
Allure HTML report (local / CI artifact)

Teams summary card after each run (rich Adaptive Card)

Test Management (future/optional):   
TestRail integration stub in plugins/testmgmt/testrail.js

2. Project structure (high level)

configs/
  WorldMarket.json
  Alo-Yoga.json
.github/
  workflows/
    ci.yml                   # GitHub Actions integration
playwright-tests/
  ui/
    specs/                   # UI e2e tests
  api/
    spec/                    # API tests
  db/
    spec/                    # (optional) DB tests
utils/
  loader.js                  # Loads client config & resolves env vars
  plugin-runner.js           # Loads CI/webhook/email plugins
  bootstrap.js               # Playwright globalSetup → plugin-runner
  reporter-plugin.js         # Custom reporter → Teams / post-run hooks
plugins/
  ci/
    github-actions.js
    azure-pipelines.js       # (stub, optional)
    circleci.js              # (stub, optional)
  webhook/
    teams.js
    slack.js                 # (stub, optional)
  email/
    smtp.js                  # (stub for SMTP)
  testmgmt/
    testrail.js              # (stub for TestRail)
playwright.config.(js|cjs)   # Playwright config with multiple projects
package.json

3. Prerequisites
3.1 Local environment

Node.js v18+ (v20 recommended)
npm
Git
Allure CLI (for local HTML report)

npm install -g allure-commandline
# or use a binary installer depending on OS

3.2 Global Playwright deps

Inside project root:

npm ci
npx playwright install --with-deps

4. Client configuration – configs/<Client>.json

This is how you make the framework “aware” of a client (WorldMarket, Alo-Yoga, etc).

4.1 Generate a new client config

From project root:
npm run generate-config


You’ll be asked:

Client name: e.g. WorldMarket
Select CI/CD systems:
e.g. GitHub Actions (for WM if they use GH)
Slack webhook URL: (optional, leave blank)
Teams webhook URL:
Use literal URL or \${TEAMS_WEBHOOK_URL} if you want to inject from env/secret

Use TestRail?: Yes/No
Enable email reporting?: Yes/No → if Yes: SMTP host/port/user/pass

This creates:

configs/WorldMarket.json


Example:

{
  "client": "WorldMarket",
  "ciCd": {
    "github-actions": true
  },
  "webhooks": {
    "teams": {
      "url": "${TEAMS_WEBHOOK_URL}"
    }
  },
  "testManagement": {},
  "emailReporting": {
    "enabled": false
  }
}


4.2 How the config is used

utils/loader.js:
Reads process.env.CLIENT (default: LondonDrugs)
Loads configs/<CLIENT>.json
Replaces ${VAR_NAME} placeholders with process.env.VAR_NAME

utils/plugin-runner.js:
For each ciCd entry: loads plugin from plugins/ci/<ci>.js

If webhooks.teams or TEAMS_WEBHOOK_URL exists: loads Teams plugin
If emailReporting.enabled: loads SMTP plugin
If testManagement.testrail: loads TestRail plugin

5. Running tests locally
5.1 Global notes

Always run from project root.
Set CLIENT so that correct config is loaded:

export CLIENT=WorldMarket       # macOS/Linux
# or
set CLIENT=WorldMarket          # Windows cmd

5.1.1 UI tests only
Run all UI specs on all browsers:

CLIENT=WorldMarket npx playwright test \
  playwright-tests/ui/specs \
  --project=chromium \
  --project=firefox \
  --project=webkit


Or one browser:

CLIENT=WorldMarket npx playwright test \
  playwright-tests/ui/specs \
  --project=chromium

5.1.2 API tests only
CLIENT=WorldMarket npx playwright test \
  playwright-tests/api/spec \
  --project=api

5.1.3 UI + API together
CLIENT=WorldMarket npx playwright test \
  playwright-tests/ui/specs \
  playwright-tests/api/spec \
  --project=api \
  --project=chromium \
  --project=firefox \
  --project=webkit

5.1.4 DB tests (if you add a DB project)

Add a db project in playwright.config:

{
  name: 'db',
  testMatch: /.*\/db\/spec\/.*\.(js|ts)$/
}


Create DB specs under playwright-tests/db/spec/**.

Run:

CLIENT=WorldMarket npx playwright test \
  --project=db

6. Allure reporting
6.1 During test execution

The Playwright config already has:

reporter: [
  ['list'],
  ['allure-playwright', { outputFolder: 'allure-results' }],
  [require.resolve('./utils/reporter-plugin.js')]
]


So every run will generate Allure raw results to:
allure-results/

6.2 Generate HTML report locally

After a test run:

npx allure generate allure-results --clean -o allure-report
npx allure open allure-report

This opens the Allure dashboard in your browser.

7. GitHub Actions + Teams integration

The repo has a workflow: .github/workflows/ci.yml

7.1 Inputs (manual run)

When you run “Run workflow” → workflow_dispatch:

client:

Name of client config, e.g. WorldMarket → loads configs/WorldMarket.json

run_api: boolean – run API tests?
run_chromium: boolean – run Chromium UI?
run_firefox: boolean – run Firefox UI?
run_webkit: boolean – run WebKit UI?

The workflow builds a list of --project flags based on these toggles.

7.2 Required secrets in GitHub

In the client’s repo (e.g. WorldMarket fork), set:

TEAMS_WEBHOOK_URL – from Teams channel connector
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS – if email is enabled
REPORT_TO – comma separated email list (if you wire email)

DB URLs etc. (as needed):
PG_URL, MSSQL_URL, etc.
Any API keys / base URLs you use in tests.

7.3 What the workflow actually does

Checkout & install
actions/checkout
actions/setup-node

npm ci
Teams smoke ping (optional):
Sends a tiny MessageCard to verify webhook + renderer

Install Playwright browsers:
npx playwright install --with-deps

Build project selection:

Reads the toggles (run_api, run_chromium, etc.)
Constructs --project=<name> flags

Exports also a CSV of selected projects for the reporter (so Teams card only shows what actually ran)

**Run Playwright:**

Sets CLIENT env to input client
Calls npx playwright test ... --reporter=list,allure-playwright,./utils/reporter-plugin.js

globalSetup calls utils/bootstrap.js → plugin-runner.js → loads plugins from config

Post-run reporters:

utils/reporter-plugin.js:

Aggregates per-test status

Builds a rich summary JSON

Calls registered post-run tasks (e.g. Teams plugin)

Teams plugin:

Builds a rich Adaptive Card:

Status (✅/❌), client, branch, commit, duration

Per-project indicators (API passed, Chromium failed, etc.)

Top error snippet(s) if any

Allure artifact:

npx allure generate allure-results --clean -o allure-report

Uploads allure-report as GitHub Actions artifact

If tests fail, the job ends with exit code 1 (expected: this is how you catch regressions).
Teams card will still be posted with red state and error details.

8. Usage summary (for any new engineer)

Clone repo & install

git clone <repo-url>
cd Playwright-enterprise
npm ci
npx playwright install --with-deps


Generate client config

npm run generate-config
# Fill prompts; produces configs/<Client>.json


Set up secrets (if working in GitHub repo)

Run locally

UI only:

CLIENT=<Client> npx playwright test playwright-tests/ui/specs \
  --project=chromium --project=firefox --project=webkit


API only:

CLIENT=<Client> npx playwright test playwright-tests/api/spec \
  --project=api


Mixed:

CLIENT=<Client> npx playwright test \
  playwright-tests/ui/specs \
  playwright-tests/api/spec \
  --project=api --project=chromium --project=firefox --project=webkit


**View reports
**
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report


Run via GitHub Actions

Go to Actions → Playwright CI → Run workflow

Select:

client = e.g. WorldMarket

Toggle run_api, run_chromium, etc.

After run:

Check Teams channel for adaptive card summary

Download allure-report artifact if needed

9. Troubleshooting & common issues
9.1 Node/npm / install issues

Symptom 1: EEXIST / EACCES / permission denied in ~/.npm/_cacache (you’ve seen this earlier).

Fix:

rm -rf ~/.npm/_cacache
# or
sudo rm -rf ~/.npm/_cacache

# Then:
rm -rf node_modules package-lock.json
npm cache clean --force
npm ci


Also make sure you don’t run npm ci with sudo unless absolutely necessary.

Symptom 2: Playwright cannot find browsers or dependencies.

Fix:

npx playwright install --with-deps


Run again.

9.2 Config not found

Error:

Error: ENOENT: no such file or directory, open 'configs/LondonDrugs.json'


Why: CLIENT env is LondonDrugs but configs/LondonDrugs.json doesn’t exist.

Fix:

Generate config:

npm run generate-config
# client: LondonDrugs


Or change env:

export CLIENT=WorldMarket

9.3 Teams message shows “Error encountered while rendering this message”

This usually means Teams doesn’t like the card JSON:
Curly braces / quotes broken
Payload too big
Wrong schema combination

Steps to isolate:

Use the smoke ping in CI (already in YAML):

- name: Teams webhook smoke ping
  if: ${{ env.TEAMS_WEBHOOK_URL != '' }}
  env:
    HOOK: ${{ secrets.TEAMS_WEBHOOK_URL }}
  run: |
    curl -sS -H "Content-Type: application/json" -d '{
      "@type":"MessageCard","@context":"http://schema.org/extensions",
      "summary":"Smoke","themeColor":"0076D7",
      "text":"Smoke ping: if you see this, webhook + renderer are OK."
    }' "$HOOK"


If smoke works but test card fails:

Temporarily log JSON.stringify(card, null, 2) before POST in plugins/webhook/teams.js.
Copy that JSON into Postman → verify.

9.4 Failing API demo test, but you just want green pipeline

If the demo API test is failing (e.g. 429 responses), you have options:
Make it GET-only and assert 200 on a simple endpoint (as shown above).

Or, temporarily:

- name: Run Playwright
  continue-on-error: true
  run: ...


(For demo / PoC only; not recommended for real regression.)

9.5 Cleaning everything if “weird” errors start

In worst case:

rm -rf node_modules package-lock.json allure-results allure-report test-results
npm cache clean --force
npm ci
npx playwright install --with-deps

and 
Run again.