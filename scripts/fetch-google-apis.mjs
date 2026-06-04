import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const env = readEnv(path.join(root, ".env.local"));
const properties = readJson(path.join(root, "data", "properties.json"));
const importsDir = path.join(root, "data", "imports");

const args = parseArgs(process.argv.slice(2));
const reportType = args.type || "daily";
const reportEndDate = args.date || todayIso();
const projectId = args.project || properties.defaultProject || "vidmud";
const subdomainId = args.subdomain || properties.defaultSubdomain || "en-www-vidmud-com";

const project = properties.projects.find((item) => item.id === projectId) || properties.projects[0];
const subdomain = project.subdomains.find((item) => item.id === subdomainId) || project.subdomains[0];
const periods = calculatePeriods(reportType, reportEndDate);
const fetchPeriod = { start: periods.baseline.start, end: periods.current.end };

if (!env.GOOGLE_SERVICE_ACCOUNT_FILE) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_FILE in .env.local");
  process.exit(1);
}

fs.mkdirSync(importsDir, { recursive: true });

const credentials = readJson(env.GOOGLE_SERVICE_ACCOUNT_FILE);
const token = await getAccessToken(credentials, [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly"
]);

const ga4Rows = await fetchGa4Daily(subdomain.ga4PropertyId, fetchPeriod, subdomain);
const gscDailyRows = await fetchGscDaily(subdomain.gscProperty, fetchPeriod, subdomain);
const gscPageQueryRows = await fetchGscPageQuery(subdomain.gscProperty, periods.current, subdomain);

writeCsv(path.join(importsDir, "ga4_daily.csv"), [
  "Date",
  "Lan",
  "Subdomain",
  "Session Organic Sessions",
  "Session Organic Active Users",
  "Session Organic New Users",
  "Key Event Counts"
], ga4Rows);

writeCsv(path.join(importsDir, "gsc_daily.csv"), [
  "Date",
  "Lan",
  "Subdomain",
  "Clicks",
  "Impressions",
  "CTR",
  "Position"
], gscDailyRows);

writeCsv(path.join(importsDir, "gsc_page_query.csv"), [
  "Date",
  "Lan",
  "Subdomain",
  "Page Url",
  "Query",
  "Clicks",
  "Impressions",
  "CTR",
  "Position"
], gscPageQueryRows);

fs.writeFileSync(path.join(importsDir, "source_metadata.json"), JSON.stringify({
  source: "google-apis",
  generatedAt: new Date().toISOString(),
  reportType,
  reportEndDate,
  projectId,
  subdomainId,
  subdomain: subdomain.host,
  period: fetchPeriod,
  files: {
    ga4: "ga4_daily.csv",
    gscDaily: "gsc_daily.csv",
    gscPageQuery: "gsc_page_query.csv"
  }
}, null, 2) + "\n");

console.log(`Fetched GA4 daily rows: ${ga4Rows.length}`);
console.log(`Fetched GSC daily rows: ${gscDailyRows.length}`);
console.log(`Fetched GSC page+query rows: ${gscPageQueryRows.length}`);
console.log(`Period: ${fetchPeriod.start} to ${fetchPeriod.end}`);
console.log(`Subdomain: ${subdomain.host}`);

async function fetchGa4Daily(propertyId, period, subdomain) {
  if (!propertyId) return [];
  const body = {
    dateRanges: [{ startDate: period.start, endDate: period.end }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "keyEvents" }
    ],
    dimensionFilter: {
      filter: {
        fieldName: "sessionDefaultChannelGroup",
        stringFilter: { matchType: "EXACT", value: "Organic Search" }
      }
    },
    limit: "100000"
  };
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`GA4 API failed for property ${propertyId}: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return (data.rows || []).map((row) => {
    const date = formatCompactDate(row.dimensionValues[0]?.value);
    const metrics = row.metricValues.map((item) => item.value || "0");
    return [date, subdomain.language, subdomain.host, ...metrics];
  }).sort((a, b) => a[0].localeCompare(b[0]));
}

async function fetchGscDaily(siteUrl, period, subdomain) {
  const rows = await fetchGscRows(siteUrl, {
    startDate: period.start,
    endDate: period.end,
    dimensions: ["date"],
    rowLimit: 25000,
    dataState: "final"
  });
  return rows.map((row) => [
    row.keys[0],
    subdomain.language,
    subdomain.host,
    row.clicks || 0,
    row.impressions || 0,
    row.ctr || 0,
    row.position || 0
  ]).sort((a, b) => a[0].localeCompare(b[0]));
}

async function fetchGscPageQuery(siteUrl, period, subdomain) {
  const rows = await fetchGscRows(siteUrl, {
    startDate: period.start,
    endDate: period.end,
    dimensions: ["page", "query"],
    rowLimit: 25000,
    dataState: "final"
  });
  const dateLabel = period.start === period.end ? period.start : `${period.start} to ${period.end}`;
  return rows.map((row) => [
    dateLabel,
    subdomain.language,
    subdomain.host,
    row.keys[0],
    row.keys[1],
    row.clicks || 0,
    row.impressions || 0,
    row.ctr || 0,
    row.position || 0
  ]);
}

async function fetchGscRows(siteUrl, body) {
  const encodedSite = encodeURIComponent(siteUrl);
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`GSC API failed for ${siteUrl}: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.rows || [];
}

async function getAccessToken(credentials, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.access_token;
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

function writeCsv(file, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
  fs.writeFileSync(file, csv);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
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

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function previousSaturday(date) {
  const day = date.getUTCDay();
  const daysBack = day === 6 ? 7 : (day + 1) % 7;
  return addDays(date, -daysBack);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatCompactDate(value) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function todayIso() {
  return formatDate(new Date());
}

function base64url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
