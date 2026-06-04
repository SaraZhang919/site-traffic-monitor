# Local Data Imports

Put local CSV exports here when you want to generate real dashboard snapshots.

The first generator supports these files:

```text
ga4_daily.csv
gsc_daily.csv
gsc_page_query.csv
technical_health.csv
ahrefs_pages.csv
semrush_keywords.csv
screaming_frog_pages.csv
screaming_frog_internal_links.csv
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

## ahrefs_pages.csv

Optional. Used for external link support, referring-domain gap, and link velocity.

Expected useful columns:

```text
Page,Referring Domains,Backlinks,New Links,Lost Links,Link Velocity
```

## semrush_keywords.csv

Optional. Used for competitor/ranking enrichment and topic validation.

Expected useful columns:

```text
Keyword,Position,Previous Position,Volume,KD,URL,Competitor
```

## screaming_frog_pages.csv

Optional. Used for indexed ratio, crawl depth, technical debt, and low-inlink pages.

Expected useful columns:

```text
Address,Status Code,Indexability,Canonical Link Element 1,Title 1,Meta Description 1,Word Count,Inlinks,Crawl Depth
```

## screaming_frog_internal_links.csv

Optional. Used for exact internal link source pages and anchor opportunities.

Expected useful columns:

```text
Source,Destination,Anchor,Status Code,Follow,Type
```

## Run Screaming Frog Locally

Screaming Frog SEO Spider is installed locally at:

```text
D:\Screaming Frog SEO Spider\ScreamingFrogSEOSpiderCli.exe
```

Codex can run the local CLI directly with:

```text
node scripts/run-screaming-frog.mjs --url https://www.vidmud.com/ --date 2026-06-04 --subdomain www.vidmud.com
```

The runner exports raw crawl files to a plain ASCII temp folder by default, because Screaming Frog may not handle emoji characters in the project path:

```text
%TEMP%\site-traffic-monitor-screaming-frog\
```

Then it updates:

```text
data/imports/screaming_frog_pages.csv
data/imports/screaming_frog_internal_links.csv
```

After that, regenerate the 28-day snapshot so internal link structure, indexed ratio, crawl depth, and technical debt can use real crawl data.

For SEO optimization recommendations, the app treats Screaming Frog `Link Position = Content` as contextual internal links. Navigation, footer, header, aside, and head links are still shown as crawl evidence, but they are not counted as topical support.

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
