# Site Traffic Monitor

Local-first interactive SEO traffic monitoring dashboard for multiple projects and subdomains.

## Purpose

This app monitors organic search performance and turns the data into risks, opportunities, diagnoses, and executable SEO actions.

It is not only a checklist. Each report should answer:

- What changed?
- How large is the change in absolute value and percentage?
- Is the change meaningful based on baseline tier thresholds?
- What is the likely cause?
- What action should be executed or prepared next?

## Report Cycles

The UI uses three report tabs:

- Daily
- Weekly
- 28 Days

Daily focuses on anomalies and immediate opportunities.

Weekly focuses on trend diagnosis and an action queue.

28 Days uses rolling 28-day comparison, not a natural month.

## Data Privacy

GA4, GSC, and SEO data should stay local for the first version.

The dashboard reads local JSON report snapshots. It should not expose raw GA data publicly.

Private files are intentionally local-only:

- `.env.local`
- Google credential JSON files
- `data/imports/*.csv`
- `data/imports/source_metadata.json`
- `data/snapshots/`

These files are ignored by GitHub.

Suggested snapshot structure:

```text
data/
  snapshots/
    vidmud/
      daily/
        daily-2026-06-03.json
        latest.json
      weekly/
        weekly-2026-06-02.json
        latest.json
      28-days/
        28-days-2026-06-03.json
        latest.json
```

Dated files preserve report history. `latest.json` lets the dashboard load the newest report quickly.

## Core Data Sources

- GA4: organic traffic and page behavior
- GSC: search performance by page and query
- Google Sheets: existing normalized automation output when available
- Ahrefs: backlinks, keyword and competitor enrichment
- SEMrush: competitor and ranking enrichment through browser/intermediate-site access
- Screaming Frog: local technical SEO crawling and exports
- GSC URL Inspection API: indexing abnormality checks
- PageSpeed Insights API: Core Web Vitals checks
- OpenAI API: SEO diagnosis and action enrichment

GA4 organic traffic should use:

```text
sessionDefaultChannelGroup = Organic Search
```

GA4 metrics include:

- sessions
- activeUsers
- engagedSessions
- engagementRate
- newUsers
- keyEvents / conversions
- landingPagePlusQueryString

GSC metrics include:

- clicks
- impressions
- CTR
- position
- page
- query

## Page Normalization

The app uses a normalized reporting key for pages.

Example:

```text
/video-enhancer.html
/video-enhancer.html?insur=enseo
```

Both should be grouped as:

```text
/video-enhancer.html
```

This is a reporting normalization step. It does not mean scraping the HTML canonical tag by default.

## Baselines

Reports must include both absolute change and percentage change.

Daily baselines:

- Primary: same day last week
- Secondary: previous 7-day average
- Optional: previous day

Weekly baseline:

- Current complete 7-day period vs previous 7-day period

28 Days baseline:

- Current 28-day period vs previous 28-day period

`Report end date` is the last day of the report period.

Example:

```text
Report end date: 2026-06-03

Current 28 days:
2026-05-07 to 2026-06-03

Previous 28 days:
2026-04-09 to 2026-05-06
```

## Thresholds

Threshold logic should use baseline tiers. A risk or opportunity should trigger only when both conditions are met:

- Percentage change exceeds the tier threshold
- Absolute change exceeds the tier threshold

This prevents low-volume pages from creating noisy alerts and lets high-volume pages use more sensitive rules.

## Top Pages And Queries

The app should not pull all pages and queries by default.

Default approach:

- Daily: top 30 pages, priority pages, abnormal pages
- Weekly: top 100 pages, priority pages, ranking 8-20 pages, CTR/risk/opportunity pages
- 28 Days: top 250-500 pages, priority pages, action-history pages

Manual deep audit can pull broader data when needed.

## 28-Day Strategy Output

The 28 Days report is for strategic SEO planning. It should include:

- Potential topic clusters.
- Pillar topic candidates.
- Potential supporting article ideas.
- Existing pages worth optimizing.
- Internal link structure opportunities.
- External link support candidates.
- Technical debt and indexed-ratio signals.
- Topic cluster decisions for the next cycle.

GSC/GA4 are enough to suggest clusters, pages, and query opportunities. SEMrush/Ahrefs/Screaming Frog are separate evidence layers:

- SEMrush: competitor and ranking enrichment.
- Ahrefs: referring domains, backlink support, and link velocity.
- Screaming Frog: internal link source pages, indexed ratio, crawl depth, and technical debt.

When these files are not connected, the app should show `pending` and explain what data is missing instead of pretending the link or crawl analysis is complete.

## Actions

Actions can be automatically executed or prepared.

Confirmed action types:

- Check top landing pages / GSC index
- Find queries with low CTR but rising impressions
- Generate title/meta optimization suggestions
- Check SERP changes through browser workflow
- Add page/query to quick-win optimization queue
- Generate content refresh brief
- Generate internal link suggestions
- Prepare technical SEO issue queue
- Run and parse Screaming Frog crawl

Weekly actions should include:

- What happened
- Why it matters
- What to do
- How to do it
- Example
- Expected impact

## Existing Automation

Existing repo:

```text
SaraZhang919/data-automation-vm
```

Known schedules:

- `daily.yml`: every day 4 PM JST, Daily GA4 + Daily Site GSC
- `weekly_sunday.yml`: Sunday 4 PM JST, Weekly Site GA4 + Weekly Page GA4
- `weekly_tuesday.yml`: Tuesday 4 PM JST, Weekly Page GSC + Brand GSC + Site GSC
- `monthly.yml`: old monthly/4-week workflow, no longer the preferred model for this app

The existing workflows write to Google Sheets through `SHEET_ID`. The monitor app should reuse existing GA4/GSC data when available and avoid duplicate API pulls.

## Data Collection Flow

The local monitor workflow is hybrid by default:

```text
existing dated snapshot -> local CSV imports -> direct GA4/GSC API pull when missing -> OpenAI enrichment
```

This means the app does not fetch everything from APIs every time. It first checks whether the selected report date already has a usable snapshot, then checks whether local imported data covers the required comparison period. APIs are used only when the local data is missing or incomplete.

Technical health is separate:

- Indexing abnormalities use GSC URL Inspection API.
- Core Web Vitals use PageSpeed Insights API.
- If Google permissions or quota are missing, the dashboard shows `blocked`.
- `blocked` means data access failed; it is not treated as a confirmed SEO problem.

## Local Run

For a static preview, the app can be served as plain files.

For the real `Run Check` button, use the local Node server:

```text
node server.mjs
```

Then open:

```text
http://127.0.0.1:4173/
```

If port `4173` is already busy, use another local port:

```text
PORT=4174 node server.mjs
```

and open:

```text
http://127.0.0.1:4174/
```

## Run Schedule

Recommended monitor snapshot schedule:

- Daily: every day 5 PM JST
- Weekly: every Tuesday 5 PM JST
- 28 Days: manual check by report end date, with optional Tuesday 5:30 PM JST scheduled check

28 Days should not depend on the old monthly workflow.

## Sharing

First version should be local-first.

For sharing with a small team, prefer exporting HTML/PDF reports first. Private hosted dashboard sharing can be added later with proper authentication and private storage.
