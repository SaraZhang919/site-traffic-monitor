import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import http from "node:http";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    if (request.method === "POST" && url.pathname === "/api/run-monitor") {
      await handleRunMonitor(request, response);
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }
    serveStatic(url.pathname, request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Site Traffic Monitor running at http://${host}:${port}/`);
});

async function handleRunMonitor(request, response) {
  const body = await readJsonBody(request);
  const type = allow(body.type, ["daily", "weekly", "28-days"], "daily");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : todayIso();
  const project = safeId(body.project || "vidmud");
  const subdomain = safeId(body.subdomain || "en-www-vidmud-com");
  const source = allow(body.source, ["hybrid", "snapshot", "imports", "api"], "hybrid");
  const enrich = body.enrich === false ? "false" : "true";
  const technical = body.technical === true ? "true" : "false";

  const args = [
    "scripts/run-monitor.mjs",
    "--type", type,
    "--date", date,
    "--project", project,
    "--subdomain", subdomain,
    "--source", source,
    "--enrich", enrich,
    "--technical", technical
  ];

  const result = await runNode(args);
  const snapshotPath = path.join(root, "data", "snapshots", project, subdomain, type, `${type}-${date}.json`);
  const latestPath = path.join(root, "data", "snapshots", project, subdomain, type, "latest.json");
  const displayPath = fs.existsSync(snapshotPath) ? snapshotPath : latestPath;
  const snapshot = fs.existsSync(displayPath) ? JSON.parse(fs.readFileSync(displayPath, "utf8")) : null;

  sendJson(response, 200, {
    ok: true,
    type,
    date,
    project,
    subdomain,
    stdout: result.stdout,
    stderr: result.stderr,
    snapshotPath: path.relative(root, displayPath).replaceAll(path.sep, "/"),
    snapshot
  });
}

function serveStatic(urlPath, request, response) {
  const normalized = decodeURIComponent(urlPath);
  const relativePath = normalized === "/" ? "index.html" : normalized.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 100_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      shell: false,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Command failed with exit code ${code}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload, null, 2));
}

function allow(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function safeId(value) {
  const text = String(value || "");
  if (!/^[a-zA-Z0-9._-]+$/.test(text)) throw new Error(`Unsafe id: ${text}`);
  return text;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
