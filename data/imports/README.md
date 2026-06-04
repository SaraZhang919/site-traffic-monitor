# Local Data Imports

Put local CSV exports here when you want to generate real dashboard snapshots.

The first generator supports these files:

```text
ga4_daily.csv
gsc_daily.csv
gsc_page_query.csv
technical_health.csv
```

Only `ga4_daily.csv` and `gsc_daily.csv` are required for a basic snapshot.

## ga4_daily.csv

Expected columns, using the same style as `data-automation-vm`:

```text
Date,Lan,Subdomain,Session Organic Sessions,Session Organic Active Users,Session Organic New Users
```

Optional GA4 columns:

```text
Engagement Ratio,Average session duration,Key Event Counts
```

## gsc_daily.csv

Expected columns:

```text
Date,Lan,Subdomain,Clicks,Impressions,CTR,Position
```

`CTR` can be `1.8`, `1.8%`, or decimal `0.018`.

## gsc_page_query.csv

Optional. Used for query/title/meta and quick-win strategy sections.

Expected columns:

```text
Date,Lan,Subdomain,Page,Query,Clicks,Impressions,CTR,Position
```

## technical_health.csv

Optional. Used for indexing and Core Web Vitals status.

Expected columns:

```text
Date,Subdomain,Check,Status,Metric,Value,Issue,Source
```

Examples for `Check`:

```text
Indexing Abnormalities
Core Web Vitals
```

## Generate A Snapshot

From this project folder:

```text
node scripts/generate-snapshot.mjs --type daily --date 2026-06-03 --subdomain en-www-vidmud-com
node scripts/generate-snapshot.mjs --type weekly --date 2026-06-03 --subdomain en-www-vidmud-com
node scripts/generate-snapshot.mjs --type 28-days --date 2026-06-03 --subdomain en-www-vidmud-com
```

The generated files are written to:

```text
data/snapshots/vidmud/<subdomain-id>/<report-type>/
```
