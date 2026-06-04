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
- Use direct GA4/GSC APIs only when the selected report cannot be satisfied by an existing snapshot or local import.
- Use OpenAI enrichment only after numeric data is available, so the LLM explains and prioritizes data-backed findings rather than inventing metrics.

The first local data bridge uses CSV imports in:

```text
data/imports/
```

The generator is:

```text
scripts/generate-snapshot.mjs
```

The end-to-end local runner is:

```text
scripts/run-monitor.mjs
```

Default runner behavior:

```text
existing dated snapshot -> local CSV imports -> GA4/GSC API fallback -> snapshot generation -> OpenAI enrichment
```

The dashboard `Run Check` button calls:

```text
POST /api/run-monitor
```

through:

```text
server.mjs
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

## 28-Day Strategy Requirements

The 28 Days report should be a strategic planning report, not a larger daily report.

It must identify:

- Potential topic clusters from rolling 28-day GSC page/query data.
- Pillar topic candidates.
- Potential supporting article ideas.
- Existing pages worth optimizing.
- Internal link structure opportunities.
- External link support candidates.
- Technical debt signals, including indexed ratio when Screaming Frog data exists.
- Topic cluster decisions: invest, refresh, support, pause, or investigate.

Source rules:

- GSC/GA4 can suggest clusters, pages, and query opportunities.
- SEMrush/Ahrefs are needed for stronger competitor, ranking, backlink, and link velocity evidence.
- Screaming Frog is needed for exact internal link source pages, indexed ratio, crawl depth, and crawl technical debt.
- If SEMrush/Ahrefs/Screaming Frog are not connected, mark those source-dependent sections as `pending` instead of inventing findings.

For internal link recommendations, separate link positions:

- Count `Content` links as contextual/topical support.
- Keep `Navigation`, `Footer`, `Header`, `Aside`, and `Head` links as crawl/navigation evidence.
- Do not let navigation/footer links make a page look sufficiently supported for topic-cluster optimization.

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

## Technical Health

Indexing abnormalities should come from GSC URL Inspection API or a connected GSC indexing export.

Core Web Vitals should come from PageSpeed Insights API, CrUX, or another connected CWV source.

Technical health statuses:

- `good`: connected source did not find a priority issue.
- `watch` or `risk`: connected source found an issue.
- `pending` or `not connected`: source has not been connected yet.
- `blocked`: source was attempted, but Google permissions/quota prevented data collection.

Blocked technical checks should create a data-access action, not a fake SEO backlog item.

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
