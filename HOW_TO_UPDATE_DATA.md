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

For now, the source files are CSV exports. Later we can connect this to Google Sheets or APIs directly.

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

Codex will run the generator and refresh the local snapshot files.

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

## Current Status

The EN subdomain already has generated local snapshots from sample CSV imports:

```text
data/snapshots/vidmud/en-www-vidmud-com/
```

These are still sample/import-demo numbers until you replace the CSV files with real exports.
