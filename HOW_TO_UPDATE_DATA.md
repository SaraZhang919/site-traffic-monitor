# How To Update Dashboard Data

This version is local-first. Your GA/GSC data stays on your computer.

## What You Need To Know

The dashboard reads report files from:

```text
data/snapshots/
```

The generator reads source files from:

```text
data/imports/
```

The app can now use three local data paths:

```text
1. Existing dated snapshot JSON
2. Local CSV imports
3. Direct GA4/GSC API pull when the needed period is missing
```

## Step 1: Put Data Files In The Imports Folder

Put these files in:

```text
data/imports/
```

Required for basic reports:

```text
ga4_daily.csv
gsc_daily.csv
```

Optional but useful:

```text
gsc_page_query.csv
technical_health.csv
```

The sample files currently in that folder show the expected format.

## Step 2: Ask Codex To Generate The Report

You do not need to run commands yourself.

Tell Codex something like:

```text
Generate Daily report for EN, report end date 2026-06-03.
```

or:

```text
Generate Weekly report for EN.
```

or:

```text
Generate 28 Days report for EN ending 2026-06-03.
```

Codex will run the local monitor workflow and refresh the local snapshot files.

The default workflow is hybrid:

```text
existing snapshot first -> local imports -> GA4/GSC APIs only when needed -> OpenAI enrichment
```

When you click `Run Check` in the API-capable local dashboard, the app also attempts technical health collection:

```text
GSC URL Inspection API -> indexing abnormalities
PageSpeed Insights API -> Core Web Vitals
```

If Google permissions or quota are missing, the dashboard will show `blocked`. That means data access needs to be fixed; it is not a confirmed SEO issue.

## Step 3: Refresh The Browser

Open or refresh:

```text
http://127.0.0.1:4173/
```

Then select:

- Project
- Subdomain
- Daily / Weekly / 28 Days

## Important

If the dashboard still shows old numbers, refresh the browser page.

If the local server stopped, ask Codex:

```text
Start the dashboard again.
```

The API-capable local server uses:

```text
node server.mjs
```

If port `4173` is busy, Codex may start it on another local port such as:

```text
http://127.0.0.1:4174/
```

In the current local session, the API-capable server is running on:

```text
http://127.0.0.1:4174/
```

## Current Status

The EN subdomain has generated local snapshots from real local GA4/GSC data:

```text
data/snapshots/vidmud/en-www-vidmud-com/
```

Real GA4/GSC data and snapshots stay local and are ignored by GitHub.
