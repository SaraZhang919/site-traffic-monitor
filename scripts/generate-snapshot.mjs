import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const importsDir = path.join(root, "data", "imports");
const snapshotsDir = path.join(root, "data", "snapshots");
const propertiesPath = path.join(root, "data", "properties.json");

const args = parseArgs(process.argv.slice(2));
const reportType = args.type || "daily";
const reportEndDate = args.date || todayIso();
const projectId = args.project || "vidmud";
const subdomainId = args.subdomain || "en-www-vidmud-com";

const properties = readJson(propertiesPath);
const project = properties.projects.find((item) => item.id === projectId) || properties.projects[0];
const subdomain = project.subdomains.find((item) => item.id === subdomainId) || project.subdomains[0];

const ga4Rows = readCsvIfExists(path.join(importsDir, "ga4_daily.csv"));
const gscRows = readCsvIfExists(path.join(importsDir, "gsc_daily.csv"));
const queryRows = readCsvIfExists(path.join(importsDir, "gsc_page_query.csv"));
const technicalRows = readCsvIfExists(path.join(importsDir, "technical_health.csv"));

const periods = calculatePeriods(reportType, reportEndDate);
const ga4Current = aggregateGa4(ga4Rows, subdomain.host, periods.current);
const ga4Baseline = aggregateGa4(ga4Rows, subdomain.host, periods.baseline);
const gscCurrent = aggregateGsc(gscRows, subdomain.host, periods.current);
const gscBaseline = aggregateGsc(gscRows, subdomain.host, periods.baseline);
const pageQueries = queryRows.filter((row) => hostMatches(row.Subdomain, subdomain.host) && inPeriod(row.Date, periods.current));
const technicalChecks = buildTechnicalChecks(technicalRows, subdomain.host, periods.current, reportType);

const snapshot = buildSnapshot({
  reportType,
  reportEndDate,
  project,
  subdomain,
  periods,
  ga4Current,
  ga4Baseline,
  gscCurrent,
  gscBaseline,
  pageQueries,
  technicalChecks
});

writeSnapshot(snapshot, projectId, subdomainId, reportType, reportEndDate);
console.log(`Generated ${snapshot.snapshotName}`);

function buildSnapshot(input) {
  const { reportType, reportEndDate, project, subdomain, periods, ga4Current, ga4Baseline, gscCurrent, gscBaseline, pageQueries, technicalChecks } = input;
  const kpis = [
    buildKpi("organic-sessions", "Organic Sessions", ga4Current.sessions, ga4Baseline.sessions, "GA4"),
    buildKpi("active-users", "Active Users", ga4Current.activeUsers, ga4Baseline.activeUsers, "GA4"),
    buildKpi("gsc-clicks", "GSC Clicks", gscCurrent.clicks, gscBaseline.clicks, "GSC"),
    buildKpi("impressions", "Impressions", gscCurrent.impressions, gscBaseline.impressions, "GSC")
  ];

  const lowCtrQueries = pageQueries.map(normalizeQueryRow).filter((row) => row.impressions >= 1000 && row.ctr < 1.5).sort((a, b) => b.impressions - a.impressions);
  const quickWins = pageQueries.map(normalizeQueryRow).filter((row) => row.position >= 8 && row.position <= 20 && row.impressions >= 1000).sort((a, b) => b.impressions - a.impressions);
  const topPages = topByPage(pageQueries);
  const topQueries = pageQueries.map(normalizeQueryRow).sort((a, b) => b.impressions - a.impressions).slice(0, 8).map((row) => ({
    query: row.query,
    metric: `${formatNumber(row.impressions)} impressions - position ${round(row.position, 1)}`,
    status: row.ctr < 1.5 ? "opportunity" : "good"
  }));

  const risks = [];
  const opportunities = [];
  const sessionKpi = kpis.find((item) => item.id === "organic-sessions");
  if (sessionKpi.status === "risk" || sessionKpi.status === "critical") {
    risks.push({
      title: "Organic sessions declined against baseline",
      target: topPages[0]?.path || subdomain.host,
      diagnosis: "Traffic impact crossed the tiered threshold. Check whether the movement is page-specific, query-specific, or technical.",
      actionType: "Check Top Landing Pages / GSC Index"
    });
  }
  if (lowCtrQueries.length) {
    opportunities.push({
      title: "Low CTR queries with meaningful impressions",
      target: lowCtrQueries[0].page,
      diagnosis: "Search visibility exists, but snippets may not match query intent strongly enough.",
      actionType: "Generate Title / Meta Suggestions"
    });
  }

  return {
    reportType,
    project: project.name,
    subdomain: subdomain.host,
    snapshotName: `${reportType}-${reportEndDate}.json`,
    generatedAt: new Date().toISOString(),
    currentPeriod: periods.current,
    baselinePeriod: periods.baseline,
    freshness: "Generated from local CSV imports",
    health: chooseHealth(kpis, technicalChecks),
    focus: focusForReport(reportType),
    dataSources: [
      { source: "GA4", status: ga4Rows.length ? "ready" : "missing", detail: "Local ga4_daily.csv" },
      { source: "GSC", status: gscRows.length ? "ready" : "missing", detail: "Local gsc_daily.csv" },
      { source: "GSC Page + Query", status: pageQueries.length ? "ready" : "missing", detail: "Local gsc_page_query.csv" },
      { source: "Technical Health", status: technicalChecks.length ? "ready" : "pending", detail: "Local technical_health.csv" }
    ],
    kpis,
    risks,
    opportunities,
    actions: buildActions(lowCtrQueries, quickWins, topPages, technicalChecks),
    strategyPlan: buildStrategyPlan(reportType, lowCtrQueries, quickWins, topPages, technicalChecks),
    technicalChecks,
    topPages,
    topQueries
  };
}

function buildKpi(id, label, value, baseline, source) {
  const absChange = value - baseline;
  const pctChange = baseline ? (absChange / baseline) * 100 : 0;
  const tier = baselineTier(baseline);
  const status = classifyChange(absChange, pctChange, baseline, id === "impressions" ? "opportunity" : "risk");
  return { id, label, value: round(value, 2), baseline: round(baseline, 2), absChange: round(absChange, 2), pctChange: round(pctChange, 1), tier, status, source };
}

function classifyChange(absChange, pctChange, baseline, positiveType) {
  const abs = Math.abs(absChange);
  const pct = Math.abs(pctChange);
  const tier = baselineTier(baseline);
  const rules = {
    Tiny: { watchPct: 0, watchAbs: 10, riskPct: 0, riskAbs: 20, criticalPct: 0, criticalAbs: 35 },
    Small: { watchPct: 20, watchAbs: 20, riskPct: 30, riskAbs: 40, criticalPct: 45, criticalAbs: 70 },
    Medium: { watchPct: 10, watchAbs: 50, riskPct: 20, riskAbs: 120, criticalPct: 35, criticalAbs: 250 },
    Large: { watchPct: 8, watchAbs: 150, riskPct: 15, riskAbs: 500, criticalPct: 25, criticalAbs: 1500 },
    "Very Large": { watchPct: 5, watchAbs: 1000, riskPct: 10, riskAbs: 2500, criticalPct: 20, criticalAbs: 7500 }
  }[tier];
  if (absChange > 0) {
    if (pct >= rules.watchPct && abs >= rules.watchAbs) return positiveType === "opportunity" ? "opportunity" : "good";
    return "good";
  }
  if (pct >= rules.criticalPct && abs >= rules.criticalAbs) return "critical";
  if (pct >= rules.riskPct && abs >= rules.riskAbs) return "risk";
  if (pct >= rules.watchPct && abs >= rules.watchAbs) return "watch";
  return "good";
}

function baselineTier(value) {
  if (value <= 50) return "Tiny";
  if (value <= 200) return "Small";
  if (value <= 1000) return "Medium";
  if (value <= 10000) return "Large";
  return "Very Large";
}

function buildActions(lowCtrQueries, quickWins, topPages, technicalChecks) {
  const actions = [];
  if (topPages.length) actions.push({ priority: "P1", action: "Check Top landing pages / GSC index", target: topPages[0].path, howTo: "Compare page-level GA4 and GSC movement, then check GSC indexing status for the normalized page.", output: "Page risk note and index status" });
  if (lowCtrQueries.length) actions.push({ priority: "P1", action: "Generate title/meta suggestions", target: lowCtrQueries[0].page, howTo: `Use top query "${lowCtrQueries[0].query}" plus related queries to create 3 title/meta variants.`, output: "Title/meta rewrite options" });
  if (quickWins.length) actions.push({ priority: "P2", action: "Add quick-win optimization queue item", target: quickWins[0].query, howTo: "Prioritize high-impression queries in position 8-20 for content updates and internal links.", output: "Weekly quick-win queue" });
  if (technicalChecks.some((item) => item.status !== "good")) actions.push({ priority: "P2", action: "Prepare technical SEO backlog", target: "Indexing / Core Web Vitals", howTo: "Review technical health checks and attach affected URL groups before prioritizing fixes.", output: "Technical SEO backlog" });
  return actions;
}

function buildStrategyPlan(reportType, lowCtrQueries, quickWins, topPages, technicalChecks) {
  const topPage = topPages[0]?.path || "/priority-page.html";
  const query = lowCtrQueries[0]?.query || quickWins[0]?.query || "priority query";
  return [
    { category: "Pages To Refresh", status: topPages.length ? "risk" : "watch", items: [{ target: topPage, reason: "Priority page needs review based on traffic/search movement.", nextStep: "Create refresh brief and compare current SERP intent." }] },
    { category: "Title / Meta Queries", status: lowCtrQueries.length ? "opportunity" : "watch", items: [{ target: query, reason: "Use page+query data to detect low CTR or high-impression opportunities.", nextStep: "Generate title/meta variants and check SERP pattern." }] },
    { category: "Internal Link Targets", status: quickWins.length ? "opportunity" : "watch", items: [{ target: quickWins[0]?.page || topPage, reason: "Quick-win or priority pages should receive contextual internal links.", nextStep: "Add 3-5 links from related pages with varied anchors." }] },
    { category: "New Content Topics", status: reportType === "28-days" ? "good" : "watch", items: [{ target: "emerging query cluster", reason: "Use 28-day query movement to decide new content topics.", nextStep: reportType === "28-days" ? "Draft a new content brief." : "Collect query evidence until weekly/28-day review." }] },
    { category: "Backlink Support", status: reportType === "28-days" ? "watch" : "good", items: [{ target: topPage, reason: "Strategic pages may need authority support after content and internal links are planned.", nextStep: "Review Ahrefs referring domain gap." }] },
    { category: "Technical SEO Backlog", status: technicalChecks.some((item) => item.status !== "good") ? "watch" : "good", items: [{ target: "Indexing / Core Web Vitals", reason: "Technical checks decide whether issues enter the backlog.", nextStep: "Validate in GSC and Screaming Frog before assigning fixes." }] },
    { category: "Topic Cluster Decisions", status: reportType === "28-days" ? "good" : "watch", items: [{ target: "priority topic cluster", reason: "Cadence-specific report decides whether to invest, pause, refresh, or fix.", nextStep: reportType === "28-days" ? "Allocate next 28-day SEO resources." : "Wait for weekly/28-day trend confirmation." }] }
  ];
}

function buildTechnicalChecks(rows, host, period, reportType) {
  const filtered = rows.filter((row) => hostMatches(row.Subdomain, host) && inPeriod(row.Date, period));
  if (!filtered.length) return defaultTechnicalChecks(reportType);
  return ["Indexing Abnormalities", "Core Web Vitals"].map((check) => {
    const first = filtered.find((row) => row.Check === check);
    if (!first) return defaultTechnicalChecks(reportType).find((item) => item.check === check);
    return { check, frequency: technicalFrequency(check, reportType), status: normalizeStatus(first.Status || "watch"), source: first.Source || (check === "Core Web Vitals" ? "GSC Core Web Vitals" : "GSC Page Indexing"), purpose: `${first.Metric || "Issue"}: ${first.Value || "-"}; ${first.Issue || "Review affected URL groups."}` };
  });
}

function defaultTechnicalChecks(reportType) {
  return [
    { check: "Indexing Abnormalities", frequency: technicalFrequency("Indexing Abnormalities", reportType), status: "watch", source: "GSC Page Indexing / URL Inspection / sitemap counts", purpose: "Catch sudden noindex, 404, redirect, canonical, crawled-not-indexed, discovered-not-indexed, and server error issues." },
    { check: "Core Web Vitals", frequency: technicalFrequency("Core Web Vitals", reportType), status: "watch", source: "GSC Core Web Vitals / CrUX / PageSpeed when needed", purpose: "Track Poor and Needs Improvement URL groups for LCP, INP, and CLS." }
  ];
}

function technicalFrequency(check, reportType) {
  if (check === "Indexing Abnormalities") {
    if (reportType === "daily") return "Daily watch + weekly diagnosis";
    if (reportType === "weekly") return "Weekly diagnosis, with daily critical alerts";
    return "28-day strategic review";
  }
  if (reportType === "daily") return "Weekly trend + 28-day planning";
  if (reportType === "weekly") return "Weekly trend review";
  return "28-day planning";
}

function chooseHealth(kpis, technicalChecks) {
  if (kpis.some((item) => item.status === "critical")) return "critical";
  if (kpis.some((item) => item.status === "risk")) return "risk";
  if (technicalChecks.some((item) => item.status === "risk" || item.status === "critical")) return "risk";
  if (kpis.some((item) => item.status === "watch") || technicalChecks.some((item) => item.status === "watch")) return "watch";
  return "good";
}

function aggregateGa4(rows, host, period) {
  const filtered = rows.filter((row) => hostMatches(row.Subdomain, host) && inPeriod(row.Date, period));
  return {
    sessions: sum(filtered, ["Session Organic Sessions", "Organic Channel sessions", "Organic Sessions", "Sessions"]),
    activeUsers: sum(filtered, ["Session Organic Active Users", "Organic channel active users", "Organic Active Users", "Active Users"]),
    newUsers: sum(filtered, ["Session Organic New Users", "Organic channel new users", "Organic New Users", "New Users"]),
    keyEvents: sum(filtered, ["Key Event Counts", "Key Events", "Conversions"])
  };
}

function aggregateGsc(rows, host, period) {
  const filtered = rows.filter((row) => hostMatches(row.Subdomain, host) && inPeriod(row.Date, period));
  const clicks = sum(filtered, ["Clicks"]);
  const impressions = sum(filtered, ["Impressions"]);
  const positionValues = filtered.map((row) => toNumber(row.Position)).filter((value) => value > 0);
  return { clicks, impressions, ctr: impressions ? (clicks / impressions) * 100 : 0, position: average(positionValues) };
}

function topByPage(rows) {
  const grouped = new Map();
  rows.map(normalizeQueryRow).forEach((row) => {
    const existing = grouped.get(row.page) || { path: row.page, clicks: 0, impressions: 0 };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    grouped.set(row.page, existing);
  });
  return [...grouped.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 8).map((row) => ({ path: row.path, metric: `${formatNumber(row.clicks)} clicks - ${formatNumber(row.impressions)} impressions`, status: row.impressions >= 1000 && row.clicks / row.impressions < 0.015 ? "opportunity" : "good" }));
}

function normalizeQueryRow(row) {
  return { page: normalizePath(row.Page || row["Page Url"] || row.URL || ""), query: row.Query || row.query || "", clicks: toNumber(row.Clicks), impressions: toNumber(row.Impressions), ctr: toCtrPercent(row.CTR), position: toNumber(row.Position) };
}

function calculatePeriods(type, endDate) {
  const end = parseDate(endDate);
  if (type === "daily") {
    const baseline = addDays(end, -7);
    return { current: { start: formatDate(end), end: formatDate(end) }, baseline: { label: "Same day last week", start: formatDate(baseline), end: formatDate(baseline) } };
  }
  if (type === "weekly") {
    const currentEnd = previousSaturday(end);
    const currentStart = addDays(currentEnd, -6);
    const baselineEnd = addDays(currentStart, -1);
    const baselineStart = addDays(baselineEnd, -6);
    return { current: { start: formatDate(currentStart), end: formatDate(currentEnd) }, baseline: { label: "Previous complete 7 days", start: formatDate(baselineStart), end: formatDate(baselineEnd) } };
  }
  const currentStart = addDays(end, -27);
  const baselineEnd = addDays(end, -28);
  const baselineStart = addDays(end, -55);
  return { current: { start: formatDate(currentStart), end: formatDate(end) }, baseline: { label: "Previous 28 days", start: formatDate(baselineStart), end: formatDate(baselineEnd) } };
}

function writeSnapshot(snapshot, projectId, subdomainId, reportType, date) {
  const dir = path.join(snapshotsDir, projectId, subdomainId, reportType);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${reportType}-${date}.json`), JSON.stringify(snapshot, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(snapshot, null, 2) + "\n");
}

function readCsvIfExists(file) {
  if (!fs.existsSync(file)) return [];
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i++; row.push(cell); if (row.some((value) => value !== "")) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function parseArgs(values) { const parsed = {}; for (let i = 0; i < values.length; i++) { if (values[i].startsWith("--")) { parsed[values[i].slice(2)] = values[i + 1]; i++; } } return parsed; }
function sum(rows, names) { return rows.reduce((total, row) => total + toNumber(firstValue(row, names)), 0); }
function firstValue(row, names) { for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name]; return 0; }
function toNumber(value) { if (value === undefined || value === null || value === "") return 0; return Number(String(value).replace(/[%,$,\s]/g, "")) || 0; }
function toCtrPercent(value) { const number = toNumber(value); if (String(value).includes("%")) return number; if (number > 0 && number < 1) return number * 100; return number; }
function average(values) { return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0; }
function inPeriod(value, period) { return value >= period.start && value <= period.end; }
function hostMatches(value, host) { return String(value || "").replace(/^https?:\/\//, "").replace(/\/$/, "") === host; }
function normalizePath(value) { if (!value) return ""; try { const parsed = String(value).startsWith("http") ? new URL(value) : new URL(value, "https://local.example"); return parsed.pathname || "/"; } catch { return String(value).split("?")[0].split("#")[0]; } }
function previousSaturday(date) { const day = date.getUTCDay(); const daysBack = day === 6 ? 7 : (day + 1) % 7; return addDays(date, -daysBack); }
function parseDate(value) { const [year, month, day] = value.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day)); }
function addDays(date, days) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
function formatDate(date) { return date.toISOString().slice(0, 10); }
function todayIso() { return formatDate(new Date()); }
function round(value, decimals = 0) { const factor = 10 ** decimals; return Math.round((Number(value) + Number.EPSILON) * factor) / factor; }
function formatNumber(value) { return Math.round(Number(value || 0)).toLocaleString("en-US"); }
function normalizeStatus(status) { const value = String(status || "").toLowerCase(); if (["critical", "risk", "watch", "good", "opportunity"].includes(value)) return value; return "watch"; }
function focusForReport(type) {
  const focus = {
    daily: { primary: "Detect abnormal SEO movement fast", bestFor: "Critical page drops, index issues, sudden CTR or click changes", output: "Today: observe, investigate, or execute urgent fix" },
    weekly: { primary: "Prioritize optimization work", bestFor: "Pages to refresh, queries to rewrite, internal links, quick wins", output: "This week: concrete SEO action queue with how-to steps" },
    "28-days": { primary: "Plan SEO resource allocation", bestFor: "Topic clusters, new content, backlink support, technical backlog", output: "Next 28 days: invest, pause, refresh, or fix" }
  };
  return focus[type] || focus.daily;
}
