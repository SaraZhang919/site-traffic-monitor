import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = readEnv(path.join(root, ".env.local"));
const args = parseArgs(process.argv.slice(2));

const reportType = args.type || "daily";
const date = args.date || todayIso();
const projectId = args.project || "vidmud";
const subdomainId = args.subdomain || "en-www-vidmud-com";
const model = env.OPENAI_MODEL || "gpt-4o-mini";

if (!env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const snapshotDir = path.join(root, "data", "snapshots", projectId, subdomainId, reportType);
const datedPath = path.join(snapshotDir, `${reportType}-${date}.json`);
const latestPath = path.join(snapshotDir, "latest.json");
const snapshotPath = fs.existsSync(datedPath) ? datedPath : latestPath;

if (!fs.existsSync(snapshotPath)) {
  console.error(`Snapshot not found: ${snapshotPath}`);
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const analysis = await createAnalysis(snapshot);
const enriched = mergeAnalysis(snapshot, analysis);

fs.writeFileSync(snapshotPath, JSON.stringify(enriched, null, 2) + "\n");
fs.writeFileSync(latestPath, JSON.stringify(enriched, null, 2) + "\n");

console.log(`Enriched ${path.basename(snapshotPath)} with ${model}`);

async function createAnalysis(snapshot) {
  const payload = compactSnapshot(snapshot);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are an SEO analyst for a local-first site traffic monitor.",
            "Return strict JSON only.",
            "Use the provided GA4/GSC metrics. Do not invent private data.",
            "Make actions concrete and executable.",
            "If query-level data is missing, say so and use page-level evidence instead.",
            "Use concrete targets from topPages or topQueries whenever possible.",
            "Do not use vague targets like Overall site performance unless the issue is truly sitewide; when sitewide, prefix the target with Sitewide: so it is not treated as a URL.",
            "For actions, output must describe the expected deliverable or generated artifact, not a vague benefit.",
            "Technical checks with status pending or source Not connected yet are not measured problems; recommend connecting the source, but do not diagnose them as real technical issues.",
            "For 28-days reports, preserve and improve topic cluster planning: potential clusters, pillar topics, article ideas, pages worth optimizing, internal links, external links, and technical debt."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create SEO diagnosis and action recommendations for this dashboard snapshot.",
            requiredShape: {
              executiveSummary: "one short paragraph",
              risks: [
                {
                  title: "string",
                  target: "page/query/topic",
                  diagnosis: "why this matters",
                  actionType: "action category"
                }
              ],
              opportunities: [
                {
                  title: "string",
                  target: "page/query/topic",
                  diagnosis: "why this matters",
                  actionType: "action category"
                }
              ],
              actions: [
                {
                  priority: "P1/P2/P3",
                  action: "what to do",
                  target: "page/query/topic",
                  howTo: "step-by-step or concrete example",
                  output: "expected deliverable"
                }
              ],
              strategyPlan: [
                {
                  category: "Pages To Refresh / Title Meta Queries / Internal Link Targets / New Content Topics / Backlink Support / Technical SEO Backlog / Topic Cluster Decisions",
                  status: "good/watch/risk/opportunity",
                  items: [
                    {
                      target: "string",
                      reason: "string",
                      nextStep: "string"
                    }
                  ]
                }
              ]
            },
            snapshot: payload
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response did not include content");
  return JSON.parse(content);
}

function mergeAnalysis(snapshot, analysis) {
  const risks = sanitizeTargets(analysis.risks || [], snapshot);
  const opportunities = sanitizeTargets(analysis.opportunities || [], snapshot);
  const actions = sanitizeTargets(analysis.actions || [], snapshot);
  return {
    ...snapshot,
    llmAnalysis: {
      provider: "OpenAI",
      model,
      generatedAt: new Date().toISOString(),
      executiveSummary: analysis.executiveSummary || ""
    },
    risks: nonEmptyArray(risks) ? risks : snapshot.risks,
    opportunities: nonEmptyArray(opportunities) ? opportunities : snapshot.opportunities,
    actions: nonEmptyArray(actions) ? actions : snapshot.actions,
    strategyPlan: mergeStrategyPlan(snapshot, analysis.strategyPlan),
    dataSources: [
      ...(snapshot.dataSources || []),
      { source: "OpenAI", status: "ready", detail: `LLM SEO analysis generated with ${model}` }
    ]
  };
}

function mergeStrategyPlan(snapshot, analysisPlan) {
  if (!nonEmptyArray(analysisPlan)) return snapshot.strategyPlan;
  const sanitizedPlan = analysisPlan.map((group) => ({
    ...group,
    items: sanitizeTargets(group.items || [], snapshot)
  }));
  if (snapshot.reportType !== "28-days") return sanitizedPlan;
  const required = [
    "Potential Topic Clusters",
    "Pillar Topic Candidates",
    "Potential Article Ideas",
    "Pages Worth Optimizing",
    "Internal Link Structure",
    "External Link Support",
    "Technical Debt",
    "Topic Cluster Decisions"
  ];
  const categories = new Set(sanitizedPlan.map((group) => String(group.category || "")));
  const hasRequiredPlan = required.every((category) => categories.has(category));
  return hasRequiredPlan ? sanitizedPlan : snapshot.strategyPlan;
}

function compactSnapshot(snapshot) {
  return {
    reportType: snapshot.reportType,
    project: snapshot.project,
    subdomain: snapshot.subdomain,
    currentPeriod: snapshot.currentPeriod,
    baselinePeriod: snapshot.baselinePeriod,
    health: snapshot.health,
    kpis: snapshot.kpis,
    topPages: (snapshot.topPages || []).slice(0, 12),
    topQueries: (snapshot.topQueries || []).slice(0, 20),
    technicalChecks: snapshot.technicalChecks,
    existingActions: snapshot.actions,
    dataSources: snapshot.dataSources
  };
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function sanitizeTargets(items, snapshot) {
  return items
    .map((item) => ({
      ...item,
      target: sanitizeTarget(item.target)
    }))
    .filter((item) => isUsefulTarget(item.target, snapshot));
}

function sanitizeTarget(target) {
  const value = String(target || "").trim();
  if (/^overall site performance$/i.test(value)) return "Sitewide: organic search visibility";
  const relatedQueryMatch = value.match(/^queries related to ['"]?(.+?)['"]?$/i);
  if (relatedQueryMatch) return `Query group: ${relatedQueryMatch[1]}`;
  return value;
}

function isUsefulTarget(target, snapshot) {
  const value = String(target || "").toLowerCase().trim();
  if (value.startsWith("site:") || value.includes("vidnoz.com")) return false;
  const maxTopQueryImpressions = Math.max(0, ...(snapshot.topQueries || []).map((row) => extractFirstNumber(row.metric)));
  if (value.includes("top queries") && maxTopQueryImpressions < 100) return false;
  const query = value
    .replace(/^query:\s*/, "")
    .replace(/^queries:\s*/, "")
    .replace(/^query group:\s*/, "")
    .replaceAll("'", "")
    .replaceAll("\"", "");
  const queryRow = (snapshot.topQueries || []).find((item) => item.query.toLowerCase() === query);
  if (queryRow && extractFirstNumber(queryRow.metric) < 100) return false;
  const queryParts = query.split(",").map((item) => item.trim()).filter(Boolean);
  const matchedQueryRows = queryParts
    .map((item) => (snapshot.topQueries || []).find((row) => row.query.toLowerCase() === item))
    .filter(Boolean);
  if (matchedQueryRows.length && matchedQueryRows.every((row) => extractFirstNumber(row.metric) < 100)) return false;
  return true;
}

function extractFirstNumber(value) {
  const match = String(value || "").replaceAll(",", "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
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
