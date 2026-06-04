import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const outputDir = path.join(root, "data", "imports");

const env = readEnv(envPath);
const credentialsFile = env.GOOGLE_SERVICE_ACCOUNT_FILE;
const sheetId = env.GOOGLE_SHEET_ID;

if (!credentialsFile || !sheetId) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SHEET_ID in .env.local");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf8"));
const token = await getAccessToken(credentials);

const sheetMap = [
  {
    name: env.GA4_DAILY_SHEET || "Daily",
    output: "ga4_daily.csv"
  },
  {
    name: env.GSC_DAILY_SHEET || "Daily Site GSC",
    output: "gsc_daily.csv"
  },
  {
    name: env.GSC_PAGE_QUERY_SHEET || "Weekly Page GSC",
    output: "gsc_page_query.csv"
  }
];

fs.mkdirSync(outputDir, { recursive: true });

for (const sheet of sheetMap) {
  const rows = await fetchSheetValues(sheetId, sheet.name, token);
  if (!rows.length) {
    console.warn(`No rows returned for ${sheet.name}`);
    continue;
  }
  const csv = rowsToCsv(rows);
  const output = path.join(outputDir, sheet.output);
  fs.writeFileSync(output, csv);
  console.log(`Wrote ${sheet.output} from "${sheet.name}" (${rows.length} rows)`);
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(credentials.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchSheetValues(sheetId, sheetName, token) {
  const range = encodeURIComponent(`'${sheetName.replaceAll("'", "''")}'`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 400 || response.status === 404) {
    console.warn(`Sheet tab not found: ${sheetName}`);
    return [];
  }

  if (!response.ok) {
    throw new Error(`Google Sheets request failed for ${sheetName}: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.values || [];
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

function base64url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
