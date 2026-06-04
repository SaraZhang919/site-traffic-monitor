# Changelog

All notable project decisions and version changes should be recorded here.

## 0.1.0 - Planning Baseline

Confirmed the first-version direction before implementation.

### Confirmed

- Build a local-first interactive SEO traffic monitoring dashboard.
- Use UI tabs: Daily, Weekly, 28 Days.
- Use rolling 28-day comparison instead of monthly reporting.
- Store final report snapshots locally.
- Include checking/report date in snapshot filenames.
- Preserve `latest.json` for quick dashboard loading.
- Use GA4 `sessionDefaultChannelGroup = Organic Search` for organic sessions.
- Include GA4 `activeUsers` as a core metric.
- Join GA4 page behavior data with GSC page/query search performance.
- Normalize page URLs by stripping query strings and fragments for reporting.
- Include both absolute change and percentage change in reports.
- Use tiered threshold logic based on baseline size.
- Avoid pulling all pages/queries by default.
- Support manual deep checks when broader pulls are needed.
- Generate executable or prepared SEO actions, not only recommendations.
- Reuse existing `SaraZhang919/data-automation-vm` data where possible.
- Do not rely on the old monthly workflow for 28-day reporting.

### Open For Build

- Implement local snapshot schema.
- Implement dashboard UI.
- Implement manual check controls.
- Implement URL normalization.
- Implement threshold tier engine.
- Implement local data loading and report rendering.
- Add export/share workflow later.

## 0.2.0 - Local Dashboard Scaffold

Built the first local static dashboard.

### Added

- `index.html` dashboard shell.
- `styles.css` responsive local-first interface.
- `app.js` snapshot loading, report switching, manual check period logic, URL normalization, and JSON export.
- Local sample snapshots for Daily, Weekly, and 28 Days.
- Dated snapshot files plus `latest.json` quick-load files.

### Verified

- JSON snapshot files parse successfully.
- Local server returns `200` for the dashboard, JavaScript, CSS, and snapshot data.
- JavaScript passes syntax parsing.
- UI text uses `28 Days`, not `4 Weeks`.

## 0.2.1 - Properties Selector

### Added

- Added `data/properties.json` from `Properties.xlsx`.
- Updated the dashboard subdomain selector to load the local property list.
- Added language labels for EN, DE, FR, ES, IT, JP, TW, AR, KR, and PT.

### Note

- The PT row in the workbook has `pt.vidumud.com` as Subdomain URL and `https://pt.vidmud.com` as GSC property. The app preserves the workbook value and records the mismatch in `data/properties.json`.

## 0.2.2 - SEO Strategy Plan

### Added

- Added a dedicated `SEO Strategy Plan` section.
- Added visible strategy buckets for pages to refresh, title/meta queries, internal link targets, new content topics, backlink support, technical SEO backlog, and topic cluster decisions.
- Added sample strategy data to Daily, Weekly, and 28 Days snapshots.

### Fixed

- Non-URL action targets now stay as text instead of being normalized as page paths.

## 0.2.3 - Technical Health Checks

### Added

- Added a dedicated `Technical Health Checks` section.
- Added Indexing Abnormalities cadence by report cycle.
- Added Core Web Vitals cadence by report cycle.
- Added sample technical check data to Daily, Weekly, and 28 Days snapshots.

## 0.2.4 - Cadence-Specific Focus

### Added

- Added a `Report Focus` band near the top of the dashboard.
- Daily now emphasizes abnormal movement and urgent fixes.
- Weekly now emphasizes optimization queue and how-to actions.
- 28 Days now emphasizes strategy, resource allocation, and topic cluster decisions.

## 0.3.0 - Local Snapshot Generator

### Added

- Added `scripts/generate-snapshot.mjs`.
- Added local import folder and sample CSV files.
- Added support for subdomain-specific snapshots under `data/snapshots/<project>/<subdomain>/<report-type>/`.
- Added URL normalization, period calculation, KPI deltas, baseline tiers, threshold status, action generation, strategy buckets, and technical checks in the generator.
- Added `HOW_TO_UPDATE_DATA.md` for non-coder usage.

### Changed

- Dashboard now tries to load subdomain-specific snapshots first, then falls back to project-level sample snapshots.

### Verified

- Generated Daily, Weekly, and 28 Days snapshots for `en-www-vidmud-com`.
- Verified generated JSON parses successfully.
- Verified the local server serves generated snapshot files.

## 0.3.1 - Credential Setup And Sheets Fetcher

### Added

- Added `.gitignore` for local secrets and credential files.
- Added `.env.example`.
- Added `CREDENTIALS_SETUP.md`.
- Added `scripts/fetch-google-sheets.mjs` to fetch existing Google Sheets data into local import CSV files.

### Security

- Credentials stay local.
- The user should provide a local credential file path and Google Sheet ID, not paste private keys into chat.
