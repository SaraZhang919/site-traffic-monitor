# Credentials Setup

Please do not paste Google private keys or OpenAI keys into chat.

This app reads credentials from a local `.env.local` file on your computer. That file is ignored by GitHub.

## What The App Can Use

The monitor can use these private sources:

- Google Sheets from your existing automation workflow.
- GA4 Data API when a needed date range is missing from local snapshots/imports.
- Google Search Console Search Analytics API for page/query data.
- GSC URL Inspection API for indexing checks.
- PageSpeed Insights API for Core Web Vitals checks.
- OpenAI API for SEO diagnosis and action enrichment.

## Local File Setup

Create or update this file in the project folder:

```text
D:\AI Projects\Vidmud\Site Traffic Monitor\.env.local
```

Use this format:

```text
GOOGLE_SERVICE_ACCOUNT_FILE=D:\key\gsc-api-project-453403-f995d7d6b334.json
GOOGLE_SHEET_ID=your_google_sheet_id_here

GA4_DAILY_SHEET=Daily
GSC_DAILY_SHEET=Daily Site GSC
GSC_PAGE_QUERY_SHEET=Weekly Page GSC

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

The Google service account must have access to:

- The Google Sheet used by your existing automation.
- The GA4 properties listed in `data/properties.json`.
- The GSC properties listed in `data/properties.json`.

## Technical Health Access

Indexing checks use GSC URL Inspection API. If the service account is not an owner/user of the exact GSC property, the app will mark the check as `blocked`.

Core Web Vitals checks use PageSpeed Insights API. If the Google project has no quota, the app will mark the check as `blocked`.

Blocked means the app tried to collect the data but Google access/quota prevented it. It is not counted as a real SEO issue.

## Safety

`.env.local`, credential JSON files, raw imports, and generated snapshots are ignored by `.gitignore`.

Do not upload the credential JSON to GitHub.

Do not paste private keys into chat.

## Next Step

After `.env.local` is ready, ask Codex:

```text
Run the monitor for EN daily ending 2026-06-01.
```

Codex will use this order:

```text
existing snapshot -> local imports -> GA4/GSC APIs when missing -> OpenAI enrichment
```
