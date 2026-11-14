# CareHarbour Platform (MVP)

Guided caregiver check-ins (Work Stress, Burnout) in video or text format, with a
summary report, non-clinical tips, a survey, community resources by postal code,
PDF export, and a basic AI Assistant.

It's a static site (plain HTML, CSS, and JavaScript modules) with no build step.
Two optional Cloudflare Pages Functions live in `/functions`.

## Run locally

```bash
powershell -ExecutionPolicy Bypass -File scripts/serve.ps1
```

Then open http://localhost:8080/platform/. Engine tests: http://localhost:8080/platform/tests.html.
The local server doesn't run `/api/*`, so the assistant uses its built-in answers.

## Where things live

| What | File |
|---|---|
| Questions, scoring, bands, advice, branching rules (one source for video + text) | `js/data/conditions.js` |
| Branching engine, scoring, report building, anonymous IDs | `js/engine.js` |
| Crisis lines (hard-coded, never AI-generated) | `js/data/crisis.js` + `crisis.html` (no-JS fallback) |
| Curated resource directory by province | `js/data/resources.js` |
| Assistant offline answers + crisis keyword check | `js/data/assistant-faq.js` |
| Screens and routing | `js/app.js`, `js/ui.js` |
| Avatar + text-to-speech | `js/avatar.js` |
| PDF export (jsPDF, loaded on demand; falls back to print) | `js/pdf.js` |
| Sign-in (device-only accounts + guest) | `js/auth.js` |
| Endpoints and settings | `js/config.js` |
| AI Assistant backend | `../functions/api/assistant.js` |
| Survey collection backend | `../functions/api/survey.js` |

## Adding a condition

Copy the Work Stress block in `conditions.js`, change `status` to `"available"`, and
fill in 6 questions, a `followUp` trigger (`countAtLeast` or `answerScore`), 3 bands,
and any `conditionalTips`. Add a test case to `tests.html`.

## Deploying (Cloudflare Pages)

1. Connect the repo with no build command and output directory `/`. Pages installs
   `package.json` dependencies for the Functions.
2. Add the secret `ANTHROPIC_API_KEY` (Settings → Environment variables).
3. Optional: bind a KV namespace named `SURVEYS` to store survey responses.

On any other static host the platform still works: the assistant falls back to
built-in answers and surveys stay on the device.

## Before launch

- **Verify the resource directory.** `resources.js` is a starter list; confirm each
  phone number and link, then re-check them on a regular schedule.
- **Verify the crisis lines** in `crisis.js` and `crisis.html` (keep the two in sync).
- **Replace device-only sign-in** (`auth.js`) with a hosted auth provider if accounts
  need to work across devices.
- Have someone with a clinical or crisis-support background review the advice
  wording and the safety-check flow.
