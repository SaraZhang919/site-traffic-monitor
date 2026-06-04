# Context

This file preserves the agreed product logic so future conversations do not need to restart from scratch.

## Product Intent

The project is an SEO-focused site traffic monitor for multiple subdomains/projects. It should help identify growth opportunities, decline risks, and the next SEO actions across content, backlinks, internal links, and technical SEO.

The system should feel like an SEO command center, not a static checklist.

## Confirmed UI

Use these report tabs:

```text
Daily / Weekly / 28 Days
```

Do not call the rolling report "4 Weeks" in the UI.

## Manual Checks

The app should support manual checking.

Controls:

```text
Report type: Daily / Weekly / 28 Days
Run mode: Latest available / Manual date
Report end date: date picker
Project/subdomain selector
Run Check
```

`Report end date` means the final date included in the report window.

For a 28 Days report:

```text
Current period = report_end_date - 27 days to report_end_date
Previous period = report_end_date - 55 days to report_end_date - 28 days
```

## Data Model

Each metric should support:

```text
metric
current value
primary baseline
secondary baseline when useful
absolute change
percentage change
baseline tier
threshold status
diagnosis
executable action
how-to / example
data source
confidence
```

## Baselines

Daily:

- Same day last week
- Previous 7-day average
- Optional previous day

Weekly:

- Current complete 7-day period vs previous 7-day period

28 Days:

- Current 28-day period vs previous 28-day period

## Thresholds

Use baseline tiers and require both absolute and percentage thresholds.

Example logic:

```text
trigger = abs_change_threshold_met && percent_change_threshold_met
```

This should apply to risks and opportunities.

## Data Source Principles

Existing automation should be reused where possible. Do not pull duplicate GA4/GSC data if the existing workflow already produced the needed date range, subdomain, dimensions, and filters.

The existing automation repo writes to Google Sheets via `SHEET_ID`.

For the monitor app:

- Read existing normalized/source data when available.
- Fetch missing data only when needed.
- Generate local report snapshots.
- Dashboard reads local snapshots.

The first local data bridge uses CSV imports in:

```text
data/imports/
```

The generator is:

```text
scripts/generate-snapshot.mjs
```

Generated snapshots are subdomain-specific:

```text
data/snapshots/<project>/<subdomain>/<report-type>/
```

The dashboard first tries subdomain-specific snapshots, then falls back to project-level sample snapshots.

## URL Normalization

Create a normalized reporting key by stripping query strings and fragments.

Example:

```text
/video-enhancer.html?insur=enseo -> /video-enhancer.html
```

This is not the same as scraping the page canonical tag. HTML canonical collection can be added later through Screaming Frog or page crawl data.

## Top Page And Query Strategy

Default pulls should be focused:

- Daily: top 30 pages plus priority/abnormal pages
- Weekly: top 100 pages plus priority pages, ranking 8-20, CTR/risk/opportunity pages
- 28 Days: top 250-500 pages plus priority/action-history pages

Manual deep audit can pull broader/full data when needed.

## Action Logic

Actions should be executable or prepared where possible.

Action types:

- Check top landing pages / GSC index
- Find low CTR and rising impression queries
- Generate title/meta suggestions
- Check SERP changes
- Add quick-win queue items
- Generate content refresh briefs
- Generate internal link suggestions
- Prepare technical SEO backlog
- Run/parse Screaming Frog crawl

Weekly action output should include what happened, why it matters, what to do, how to do it, examples, and expected impact.

## Schedule

Existing data automation:

- Daily GA4/GSC: 4 PM JST daily
- Weekly GA4: 4 PM JST Sunday
- Weekly GSC: 4 PM JST Tuesday

Monitor snapshots:

- Daily: 5 PM JST daily
- Weekly: 5 PM JST Tuesday
- 28 Days: manual by report end date, optional Tuesday 5:30 PM JST

## Sharing

Keep first version local-first because GA data is private.

For team sharing, start with exported HTML/PDF reports. Private hosted dashboard sharing can be added later with authentication and private storage.
