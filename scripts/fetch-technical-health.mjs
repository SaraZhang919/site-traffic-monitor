import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const env = readEnv(path.join(root, ".env.local"));
const properties = readJson(path.join(root, "data", "properties.json"));
const args = parseArgs(process.argv.slice(2));

const reportType = args.type || "daily";
const reportEndDate = args.date || todayIso();
const projectId = args.project || properties.defaultProject || "vidmud";
const subdomainId = args.subdomain || properties.defaultSubdomain || "en-www-vidmud-com";
const limit = Number(args.limit || 5);

const project = properties.projects.find((item) => item.id === projectId) || properties.projects[0];
const subdomain = project.subdomains.find((item) => item.id === subdomainId) || project.subdomains[0];
const snapshotPath = path.join(root, "data", "snapshots", projectId, subdomainId, reportType, `${reportType}-${reportEndDate}.json`);
const latestPath = path.join(root, "data", "snapshots", projectId, subdomainId, reportType, "latest.json");
const snapshot = readJsonIfExists(snapshotPath) || readJsonIfExists(latestPath);
const pages = priorityPages(snapshot, subdomain).slice(0, limit);

if (!env.GOOGLE_SERVICE_ACCOUNT_FILE) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_FILE in .env.local");
  process.exit(1);
}

const credentials = readJson(env.GOOGLE_SERVICE_ACCOUNT_FILE);
const token = await getAccessToken(credentials, ["https://www.googleapis.com/auth/webmasters.readonly"]);

const indexingRows = [];
for (const page of pages) {
  const result = await inspectUrl(subdomain.gscProperty, page).catch((error) => ({ error: error.message }));
  indexingRows.push({ page, result });
}

const pageSpeedRows = [];
for (const page of pages.slice(0, Math.min(3, pages.length))) {
  const result = await fetchPageSpeed(page).catch((error) => ({ error: error.message }));
  pageSpeedRows.push({ page, result });
}

const indexingIssues = indexingRows.filter((row) => isIndexingIssue(row.result));
const cwvIssues = pageSpeedRows.filter((row) => isCwvIssue(row.result));
const indexingBlocked = indexingRows.some((row) => row.result.error);
const cwvBlocked = pageSpeedRows.some((row) => row.result.error);
const rows = [
  [
    reportEndDate,
    subdomain.host,
    "Indexing Abnormalities",
    indexingBlocked ? "blocked" : indexingIssues.length ? "watch" : "good",
    "Affected URLs",
    indexingIssues.length,
    indexingIssues.length ? summarizeIndexingIssues(indexingIssues) : "No inspected priority URL indexing issues detected.",
    "GSC URL Inspection API"
  ],
  [
    reportEndDate,
    subdomain.host,
    "Core Web Vitals",
    cwvBlocked ? "blocked" : cwvIssues.length ? "watch" : "good",
    "Priority URLs Checked",
    pageSpeedRows.length,
    cwvIssues.length ? summarizeCwvIssues(cwvIssues) : "No priority URL CWV field-data issue detected by PageSpeed Insights.",
    "PageSpeed Insights API"
  ]
];

const output = path.join(root, "data", "imports", "technical_health.csv");
writeCsv(output, ["Date", "Subdomain", "Check", "Status", "Metric", "Value", "Issue", "Source"], rows);
console.log(`Wrote technical_health.csv (${rows.length} rows, ${pages.length} priority pages checked)`);

function priorityPages(snapshot, subdomain) {
  const fromSnapshot = (snapshot?.topPages || [])
    .map((item) => item.path)
    .filter(Boolean)
    .map((item) => item.startsWith("http") ? item : `https://${subdomain.host}${item.startsWith("/") ? item : `/${item}`}`);
  if (fromSnapshot.length) return [...new Set(fromSnapshot)];
  return [`https://${subdomain.host}/`];
}

async function inspectUrl(siteUrl, inspectionUrl) {
  const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inspectionUrl, siteUrl })
  });
  if (!response.ok) {
    throw new Error(`URL Inspection failed for ${inspectionUrl}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function fetchPageSpeed(url) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`PageSpeed failed for ${url}: ${response.status} ${await response.text()}`);
  }
  return response.json();
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
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64url(signature)}`
    })
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.access_token;
}

function isIndexingIssue(result) {
  if (result.error) return true;
  const status = result.inspectionResult?.indexStatusResult;
  if (!status) return true;
  return status.verdict && status.verdict !== "PASS";
}

function isCwvIssue(result) {
  if (result.error) return true;
  const loading = result.loadingExperience || result.originLoadingExperience;
  if (!loading) return false;
  return loading.overall_category && loading.overall_category !== "FAST";
}

function summarizeIndexingIssues(rows) {
  return rows.slice(0, 3).map(({ page, result }) => {
    if (result.error) return `${page}: ${compactGoogleError(result.error)}`;
    const status = result.inspectionResult?.indexStatusResult || {};
    return `${page}: ${status.verdict || "UNKNOWN"} ${status.coverageState || ""}`.trim();
  }).join("; ");
}

function summarizeCwvIssues(rows) {
  return rows.slice(0, 3).map(({ page, result }) => {
    if (result.error) return `${page}: ${compactGoogleError(result.error)}`;
    const loading = result.loadingExperience || result.originLoadingExperience || {};
    return `${page}: ${loading.overall_category || "UNKNOWN"}`;
  }).join("; ");
}

function compactGoogleError(error) {
  const text = String(error || "");
  const status = text.match(/"status":\s*"([^"]+)"/)?.[1];
  const message = text.match(/"message":\s*"([^"]+)"/)?.[1];
  if (status || message) return [status, message].filter(Boolean).join(": ");
  return text.split("\n")[0].slice(0, 240);
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

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return readJson(file);
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function base64url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
