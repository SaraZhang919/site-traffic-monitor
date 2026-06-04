import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const cliPath = args.cli || "D:\\Screaming Frog SEO Spider\\ScreamingFrogSEOSpiderCli.exe";
const url = args.url || "https://www.vidmud.com/";
const date = args.date || todayIso();
const subdomain = args.subdomain || hostFromUrl(url);
const outputRoot = args.output
  ? path.resolve(args.output)
  : path.join(os.tmpdir(), "site-traffic-monitor-screaming-frog");
const outputFolder = path.join(outputRoot, `${date}-${safeName(subdomain)}`);

if (!fs.existsSync(cliPath)) {
  console.error(`Screaming Frog CLI not found: ${cliPath}`);
  process.exit(1);
}

fs.mkdirSync(outputFolder, { recursive: true });

const result = spawnSync(cliPath, [
  "--crawl", url,
  "--headless",
  "--output-folder", outputFolder,
  "--export-format", "csv",
  "--overwrite",
  "--export-tabs", "Internal:HTML",
  "--bulk-export", "Links:All Inlinks"
], {
  cwd: root,
  stdio: "inherit",
  shell: false,
  windowsHide: true
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const csvFiles = listCsvFiles(outputFolder);
const pageFile = findCsvByHeaders(csvFiles, ["Address", "Status Code"]);
const inlinksFile = findCsvByHeaders(csvFiles, ["Source", "Destination"]);

if (!pageFile) {
  console.error(`Could not find Screaming Frog page export in ${outputFolder}`);
  process.exit(1);
}

copyNormalizedCsv(pageFile, path.join(root, "data", "imports", "screaming_frog_pages.csv"), {
  Date: date,
  Subdomain: subdomain
});

if (inlinksFile) {
  copyNormalizedCsv(inlinksFile, path.join(root, "data", "imports", "screaming_frog_internal_links.csv"), {
    Date: date,
    Subdomain: subdomain
  });
} else {
  console.warn(`Could not find All Inlinks export in ${outputFolder}`);
}

console.log(`Screaming Frog raw output: ${path.relative(root, outputFolder)}`);
console.log("Updated data/imports/screaming_frog_pages.csv");
if (inlinksFile) console.log("Updated data/imports/screaming_frog_internal_links.csv");

function copyNormalizedCsv(source, destination, extraColumns) {
  const rows = parseCsv(fs.readFileSync(source, "utf8"));
  const headers = Object.keys(rows[0] || {});
  const outputHeaders = [...Object.keys(extraColumns), ...headers];
  const outputRows = rows.map((row) => Object.fromEntries(outputHeaders.map((header) => [
    header,
    extraColumns[header] ?? row[header] ?? ""
  ])));
  writeCsv(destination, outputHeaders, outputRows);
}

function findCsvByHeaders(files, requiredHeaders) {
  return files.find((file) => {
    const rows = parseCsv(fs.readFileSync(file, "utf8"), 1);
    const headers = new Set(Object.keys(rows[0] || {}));
    return requiredHeaders.every((header) => headers.has(header));
  });
}

function listCsvFiles(folder) {
  return fs.readdirSync(folder, { recursive: true })
    .map((item) => path.join(folder, item))
    .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && file.toLowerCase().endsWith(".csv"));
}

function parseCsv(text, limit = Infinity) {
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
      if (rows.length > limit) break;
    } else {
      cell += char;
    }
  }
  if (rows.length <= limit && (cell || row.length)) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows.slice(0, limit).map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

function writeCsv(file, headers, rows) {
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvCell).join(","))
    .join("\n") + "\n";
  fs.writeFileSync(file, csv);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
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

function hostFromUrl(value) {
  return new URL(value).host;
}

function safeName(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
