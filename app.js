const CONFIG = {
  projects: [
    {
      id: "vidmud",
      name: "Vidmud",
      subdomains: [
        { id: "en-www-vidmud-com", label: "EN - www.vidmud.com", host: "www.vidmud.com", language: "EN" }
      ]
    }
  ],
  defaultProject: "vidmud",
  defaultSubdomain: "en-www-vidmud-com",
  propertiesPath: "data/properties.json",
  snapshotBase: "data/snapshots"
};

const REPORT_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  "28-days": "28 Days"
};

const SAMPLE_SNAPSHOT = {
  reportType: "daily",
  project: "Vidmud",
  subdomain: "www.vidmud.com",
  snapshotName: "daily-2026-06-03.json",
  generatedAt: "2026-06-03T17:00:00+09:00",
  currentPeriod: { start: "2026-06-03", end: "2026-06-03" },
  baselinePeriod: { label: "Same day last week", start: "2026-05-27", end: "2026-05-27" },
  freshness: "Sample local snapshot",
  health: "watch",
  focus: {
    primary: "Detect abnormal SEO movement fast",
    bestFor: "Critical page drops, index issues, sudden CTR or click changes",
    output: "Today: observe, investigate, or execute urgent fix"
  },
  dataSources: [
    { source: "GA4", status: "ready", detail: "sessionDefaultChannelGroup = Organic Search" },
    { source: "GSC", status: "ready", detail: "site + page/query metrics" },
    { source: "Ahrefs", status: "manual", detail: "direct account enrichment" },
    { source: "Screaming Frog", status: "pending", detail: "local crawl export" }
  ],
  kpis: [
    {
      id: "organic-sessions",
      label: "Organic Sessions",
      value: 1240,
      baseline: 1480,
      absChange: -240,
      pctChange: -16.2,
      tier: "Large",
      status: "risk",
      source: "GA4"
    },
    {
      id: "active-users",
      label: "Active Users",
      value: 1028,
      baseline: 1105,
      absChange: -77,
      pctChange: -7,
      tier: "Large",
      status: "watch",
      source: "GA4"
    },
    {
      id: "gsc-clicks",
      label: "GSC Clicks",
      value: 906,
      baseline: 988,
      absChange: -82,
      pctChange: -8.3,
      tier: "Medium",
      status: "watch",
      source: "GSC"
    },
    {
      id: "impressions",
      label: "Impressions",
      value: 82000,
      baseline: 70000,
      absChange: 12000,
      pctChange: 17.1,
      tier: "Very Large",
      status: "opportunity",
      source: "GSC"
    }
  ],
  risks: [
    {
      title: "Organic sessions declined on top landing pages",
      target: "/video-enhancer.html",
      diagnosis: "Traffic impact is meaningful for a large baseline tier. Check whether the drop is page-specific or site-wide.",
      actionType: "Check Top Landing Pages / GSC Index"
    }
  ],
  opportunities: [
    {
      title: "Impressions rose while CTR stayed low",
      target: "/video-enhancer.html",
      diagnosis: "Search demand is visible but snippets may not match the dominant query intent.",
      actionType: "Find Low CTR Rising Impression Queries"
    }
  ],
  actions: [
    {
      priority: "P1",
      action: "Check Top landing pages / GSC index",
      target: "/video-enhancer.html",
      howTo: "Open GSC page performance and indexing status for the normalized page. Compare query clicks, impressions, CTR, and index state.",
      output: "Page risk note and index status"
    },
    {
      priority: "P1",
      action: "Find CTR-low queries with rising impressions",
      target: "/video-enhancer.html",
      howTo: "Filter GSC page+query rows where impressions increased and CTR dropped below the page baseline.",
      output: "Query list for title/meta rewrite"
    },
    {
      priority: "P2",
      action: "Add quick-win optimization queue item",
      target: "queries position 8-20",
      howTo: "Prioritize queries with high impressions, position 8-20, and stable or improving position.",
      output: "Weekly quick-win queue"
    }
  ],
  strategyPlan: [
    {
      category: "Pages To Refresh",
      status: "risk",
      items: [
        {
          target: "/video-enhancer.html",
          reason: "Organic sessions dropped while impressions stayed high.",
          nextStep: "Update intro, use cases, FAQ, and comparison sections."
        },
        {
          target: "/tools/legacy-video-maker.html",
          reason: "Older page shows content decay signals.",
          nextStep: "Create refresh brief and compare current SERP intent."
        }
      ]
    },
    {
      category: "Title / Meta Queries",
      status: "opportunity",
      items: [
        {
          target: "video enhancer",
          reason: "Impressions rising, CTR below page baseline.",
          nextStep: "Generate 3 title/meta variants around speed and quality."
        },
        {
          target: "enhance video quality",
          reason: "Strong impression growth with weak click capture.",
          nextStep: "Check SERP pattern and rewrite snippet intent."
        }
      ]
    },
    {
      category: "Internal Link Targets",
      status: "opportunity",
      items: [
        {
          target: "/tools/video-editor.html",
          reason: "Queries are close to page-one movement.",
          nextStep: "Add 3-5 contextual links from related video tool pages."
        }
      ]
    },
    {
      category: "New Content Topics",
      status: "good",
      items: [
        {
          target: "AI video enhancer workflow",
          reason: "Topic cluster is growing across related queries.",
          nextStep: "Draft new guide targeting workflow and comparison intent."
        }
      ]
    },
    {
      category: "Backlink Support",
      status: "watch",
      items: [
        {
          target: "/video-enhancer.html",
          reason: "High opportunity page needs authority support.",
          nextStep: "Review Ahrefs referring domains and prepare outreach targets."
        }
      ]
    },
    {
      category: "Technical SEO Backlog",
      status: "watch",
      items: [
        {
          target: "priority tool pages",
          reason: "Indexing/CWV checks are pending for risk pages.",
          nextStep: "Run Screaming Frog and check indexability, canonical, status code, title/meta."
        }
      ]
    },
    {
      category: "Topic Cluster Decisions",
      status: "good",
      items: [
        {
          target: "video enhancement cluster",
          reason: "Clicks and impressions are both growing.",
          nextStep: "Increase investment: expand content and internal links."
        },
        {
          target: "legacy maker cluster",
          reason: "Decline risk appears in older pages.",
          nextStep: "Pause new builds; refresh old content first."
        }
      ]
    }
  ],
  technicalChecks: [
    {
      check: "Indexing Abnormalities",
      frequency: "Daily watch + weekly diagnosis",
      status: "watch",
      source: "GSC Page Indexing / URL Inspection / sitemap counts",
      purpose: "Catch sudden noindex, 404, redirect, canonical, crawled-not-indexed, discovered-not-indexed, and server error issues."
    },
    {
      check: "Core Web Vitals",
      frequency: "Weekly trend + 28-day planning",
      status: "watch",
      source: "GSC Core Web Vitals / CrUX / PageSpeed when needed",
      purpose: "Track Poor and Needs Improvement URL groups for LCP, INP, and CLS. Use 28-day view for resource planning because field data moves slowly."
    }
  ],
  topPages: [
    { path: "/video-enhancer.html", metric: "1,240 sessions", status: "risk" },
    { path: "/video-compressor.html", metric: "918 sessions", status: "good" },
    { path: "/tools/video-editor.html", metric: "812 sessions", status: "opportunity" }
  ],
  topQueries: [
    { query: "video enhancer", metric: "18,200 impressions", status: "opportunity" },
    { query: "enhance video quality", metric: "8,410 impressions", status: "watch" },
    { query: "free video enhancer", metric: "6,208 impressions", status: "risk" }
  ]
};

let state = {
  reportType: "daily",
  projectId: CONFIG.defaultProject,
  subdomainId: CONFIG.defaultSubdomain,
  runMode: "latest",
  reportEndDate: todayIso(),
  snapshot: null
};

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  await loadProperties();
  initControls();
  bindEvents();
  loadCurrentSnapshot();
});

function bindElements() {
  [
    "projectSelect",
    "subdomainSelect",
    "runMode",
    "reportEndDate",
    "runCheckButton",
    "exportButton",
    "snapshotName",
    "snapshotGenerated",
    "reportScope",
    "reportTitle",
    "statusRow",
    "currentPeriod",
    "baselinePeriod",
    "freshness",
    "primaryFocus",
    "bestFor",
    "decisionOutput",
    "kpiGrid",
    "riskCount",
    "riskList",
    "opportunityCount",
    "opportunityList",
    "actionCount",
    "actionTableBody",
    "strategyCount",
    "strategyGrid",
    "technicalCount",
    "technicalGrid",
    "crawlEvidenceCount",
    "crawlEvidenceGrid",
    "pageCount",
    "topPages",
    "queryCount",
    "topQueries",
    "sourceCount",
    "sourceGrid"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
  els.segmentButtons = Array.from(document.querySelectorAll("[data-report-type]"));
  els.emptyTemplate = document.getElementById("emptyTemplate");
}

function initControls() {
  els.projectSelect.innerHTML = "";
  CONFIG.projects.forEach((project) => {
    els.projectSelect.append(new Option(project.name, project.id));
  });
  els.projectSelect.value = state.projectId;
  updateSubdomainOptions();
  els.runMode.value = state.runMode;
  els.reportEndDate.value = state.reportEndDate;
}

function bindEvents() {
  els.projectSelect.addEventListener("change", () => {
    state.projectId = els.projectSelect.value;
    updateSubdomainOptions();
    loadCurrentSnapshot();
  });

  els.subdomainSelect.addEventListener("change", () => {
    state.subdomainId = els.subdomainSelect.value;
    loadCurrentSnapshot();
  });

  els.runMode.addEventListener("change", () => {
    state.runMode = els.runMode.value;
  });

  els.reportEndDate.addEventListener("change", () => {
    state.reportEndDate = els.reportEndDate.value || todayIso();
  });

  els.segmentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.reportType = button.dataset.reportType;
      els.segmentButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      loadCurrentSnapshot();
    });
  });

  els.runCheckButton.addEventListener("click", async () => {
    state.runMode = els.runMode.value;
    state.reportEndDate = els.reportEndDate.value || todayIso();
    await runMonitorCheck();
  });

  els.exportButton.addEventListener("click", exportSnapshot);
}

function updateSubdomainOptions() {
  const project = getProject();
  els.subdomainSelect.innerHTML = "";
  project.subdomains.forEach((subdomain) => {
    els.subdomainSelect.append(new Option(subdomain.label, subdomain.id));
  });
  if (!project.subdomains.some((item) => item.id === state.subdomainId)) {
    state.subdomainId = project.subdomains[0].id;
  }
  els.subdomainSelect.value = state.subdomainId;
}

async function loadProperties() {
  try {
    const response = await fetch(CONFIG.propertiesPath, { cache: "no-store" });
    if (!response.ok) throw new Error("properties.json not found");
    const data = await response.json();
    if (Array.isArray(data.projects) && data.projects.length) {
      CONFIG.projects = data.projects;
      CONFIG.defaultProject = data.defaultProject || data.projects[0].id;
      const defaultProject = data.projects.find((project) => project.id === CONFIG.defaultProject) || data.projects[0];
      CONFIG.defaultSubdomain = data.defaultSubdomain || defaultProject.subdomains[0]?.id;
      state.projectId = CONFIG.defaultProject;
      state.subdomainId = CONFIG.defaultSubdomain;
    }
  } catch {
    // Keep built-in fallback config if the local properties file is not present.
  }
}

async function loadCurrentSnapshot() {
  const paths = snapshotPaths();
  try {
    let snapshot = null;
    for (const path of paths) {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) {
        snapshot = await response.json();
        break;
      }
    }
    if (!snapshot) throw new Error(`Snapshot not found: ${paths.join(", ")}`);
    state.snapshot = snapshot;
    render(snapshot);
  } catch (error) {
    const fallback = {
      ...SAMPLE_SNAPSHOT,
      reportType: state.reportType,
      snapshotName: "sample-local-preview.json",
      project: getProject().name,
      subdomain: getSubdomainLabel(),
      freshness: "Sample data shown until local snapshot exists"
    };
    state.snapshot = fallback;
    render(fallback);
  }
}

function snapshotPaths() {
  const dated = `${CONFIG.snapshotBase}/${state.projectId}/${state.subdomainId}/${state.reportType}/${state.reportType}-${state.reportEndDate}.json`;
  return [
    ...(state.runMode === "manual" ? [dated] : []),
    `${CONFIG.snapshotBase}/${state.projectId}/${state.subdomainId}/${state.reportType}/latest.json`,
    `${CONFIG.snapshotBase}/${state.projectId}/${state.reportType}/latest.json`
  ];
}

async function runMonitorCheck() {
  const originalText = els.runCheckButton.textContent;
  els.runCheckButton.disabled = true;
  els.runCheckButton.textContent = "Running";
  try {
    const response = await fetch("/api/run-monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: state.reportType,
        date: state.reportEndDate,
        project: state.projectId,
        subdomain: state.subdomainId,
        source: "hybrid",
        enrich: true,
        technical: true
      })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Run failed");
    }
    state.snapshot = result.snapshot;
    render(result.snapshot);
  } catch (error) {
    alert(`Run Check failed: ${error.message}`);
  } finally {
    els.runCheckButton.disabled = false;
    els.runCheckButton.textContent = originalText;
  }
}

function generateManualSnapshot() {
  const periods = calculatePeriods(state.reportType, state.reportEndDate);
  const project = getProject();
  const subdomain = getSubdomain();
  const seed = state.snapshot || SAMPLE_SNAPSHOT;
  const generatedAt = new Date().toISOString();
  const suffix = state.runMode === "manual" ? "manual" : "latest";
  const snapshotName = `${state.reportType}-${state.reportEndDate}-${suffix}.json`;

  return {
    ...seed,
    reportType: state.reportType,
    project: project.name,
    subdomain: getSubdomainLabel(),
    snapshotName,
    generatedAt,
    currentPeriod: periods.current,
    baselinePeriod: periods.baseline,
    freshness: "Generated locally from available snapshot data",
    dataSources: markSourcesForManual(seed.dataSources || []),
    actions: seed.actions.map((action) => ({
      ...action,
      output: `${action.output}; generated for ${state.reportEndDate}`
    }))
  };
}

function calculatePeriods(reportType, endDate) {
  const end = parseDate(endDate);
  if (reportType === "daily") {
    const baseline = addDays(end, -7);
    return {
      current: { start: formatDate(end), end: formatDate(end) },
      baseline: { label: "Same day last week", start: formatDate(baseline), end: formatDate(baseline) }
    };
  }

  if (reportType === "weekly") {
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

function previousSaturday(date) {
  const day = date.getDay();
  const daysBack = day === 6 ? 7 : (day + 1) % 7;
  return addDays(date, -daysBack);
}

function render(snapshot) {
  const label = REPORT_LABELS[snapshot.reportType] || REPORT_LABELS[state.reportType];
  els.reportScope.textContent = `${snapshot.project} / ${snapshot.subdomain}`;
  els.reportTitle.textContent = `${label} SEO Performance`;
  els.snapshotName.textContent = snapshot.snapshotName || "local snapshot";
  els.snapshotGenerated.textContent = snapshot.generatedAt ? `Generated ${formatDateTime(snapshot.generatedAt)}` : "Not generated yet";
  els.currentPeriod.textContent = formatPeriod(snapshot.currentPeriod);
  els.baselinePeriod.textContent = formatComparison(snapshot);
  els.freshness.textContent = snapshot.freshness || "Unknown";
  renderFocus(snapshot);

  renderStatus(snapshot);
  renderKpis(snapshot.kpis || []);
  renderInsights(els.riskList, els.riskCount, snapshot.risks || []);
  renderInsights(els.opportunityList, els.opportunityCount, snapshot.opportunities || []);
  renderActions(snapshot.actions || []);
  renderStrategy(snapshot.strategyPlan || []);
  renderTechnicalChecks(snapshot.technicalChecks || []);
  renderCrawlEvidence(snapshot.crawlEvidence || []);
  renderCompactList(els.topPages, els.pageCount, snapshot.topPages || [], "path");
  renderCompactList(els.topQueries, els.queryCount, snapshot.topQueries || [], "query");
  renderSources(snapshot.dataSources || []);
}

function renderFocus(snapshot) {
  const fallback = focusForReport(snapshot.reportType || state.reportType);
  const focus = snapshot.focus || fallback;
  els.primaryFocus.textContent = focus.primary || fallback.primary;
  els.bestFor.textContent = focus.bestFor || fallback.bestFor;
  els.decisionOutput.textContent = focus.output || fallback.output;
}

function focusForReport(reportType) {
  const focus = {
    daily: {
      primary: "Detect abnormal SEO movement fast",
      bestFor: "Critical page drops, index issues, sudden CTR or click changes",
      output: "Today: observe, investigate, or execute urgent fix"
    },
    weekly: {
      primary: "Prioritize optimization work",
      bestFor: "Pages to refresh, queries to rewrite, internal links, quick wins",
      output: "This week: concrete SEO action queue with how-to steps"
    },
    "28-days": {
      primary: "Plan SEO resource allocation",
      bestFor: "Topic clusters, new content, backlink support, technical backlog",
      output: "Next 28 days: invest, pause, refresh, or fix"
    }
  };
  return focus[reportType] || focus.daily;
}

function renderStatus(snapshot) {
  const statuses = [
    { label: snapshot.health || "watch", cls: snapshot.health || "watch" },
    { label: "Local data", cls: "good" },
    { label: REPORT_LABELS[snapshot.reportType] || "Report", cls: "good" }
  ];
  els.statusRow.innerHTML = "";
  statuses.forEach((status) => {
    const pill = document.createElement("span");
    pill.className = `status-pill ${status.cls}`;
    pill.textContent = titleCase(status.label);
    els.statusRow.append(pill);
  });
}

function renderKpis(kpis) {
  els.kpiGrid.innerHTML = "";
  kpis.forEach((kpi) => {
    const card = document.createElement("article");
    card.className = "kpi-card";
    const deltaClass = kpi.absChange > 0 ? "positive" : kpi.absChange < 0 ? "negative" : "";
    card.innerHTML = `
      <header>
        <h3>${escapeHtml(kpi.label)}</h3>
        <span class="status-pill ${escapeHtml(kpi.status)}">${escapeHtml(titleCase(kpi.status))}</span>
      </header>
      <div class="kpi-value">${formatNumber(kpi.value)}</div>
      <div class="delta-row">
        <span class="delta ${deltaClass}">${formatSigned(kpi.absChange)}</span>
        <span class="delta ${deltaClass}">${formatSigned(kpi.pctChange)}%</span>
      </div>
      <p class="baseline-note">Baseline ${formatNumber(kpi.baseline)} | ${escapeHtml(kpi.tier)} tier | ${escapeHtml(kpi.source)}</p>
    `;
    const comparisonNote = renderKpiComparisonNode(kpi.comparisons);
    if (comparisonNote) card.append(comparisonNote);
    els.kpiGrid.append(card);
  });
}

function renderKpiComparisonNode(comparisons = []) {
  if (!Array.isArray(comparisons) || !comparisons.length) return null;
  const note = document.createElement("p");
  note.className = "baseline-note";
  note.innerHTML = comparisons
    .map((item) => `${escapeHtml(item.label)} ${formatNumber(item.value)}`)
    .join("<br>");
  return note;
}

function renderInsights(container, countEl, items) {
  container.innerHTML = "";
  countEl.textContent = String(items.length);
  if (!items.length) {
    container.append(emptyState());
    return;
  }
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "insight-card";
    card.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(normalizeMaybePath(item.target || ""))}</p>
      <p>${escapeHtml(item.diagnosis || "")}</p>
      <span class="badge">${escapeHtml(item.actionType || "Action")}</span>
    `;
    container.append(card);
  });
}

function renderActions(actions) {
  els.actionTableBody.innerHTML = "";
  els.actionCount.textContent = String(actions.length);
  if (!actions.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">${emptyState().outerHTML}</td>`;
    els.actionTableBody.append(row);
    return;
  }
  actions.forEach((action) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(action.priority)}</td>
      <td>${escapeHtml(action.action)}</td>
      <td>${escapeHtml(normalizeMaybePath(action.target))}</td>
      <td>${escapeHtml(action.howTo)}</td>
      <td>${escapeHtml(action.result || action.output)}</td>
    `;
    els.actionTableBody.append(row);
  });
}

function renderStrategy(groups) {
  els.strategyGrid.innerHTML = "";
  const totalItems = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
  els.strategyCount.textContent = String(totalItems);
  if (!groups.length) {
    els.strategyGrid.append(emptyState());
    return;
  }
  groups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "strategy-card";
    const items = group.items || [];
    card.innerHTML = `
      <header>
        <h4>${escapeHtml(group.category)}</h4>
        <span class="status-pill ${escapeHtml(group.status || "watch")}">${escapeHtml(titleCase(group.status || "watch"))}</span>
      </header>
      <ul>
        ${items.map((item) => `
          <li>
            <strong>${escapeHtml(normalizeMaybePath(item.target))}</strong><br>
            ${escapeHtml(item.reason || "")}<br>
            <em>${escapeHtml(item.nextStep || "")}</em>
          </li>
        `).join("")}
      </ul>
    `;
    els.strategyGrid.append(card);
  });
}

function renderTechnicalChecks(checks) {
  els.technicalGrid.innerHTML = "";
  els.technicalCount.textContent = String(checks.length);
  if (!checks.length) {
    els.technicalGrid.append(emptyState());
    return;
  }
  checks.forEach((check) => {
    const card = document.createElement("article");
    card.className = "technical-card";
    card.innerHTML = `
      <div>
        <h4>${escapeHtml(check.check)}</h4>
        <p><strong>Frequency:</strong> ${escapeHtml(check.frequency)}</p>
        <p><strong>Source:</strong> ${escapeHtml(check.source)}</p>
        <p>${escapeHtml(check.purpose)}</p>
      </div>
      <span class="status-pill ${escapeHtml(check.status || "watch")}">${escapeHtml(titleCase(check.status || "watch"))}</span>
    `;
    els.technicalGrid.append(card);
  });
}

function renderCrawlEvidence(groups) {
  els.crawlEvidenceGrid.innerHTML = "";
  const totalItems = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
  els.crawlEvidenceCount.textContent = String(totalItems);
  if (!groups.length) {
    els.crawlEvidenceGrid.append(emptyState());
    return;
  }
  groups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "evidence-card";
    const items = group.items || [];
    card.innerHTML = `
      <header>
        <div>
          <h4>${escapeHtml(group.title)}</h4>
          <p>${escapeHtml(group.summary || "")}</p>
        </div>
        <span class="status-pill ${escapeHtml(group.status || "watch")}">${escapeHtml(titleCase(group.status || "watch"))}</span>
      </header>
      <div class="evidence-list">
        ${items.map((item) => `
          <div class="evidence-row">
            <strong>${escapeHtml(normalizeMaybePath(item.target || ""))}</strong>
            <span>${escapeHtml(item.detail || "")}</span>
            <em>${escapeHtml(item.nextStep || "")}</em>
          </div>
        `).join("")}
      </div>
    `;
    els.crawlEvidenceGrid.append(card);
  });
}

function renderCompactList(container, countEl, items, key) {
  container.innerHTML = "";
  countEl.textContent = String(items.length);
  if (!items.length) {
    container.append(emptyState());
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "compact-row";
    const label = key === "path" ? normalizePath(item[key]) : item[key];
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(label)}</strong>
        <br>
        <small>${escapeHtml(item.metric || "")}</small>
      </div>
      <span class="status-pill ${escapeHtml(item.status || "watch")}">${escapeHtml(titleCase(item.status || "watch"))}</span>
    `;
    container.append(row);
  });
}

function normalizeMaybePath(value) {
  const text = String(value || "");
  if (text.startsWith("http") || text.startsWith("/") || text.includes("?")) {
    return normalizePath(text);
  }
  return text;
}

function formatComparison(snapshot) {
  if (Array.isArray(snapshot.comparisonOptions) && snapshot.comparisonOptions.length) {
    return snapshot.comparisonOptions
      .map((item) => `${item.label}: ${formatPeriod(item.period)}`)
      .join(" | ");
  }
  return `${snapshot.baselinePeriod?.label || "Baseline"}: ${formatPeriod(snapshot.baselinePeriod)}`;
}

function renderSources(sources) {
  els.sourceGrid.innerHTML = "";
  els.sourceCount.textContent = String(sources.length);
  if (!sources.length) {
    els.sourceGrid.append(emptyState());
    return;
  }
  sources.forEach((source) => {
    const card = document.createElement("div");
    card.className = "source-card";
    card.innerHTML = `
      <strong>${escapeHtml(source.source)}</strong>
      <span>${escapeHtml(titleCase(source.status || "unknown"))}</span>
      <span>${escapeHtml(source.detail || "")}</span>
    `;
    els.sourceGrid.append(card);
  });
}

function exportSnapshot() {
  if (!state.snapshot) return;
  const blob = new Blob([JSON.stringify(state.snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.snapshot.snapshotName || `${state.reportType}-${state.reportEndDate}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function markSourcesForManual(sources) {
  return sources.map((source) => ({
    ...source,
    status: source.status === "pending" ? "pending" : "reused"
  }));
}

function normalizePath(value) {
  if (!value) return "";
  try {
    const parsed = value.startsWith("http") ? new URL(value) : new URL(value, "https://local.example");
    return parsed.pathname || "/";
  } catch {
    return String(value).split("?")[0].split("#")[0];
  }
}

function getProject() {
  return CONFIG.projects.find((project) => project.id === state.projectId) || CONFIG.projects[0];
}

function getSubdomain() {
  const project = getProject();
  return project.subdomains.find((subdomain) => subdomain.id === state.subdomainId) || project.subdomains[0];
}

function getSubdomainLabel() {
  const subdomain = getSubdomain();
  return subdomain.host || subdomain.label || subdomain.id;
}

function emptyState() {
  return els.emptyTemplate.content.firstElementChild.cloneNode(true);
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

function formatPeriod(period) {
  if (!period) return "-";
  if (period.start === period.end) return period.start;
  return `${period.start} to ${period.end}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatSigned(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toLocaleString()}`;
}

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
