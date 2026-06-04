import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const reportType = args.type || "weekly";
const date = args.date || todayIso();
const project = args.project || "vidmud";
const subdomainId = args.subdomain || "en-www-vidmud-com";
const source = args.source || "hybrid";
const enrich = args.enrich !== "false";
const technical = args.technical === "true";

const properties = readJson(path.join(root, "data", "properties.json"));
const projectConfig = properties.projects.find((item) => item.id === project) || properties.projects[0];
const subdomain = projectConfig.subdomains.find((item) => item.id === subdomainId) || projectConfig.subdomains[0];
const periods = calculatePeriods(reportType, date);
const requiredPeriod = { start: periods.baseline.start, end: periods.current.end };
const importsDir = path.join(root, "data", "imports");
const snapshotDir = path.join(root, "data", "snapshots", project, subdomainId, reportType);
const snapshotPath = path.join(snapshotDir, `${reportType}-${date}.json`);

if ((source === "snapshot" || source === "hybrid") && hasUsableSnapshot()) {
  console.log(`Using existing snapshot ${path.relative(root, snapshotPath)}`);
  if (enrich && !snapshotHasLlmAnalysis()) {
    run("scripts/enrich-snapshot-openai.mjs", [
      "--type", reportType,
      "--date", date,
      "--project", project,
      "--subdomain", subdomainId
    ]);
  }
  console.log(`Completed ${reportType} monitor for ${subdomainId} ending ${date}`);
  process.exit(0);
}

if (source === "snapshot") {
  console.error(`Snapshot not found or incomplete: ${path.relative(root, snapshotPath)}`);
  process.exit(1);
}

const importsReady = hasRequiredImportData();

if (source === "imports" && !importsReady) {
  console.error(`Import data does not cover ${requiredPeriod.start} to ${requiredPeriod.end} for ${subdomain.host}`);
  process.exit(1);
}

if (source === "api" || (source === "hybrid" && !importsReady)) {
  run("scripts/fetch-google-apis.mjs", [
    "--type", reportType,
    "--date", date,
    "--project", project,
    "--subdomain", subdomainId
  ]);
} else {
  console.log(`Using existing import data for ${subdomain.host} (${source} mode)`);
}

run("scripts/generate-snapshot.mjs", [
  "--type", reportType,
  "--date", date,
  "--project", project,
  "--subdomain", subdomainId
]);

if (technical) {
  run("scripts/fetch-technical-health.mjs", [
    "--type", reportType,
    "--date", date,
    "--project", project,
    "--subdomain", subdomainId
  ]);
  run("scripts/generate-snapshot.mjs", [
    "--type", reportType,
    "--date", date,
    "--project", project,
    "--subdomain", subdomainId
  ]);
}

if (enrich) {
  run("scripts/enrich-snapshot-openai.mjs", [
    "--type", reportType,
    "--date", date,
    "--project", project,
    "--subdomain", subdomainId
  ]);
}

console.log(`Completed ${reportType} monitor for ${subdomainId} ending ${date}`);

function hasUsableSnapshot() {
  if (!fs.existsSync(snapshotPath)) return false;
  const snapshot = readJson(snapshotPath);
  return snapshot?.reportType === reportType
    && snapshot?.currentPeriod?.start
    && Array.isArray(snapshot.kpis)
    && snapshot.kpis.length > 0
    && Array.isArray(snapshot.dataSources)
    && (!technical || snapshotHasTechnicalData(snapshot));
}

function snapshotHasLlmAnalysis() {
  if (!fs.existsSync(snapshotPath)) return false;
  const snapshot = readJson(snapshotPath);
  return Boolean(snapshot.llmAnalysis?.generatedAt);
}

function snapshotHasTechnicalData(snapshot) {
  const technicalSource = (snapshot.dataSources || []).find((item) => item.source === "Technical Health");
  if (technicalSource && ["ready", "blocked"].includes(technicalSource.status)) return true;
  return (snapshot.technicalChecks || []).some((item) => ["good", "watch", "risk", "blocked"].includes(item.status));
}

function hasRequiredImportData() {
  const ga4Rows = readCsvIfExists(path.join(importsDir, "ga4_daily.csv"));
  const gscRows = readCsvIfExists(path.join(importsDir, "gsc_daily.csv"));
  const pageQueryRows = readCsvIfExists(path.join(importsDir, "gsc_page_query.csv"));
  const hasGa4 = coversPeriod(ga4Rows, requiredPeriod, subdomain.host);
  const hasGsc = coversPeriod(gscRows, requiredPeriod, subdomain.host);
  const hasPageQuery = pageQueryRows.some((row) => hostMatches(row.Subdomain, subdomain.host) && inPeriod(row.Date, periods.current));
  if (!hasGa4) console.log("Missing required GA4 import rows; direct GA4 API pull needed.");
  if (!hasGsc) console.log("Missing required GSC import rows; direct GSC API pull needed.");
  if (!hasPageQuery) console.log("Missing required GSC page/query import rows; direct GSC API pull needed.");
  return hasGa4 && hasGsc && hasPageQuery;
}

function coversPeriod(rows, period, host) {
  const dates = new Set(rows.filter((row) => hostMatches(row.Subdomain, host)).map((row) => row.Date));
  for (const date of datesBetween(period.start, period.end)) {
    if (!dates.has(date)) return false;
  }
  return true;
}

function datesBetween(start, end) {
  const dates = [];
  let current = parseDate(start);
  const last = parseDate(end);
  while (current <= last) {
    dates.push(formatDate(current));
    current = addDays(current, 1);
  }
  return dates;
}

function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
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
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      i++;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

function calculatePeriods(type, endDate) {
  const end = parseDate(endDate);
  if (type === "daily") {
    const baseline = addDays(end, -7);
    return {
      current: { start: formatDate(end), end: formatDate(end) },
      baseline: { label: "Same day last week", start: formatDate(baseline), end: formatDate(baseline) }
    };
  }
  if (type === "weekly") {
    const currentEnd = previousSaturday(end);
    const currentStart = addDays(currentEnd, -6);
    const baselineEnd = addDays(currentStart, -1);
    const baselineStart = addDays(baselineEnd, -6);
    return {
      current: { start: formatDate(currentStart), end: formatDate(currentEnd) },
      baseline: { label: "Previous complete 7 days", start: formatDate(baselineStart), end: formatDate(baselineEnd) }
    };
  }
  const currentStart = addDays(end, -27);
  const baselineEnd = addDays(end, -28);
  const baselineStart = addDays(end, -55);
  return {
    current: { start: formatDate(currentStart), end: formatDate(end) },
    baseline: { label: "Previous 28 days", start: formatDate(baselineStart), end: formatDate(baselineEnd) }
  };
}

function inPeriod(value, period) {
  const text = String(value || "");
  if (text.includes(" to ")) {
    const [start, end] = text.split(" to ");
    return start <= period.end && end >= period.start;
  }
  return text >= period.start && text <= period.end;
}

function hostMatches(value, host) {
  return String(value || "").replace(/^https?:\/\//, "").replace(/\/$/, "") === host;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseArgs(values) {
  const parsed = {};
  for (let i = 0; i < values.length; i++) {
    if (values[i].startsWith("--")) {
      parsed[values[i].slice(2)] = values[i + 1];
      i++;
    }
  }
  return parsed;
}

function previousSaturday(date) {
  const day = date.getUTCDay();
  const daysBack = day === 6 ? 7 : (day + 1) % 7;
  return addDays(date, -daysBack);
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayIso() {
  return formatDate(new Date());
}
