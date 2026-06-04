# Credentials Setup

Please do not paste Google credentials or private keys into chat.

Use this local setup instead.

## What I Need From You

You can provide these two safe pieces of information:

```text
1. The local file path where your Google service account JSON is saved.
2. The Google Sheet ID used by your existing automation.
```

Example path:

```text
C:\Users\Tiziana\Desktop\AI agent\google-service-account.json
```

Example Sheet ID location:

```text
https://docs.google.com/spreadsheets/d/<THIS_IS_THE_SHEET_ID>/edit
```

## Local File Setup

Create a file named:

```text
.env.local
```

in this project folder:

```text
D:\AI Projects\Vidmud\Site Traffic Monitor
```

Use this format:

```text
GOOGLE_SERVICE_ACCOUNT_FILE=C:\Users\Tiziana\Desktop\AI agent\google-service-account.json
GOOGLE_SHEET_ID=your_google_sheet_id_here

GA4_DAILY_SHEET=Daily
GSC_DAILY_SHEET=Daily Site GSC
GSC_PAGE_QUERY_SHEET=Weekly Page GSC
```

## Safety

`.env.local` and credential JSON files are ignored by `.gitignore`.

Do not put service account JSON inside chat.

Do not upload the credential JSON to a public GitHub repo.

## Next Step

After `.env.local` is ready, ask Codex:

```text
Fetch Google Sheets data and generate snapshots.
```

Codex will:

1. Read the Google Sheet into local CSV files in `data/imports/`.
2. Generate dashboard snapshots.
3. Tell you to refresh the local dashboard.
