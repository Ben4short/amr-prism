/* =========================================================================
   AMR Prism — application controller and view renderer
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const E = AMR.Engine;
  const KB = AMR.KB;
  const R = AMR.Reasoner;
  const C = AMR.Charts;
  const Chat = AMR.Chat;
  const Rep = AMR.Report;

  const STORE = 'amr-prism-state-v2';
  const VIEW_LABEL = {
    overview: 'Overview', isolates: 'Isolates', lab: 'Lab results', matrix: 'Concordance matrix',
    reasoning: 'Reasoning lab', chat: 'Ask AMR Prism', import: 'Import data', report: 'Report builder'
  };
  const VALID_VIEWS = Object.keys(VIEW_LABEL);

  const App = {
    dataset: null,
    analysis: null,
    view: 'overview',
    selectedIsolateId: null,
    filters: { isolateQuery: '', species: 'all', sort: 'id' },
    lab: { species: 'all' },
    matrix: { mode: 'status', class: 'all', query: '' },
    chat: { mode: 'conversation', messages: [] },
    report: null,
    pending: null,
    _saveWarned: false
  };
  AMR.App = App;

  /* ------------------------------------------------------------------ */
  /* icons                                                               */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    microscope: '<path d="M6 18h12M9 18v-5m0 0 3-7 4 2-3 7m-4-2 4 2M8 21h8M5 14a7 7 0 0 0 14 0"/>',
    matrix: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.8V16a3 3 0 0 0 3 3h1a2 2 0 0 0 4 0h1a3 3 0 0 0 3-3v-2.2A3 3 0 0 0 18 8V7a3 3 0 0 0-3-3h-1a2 2 0 0 0-4 0H9Z"/><path d="M12 6v12"/>',
    chat: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.5-5A8 8 0 1 1 21 12Z"/><path d="M8 11h8M8 15h5"/>',
    upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    download: '<path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M4 18v2h16v-2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    sparkles: '<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 3l.7 1.8L8 5.5l-2.3.7L5 8l-.7-1.8L2 5.5l2.3-.7L5 3Z"/>',
    flask: '<path d="M9 3h6M10 3v6L4 20a1 1 0 0 0 .9 1h14.2a1 1 0 0 0 .9-1L14 9V3"/><path d="M7 15h10"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7l-7 7Z"/><path d="m7 10 7 7"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/>',
    activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4ZM20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3V4Z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9m0 0V4m0 5h5M4 13a8 8 0 0 0 14 4l2-2m0 0v5m0-5h-5"/>',
    arrow: '<path d="M5 12h14m0 0-5-5m5 5-5 5"/>',
    dot: '<circle cx="12" cy="12" r="3"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.dot) + '</svg>';
  }
  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.getAttribute('data-icon-done')) return;
      const existing = el.innerHTML;
      el.innerHTML = icon(el.getAttribute('data-icon')) + existing;
      el.setAttribute('data-icon-done', '1');
    });
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const esc = E.escapeHtml;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function pct(v) { return E.pct(v); }
  function cls(v) { return esc(v == null ? '' : v); }
  function statusTone(status) {
    if (status === 'concordant-r' || status === 'unexplained') return 'red';
    if (status === 'concordant-s') return 'green';
    if (status === 'partial') return 'amber';
    if (status === 'silent') return 'purple';
    return 'outline';
  }
  function statusBadge(status) {
    const c = KB.CONCORDANCE[status] || { label: status };
    return '<span class="badge ' + statusTone(status) + '">' + esc(c.label) + '</span>';
  }
  function sirBadge(sir) {
    if (!sir) return '<span class="badge outline">NT</span>';
    return '<span class="badge ' + (sir === 'R' ? 'red' : sir === 'I' ? 'amber' : 'green') + '">' + esc(sir) + '</span>';
  }
  function mdrBadge(v) {
    const tone = v === 'PDR' || v === 'XDR' ? 'red' : v === 'MDR' ? 'amber' : v === 'Non-MDR' ? 'green' : 'outline';
    return '<span class="badge ' + tone + '">' + esc(v) + '</span>';
  }
  function confBadge(c) {
    return '<span class="badge ' + (c >= 0.8 ? 'green' : c >= 0.6 ? 'amber' : 'outline') + '">' + Math.round(c * 100) + '%</span>';
  }
  function pageHead(eyebrow, title, desc, actions) {
    return '<div class="page-head"><div><div class="page-eyebrow">' + esc(eyebrow) + '</div><h1 class="page-title">' + esc(title) + '</h1>' +
      (desc ? '<div class="page-desc">' + desc + '</div>' : '') + '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function emptyState(iconName, title, text, actions) {
    return '<div class="card empty"><div class="empty-icon">' + icon(iconName) + '</div><div class="empty-title">' + esc(title) + '</div>' +
      '<div class="empty-text">' + esc(text) + '</div>' + (actions || '') + '</div>';
  }
  function chartCard(title, sub, svg, extra) {
    return '<div class="card chart-card"><div class="card-head"><div><div class="card-title">' + esc(title) + '</div>' +
      (sub ? '<div class="card-sub">' + esc(sub) + '</div>' : '') + '</div>' + (extra || '') + '</div>' +
      '<div class="chart-wrap">' + svg + '</div></div>';
  }
  function dataTable(headers, rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<div class="table-empty">' + esc(opts.empty || 'No rows to show.') + '</div>';
    return '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      headers.map(function (h) { return '<th' + (h.align ? ' style="text-align:' + h.align + '"' : '') + '>' + esc(h.label || h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function detailsFinding(f, open) {
    const supportText = f.supports.length ? f.supports.map(function (s) {
      return '<span class="gene-chip">' + esc(s.display) + '</span>';
    }).join(' ') : '<span class="muted tiny">No detected determinant maps to this drug.</span>';
    return '<details class="finding"' + (open ? ' open' : '') + '><summary class="finding-head">' +
      '<div><div class="finding-drug">' + esc(f.drugName) + '</div><div class="tiny muted">' + esc(f.drugClassLabel) +
      (f.observedMic ? ' · MIC ' + esc(f.observedMic) + ' mg/L' : f.observedZone ? ' · zone ' + esc(f.observedZone) : '') + '</div></div>' +
      '<div class="finding-badges">' + sirBadge(f.observed) + ' ' + statusBadge(f.status) + ' ' + confBadge(f.confidence) + '</div>' +
      '</summary><div class="finding-body">' +
      '<div class="finding-summary-line">Predicted <strong>' + esc(f.predictedLabel) + '</strong> · observed <strong>' + esc(f.observed || 'not tested') + '</strong> · confidence <strong>' + Math.round(f.confidence * 100) + '% (' + esc(f.confidenceLabel) + ')</strong></div>' +
      '<div class="finding-supports">' + supportText + '</div>' +
      '<div class="finding-chain">' + f.chain.map(function (s, i) {
        return '<div class="chain-step"><span class="idx">' + (i + 1) + '</span><div><strong>' + esc(s.label) + '</strong><br>' + esc(s.text) + '</div></div>';
      }).join('') + '</div>' +
      (f.hypotheses && f.hypotheses.length ? '<div class="hypothesis-list">' + f.hypotheses.map(function (h, i) {
        return '<div class="hypothesis"><span class="rank">' + (i + 1) + '</span><div><div class="h-title">' + esc(h.title) + '</div>' +
          '<div class="h-sub">' + esc(h.why) + ' <em>Next: ' + esc(h.next) + '</em></div></div><span class="h-prob">' + h.probability + '%</span></div>';
      }).join('') + '</div>' : '') +
      '</div></details>';
  }
  function geneTable(a) {
    return dataTable([
      { label: 'Determinant' }, { label: 'Mechanism' }, { label: 'Family' }, { label: 'Identity', align: 'right' },
      { label: 'Coverage', align: 'right' }, { label: 'Source' }
    ], a.isolate.genes.map(function (g) {
      const entry = KB.resolveGene(g.symbol, g);
      return [
        '<strong class="mono">' + esc(g.symbol) + '</strong>',
        esc(entry ? entry.mechanism : (g.mechanism || 'unresolved')),
        esc(entry ? entry.family : (g.subclass || '—')),
        g.identity != null ? E.fmt(g.identity, 1) + '%' : '—',
        g.coverage != null ? '<span class="' + (g.coverage < 80 ? 'badge amber' : '') + '">' + E.fmt(g.coverage, 0) + '%</span>' : '—',
        esc(g.method || '—')
      ];
    }), { empty: 'No determinants were imported for this isolate.' });
  }
  function phenotypeTable(a) {
    return dataTable([
      { label: 'Drug' }, { label: 'MIC' }, { label: 'SIR' }, { label: 'Predicted' }, { label: 'Status' }, { label: 'Method' }
    ], a.isolate.phenotypes.map(function (ph) {
      const f = a.findings.find(function (x) { return x.drug === ph.drug; });
      return [
        '<strong>' + esc(ph.drugName || E.drugInfo(ph.drug).name) + '</strong>',
        esc(ph.mic || ph.zone || '—'),
        sirBadge(ph.sir),
        f ? esc(f.predictedLabel) : '—',
        f ? statusBadge(f.status) : '<span class="badge outline">—</span>',
        esc(ph.method || '—')
      ];
    }), { empty: 'No AST phenotypes were imported for this isolate.' });
  }

  /* ------------------------------------------------------------------ */
  /* persistence / dataset                                               */
  /* ------------------------------------------------------------------ */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.dataset || !Array.isArray(s.dataset.isolates)) return null;
      return s;
    } catch (e) { return null; }
  }
  function saveState() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ dataset: App.dataset, view: App.view, report: App.report }));
    } catch (e) {
      if (!App._saveWarned) {
        App._saveWarned = true;
        toast('This dataset is too large for browser storage. It remains active in this tab; export JSON to keep it.', 'info');
      }
    }
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function setDataset(ds, opts) {
    opts = opts || {};
    if (!ds) return;
    const next = clone(ds);
    next.isolates = (next.isolates || []).map(function (iso) { return E.normalizeIsolate(iso); });
    next.images = next.images || [];
    App.dataset = next;
    App.analysis = R.analyzeDataset(next);
    if (!App.selectedIsolateId || !App.analysis.byId[App.selectedIsolateId]) {
      App.selectedIsolateId = App.analysis.isolates.length ? App.analysis.isolates[0].isolate.id : null;
    }
    App.chat.messages = [];
    saveState();
    updateChrome();
    if (opts.render) render();
    if (opts.toast) toast(opts.toast, 'success');
  }
  function updateChrome() {
    const a = App.analysis;
    const ds = App.dataset;
    const n = a ? a.isolates.length : 0;
    const nav = $('#nav-isolate-count');
    if (nav) nav.textContent = n;
    const name = $('#dataset-name');
    const meta = $('#dataset-meta');
    if (name) name.textContent = ds ? (ds.name || 'Untitled dataset') : 'No dataset';
    if (meta) meta.textContent = ds ? (n + ' isolate' + (n === 1 ? '' : 's') + ' · ' + (a ? a.assessedTotal : 0) + ' comparisons') : 'Import or load demo data';
    const top = $('#topbar-concordance');
    if (top) top.textContent = a && a.strictRate != null ? pct(a.strictRate) : '—';
    const crumb = $('#crumb-view');
    if (crumb) crumb.textContent = VIEW_LABEL[App.view] || 'Overview';
    $$('.nav-item').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === App.view); });
    const reportBtn = $('#topbar-report');
    if (reportBtn) reportBtn.disabled = !ds || !n;
  }

  /* ------------------------------------------------------------------ */
  /* navigation / render                                                 */
  /* ------------------------------------------------------------------ */
  function navigate(view, initial) {
    if (VALID_VIEWS.indexOf(view) < 0) view = 'overview';
    App.view = view;
    closeDrawer();
    updateChrome();
    render();
    if (!initial) saveState();
    const root = $('#view-root');
    if (root) root.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function render() {
    const root = $('#view-root');
    if (!root) return;
    updateChrome();
    let html = '';
    try {
      if (!App.analysis || !App.dataset) html = renderNoData();
      else if (App.view === 'overview') html = renderOverview();
      else if (App.view === 'isolates') html = renderIsolates();
      else if (App.view === 'lab') html = renderLab();
      else if (App.view === 'matrix') html = renderMatrix();
      else if (App.view === 'reasoning') html = renderReasoning();
      else if (App.view === 'chat') html = renderChat();
      else if (App.view === 'import') html = renderImport();
      else if (App.view === 'report') html = renderReport();
      else html = renderOverview();
    } catch (err) {
      console.error(err);
      html = emptyState('alert', 'The view could not be rendered', err && err.message ? err.message : String(err), '');
    }
    root.innerHTML = html;
    afterRender();
  }
  function afterRender() {
    if (App.view === 'isolates') bindIsolates();
    if (App.view === 'lab') bindLab();
    if (App.view === 'matrix') bindMatrix();
    if (App.view === 'reasoning') bindReasoning();
    if (App.view === 'chat') bindChat();
    if (App.view === 'import') bindImport();
    if (App.view === 'report') bindReport();
  }

  /* ------------------------------------------------------------------ */
  /* overview                                                            */
  /* ------------------------------------------------------------------ */
  function renderNoData() {
    return pageHead('Workspace', 'Start with evidence', 'Import AMRFinderPlus output, AST results, a narrative, or load the 50-isolate study template. Everything is processed locally in this browser.') +
      '<div class="hero"><div class="hero-kicker"><span class="pulse"></span>No dataset loaded</div>' +
      '<h2 class="hero-title">Turn genotype and phenotype into an <em>explicit argument</em>.</h2>' +
      '<div class="hero-desc">AMR Prism compares detected resistance determinants with measured susceptibility using a transparent rule engine. It labels every comparison, ranks the explanations for disagreement, and names the next test that would discriminate between them.</div>' +
      '<div class="hero-actions"><button class="btn primary" data-action="load-study">' + icon('flask') + 'Load study template</button>' +
      '<button class="btn" data-action="load-demo">' + icon('database') + 'Load demo cohort</button>' +
      '<button class="btn ghost" data-view="import">' + icon('upload') + 'Import data</button></div></div>' +
      '<div class="section"><div class="axiom-grid">' + KB.AXIOMS.slice(0, 4).map(function (ax) {
        return '<div class="axiom"><div class="a-id">' + ax.id + '</div><div class="a-title">' + esc(ax.title) + '</div><div class="a-text">' + esc(ax.text) + '</div></div>';
      }).join('') + '</div></div>';
  }

  function renderOverview() {
    const a = App.analysis;
    const ds = App.dataset;
    const counts = a.counts;
    const teaching = a.topMismatches.slice(0, 3);
    const lab = labStats();
    const noLab = a.assessedTotal === 0;
    const primary = noLab
      ? '<button class="btn primary" data-view="lab">' + icon('flask') + 'Enter lab results</button>'
      : '<button class="btn primary" data-view="chat">' + icon('chat') + 'Ask AMR Prism</button>';
    const hero = '<div class="hero"><div class="hero-kicker"><span class="pulse"></span>' + esc(ds.source || 'Imported evidence') + '</div>' +
      '<h2 class="hero-title">Read the <em>argument</em>, not just the gene list.</h2>' +
      '<div class="hero-desc">' + esc(ds.description || 'A genotype–phenotype review of the current cohort.') + ' Every prediction is traced from molecular evidence to biochemical action, drug context, and the observed phenotype. Disagreement is treated as a missing premise.</div>' +
      '<div class="hero-actions">' + primary +
      '<button class="btn" data-action="download-report">' + icon('download') + 'Download report</button>' +
      '<button class="btn ghost" data-view="import">' + icon('upload') + 'Import more</button></div>' +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><div class="n">' + a.totalGenes + '</div><div class="l">determinant calls</div></div>' +
      '<div class="hero-stat"><div class="n">' + a.speciesDistribution.length + '</div><div class="l">species</div></div>' +
      '<div class="hero-stat"><div class="n">' + lab.entered + '/' + lab.total + '</div><div class="l">lab results entered</div></div>' +
      '<div class="hero-stat"><div class="n">' + a.majorMismatchTotal + '</div><div class="l">major mismatches</div></div>' +
      '<div class="hero-stat"><div class="n">' + (a.images ? a.images.length : 0) + '</div><div class="l">evidence images</div></div>' +
      '</div></div>';

    const labCta = noLab ? '<div class="section"><div class="card lab-cta"><div class="lab-cta-icon">' + icon('flask') + '</div>' +
      '<div class="lab-cta-body"><div class="card-title">' + (a.totalGenes ? 'Enter the lab results to complete the comparison' : 'Two inputs are still missing') + '</div>' +
      '<div class="card-sub">' + (a.totalGenes
        ? 'The genomic side is loaded. Record the S/I/R result for each isolate and study drug, and the concordance analysis will populate immediately.'
        : 'Import the AMRFinderPlus resistance table for the public genomes, then record the S/I/R result for each isolate and study drug. The study panel is ' + lab.panel.length + ' drugs across ' + a.isolates.length + ' isolates.') + '</div>' +
      '<div class="lab-cta-actions"><button class="btn primary" data-view="lab">' + icon('flask') + 'Enter lab results</button>' +
      '<button class="btn" data-view="import">' + icon('upload') + 'Import AMRFinderPlus</button>' +
      '<button class="btn ghost" data-action="download-lab-template">' + icon('download') + 'Blank lab CSV</button></div></div></div></div>' : '';

    const kpis = '<div class="grid grid-4 section">' +
      kpi('Isolates', a.isolates.length, a.speciesDistribution.length + ' species', 'microscope') +
      kpi('Assessed comparisons', a.assessedTotal, 'MIC or SIR available', 'activity') +
      kpi('Strict concordance', pct(a.strictRate), 'weighted ' + pct(a.weightedRate), 'shield') +
      kpi('Major mismatches', a.majorMismatchTotal, pct(a.majorRate) + ' of assessed', 'alert', 'red') +
      '</div>';

    const charts = '<div class="section"><div class="section-head"><div><div class="section-title">Concordance and resistance landscape</div><div class="section-sub">The comparison is the unit of analysis, not the gene.</div></div>' +
      '<div class="segmented"><button class="active" data-view="matrix">Open matrix</button></div></div>' +
      '<div class="grid grid-2">' +
      chartCard('Concordance composition', 'Every assessed drug–isolate comparison', C.donut([
        { label: 'Concordant R', value: counts['concordant-r'], color: KB.CONCORDANCE['concordant-r'].color },
        { label: 'Concordant S', value: counts['concordant-s'], color: KB.CONCORDANCE['concordant-s'].color },
        { label: 'Partial', value: counts.partial, color: KB.CONCORDANCE.partial.color },
        { label: 'Silent determinant', value: counts.silent, color: KB.CONCORDANCE.silent.color },
        { label: 'Unexplained resistance', value: counts.unexplained, color: KB.CONCORDANCE.unexplained.color }
      ].filter(function (s) { return s.value; }), { theme: 'dark', size: 190, centerValue: pct(a.strictRate), centerLabel: 'strict concordance' })) +
      chartCard('Resistance by drug class', 'Non-susceptible share of tested isolates', C.bars(a.classResistance.slice(0, 9).map(function (c) {
        return { label: c.label, value: Math.round(c.rate * 100), color: c.color };
      }), { theme: 'dark', width: 470, valueFormat: function (v) { return v + '%'; }, labelChars: 22 })) +
      '</div><div class="grid grid-2" style="margin-top:16px">' +
      chartCard('Most prevalent determinants', 'Counted once per isolate', C.bars(a.genePrevalence.slice(0, 10).map(function (g) {
        return { label: g.display, value: g.count, color: '#7dd3fc' };
      }), { theme: 'dark', width: 470, labelChars: 24 })) +
      chartCard('Species composition', 'Isolates in the current dataset', C.speciesBars(a.speciesDistribution, { theme: 'dark', width: 470 })) +
      '</div></div>';

    const teachingHtml = teaching.length ? '<div class="section"><div class="section-head"><div><div class="section-title">Teaching signals</div><div class="section-sub">The mismatches that reveal a missing premise.</div></div><button class="btn small ghost" data-view="chat">Ask about these</button></div>' +
      '<div class="grid grid-3">' + teaching.map(function (m) {
        const f = m.finding;
        const h = f.hypotheses && f.hypotheses[0];
        return '<article class="card card-pad" data-action="open-isolate" data-id="' + esc(m.isolateId) + '" style="cursor:pointer">' +
          '<div class="finding-head"><div><div class="mono tiny muted">' + esc(m.isolateId) + ' · ' + esc(E.speciesInfo(m.species).short) + '</div>' +
          '<div class="card-title" style="margin-top:4px">' + esc(f.drugName) + '</div></div>' + statusBadge(f.status) + '</div>' +
          '<div class="tiny muted" style="margin-top:9px">Predicted ' + esc(f.predictedLabel) + ', observed ' + esc(f.observed) +
          (f.observedMic ? ' (MIC ' + esc(f.observedMic) + ')' : '') + '.</div>' +
          (h ? '<div class="tiny" style="margin-top:8px;color:var(--amber)">' + esc(h.title) + ' · ' + h.probability + '%</div>' +
            '<div class="tiny muted" style="margin-top:5px">Next: ' + esc(h.next) + '</div>' : '') +
          '</article>';
      }).join('') + '</div></div>' : '';

    const mdr = '<div class="section"><div class="grid grid-2">' +
      chartCard('MDR / XDR / PDR', 'Based on tested drug categories', C.donut(Object.keys(a.mdrSummary).filter(function (k) { return a.mdrSummary[k]; }).map(function (k) {
        return { label: k, value: a.mdrSummary[k], color: k === 'PDR' ? '#ff6b78' : k === 'XDR' ? '#fb7185' : k === 'MDR' ? '#f5b84b' : k === 'Non-MDR' ? '#4ade80' : '#647f96' };
      }), { theme: 'dark', size: 190, centerValue: a.isolates.length, centerLabel: 'isolates' })) +
      '<div class="card card-pad"><div class="card-title">How to read this dashboard</div><div class="card-body" style="padding:12px 0 0">' +
      '<div class="trace-box"><div class="trace-label">The comparison is the argument</div><p>A gene is a premise, not a conclusion. The dashboard keeps the chain visible so you can challenge the mechanism, the evidence, or the phenotype independently.</p></div>' +
      '<div class="trace-box" style="border-left-color:var(--amber)"><div class="trace-label" style="color:var(--amber)">Mismatch is information</div><p>Silent determinants and unexplained resistance are the cases that teach the most. Open one to see the ranked hypotheses and the next discriminating test.</p></div>' +
      '<div class="trace-box" style="border-left-color:var(--blue)"><div class="trace-label" style="color:var(--blue)">Confidence is earned</div><p>High confidence requires strong molecular evidence, a plausible mechanism, and a reliable phenotype. A weak link lowers the score.</p></div></div></div>' +
      '</div></div>';

    const axioms = '<div class="section"><div class="section-head"><div><div class="section-title">The reasoning axioms</div><div class="section-sub">The rules that constrain every answer.</div></div></div><div class="axiom-grid">' +
      KB.AXIOMS.map(function (ax) {
        return '<div class="axiom"><div class="a-id">' + ax.id + '</div><div class="a-title">' + esc(ax.title) + '</div><div class="a-text">' + esc(ax.text) + '</div></div>';
      }).join('') + '</div></div>';

    return pageHead('Cohort workspace', ds.name || 'Untitled dataset', esc(ds.description || ''), '<button class="btn" data-view="isolates">' + icon('microscope') + 'Isolates</button><button class="btn" data-view="lab">' + icon('flask') + 'Lab results</button><button class="btn primary" data-action="download-report">' + icon('download') + 'Download report</button>') +
      hero + labCta + kpis + charts + teachingHtml + mdr + axioms;
  }
  function kpi(label, value, foot, iconName, tone) {
    return '<div class="card kpi ' + (tone || '') + '"><div class="kpi-label">' + icon(iconName || 'activity') + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + '</div><div class="kpi-foot">' + esc(foot || '') + '</div></div>';
  }

  /* ------------------------------------------------------------------ */
  /* isolates                                                            */
  /* ------------------------------------------------------------------ */
  function filteredIsolates() {
    const a = App.analysis;
    let list = a.isolates.slice();
    const q = App.filters.isolateQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(function (ia) {
        return (ia.isolate.id + ' ' + ia.isolate.species + ' ' + (ia.isolate.source || '') + ' ' +
          ia.isolate.genes.map(function (g) { return g.symbol; }).join(' ')).toLowerCase().indexOf(q) >= 0;
      });
    }
    if (App.filters.species !== 'all') list = list.filter(function (ia) { return E.speciesInfo(ia.isolate.species).label === App.filters.species; });
    const sort = App.filters.sort;
    list.sort(function (x, y) {
      if (sort === 'concordance') return (y.strictRate || 0) - (x.strictRate || 0);
      if (sort === 'mismatch') return (y.majorRate || 0) - (x.majorRate || 0);
      if (sort === 'genes') return y.geneCount - x.geneCount;
      return String(x.isolate.id).localeCompare(String(y.isolate.id));
    });
    return list;
  }
  function renderIsolates() {
    const a = App.analysis;
    const species = a.speciesDistribution.map(function (s) { return s.label; });
    const actions = '<button class="btn ghost" data-action="load-study">' + icon('flask') + 'Study template</button>' +
      '<button class="btn ghost" data-action="load-demo">' + icon('refresh') + 'Demo</button>' +
      '<button class="btn" data-view="lab">' + icon('flask') + 'Lab results</button>' +
      '<button class="btn primary" data-action="download-report">' + icon('download') + 'Download report</button>';
    return pageHead('Evidence', 'Isolates', 'Open an isolate to inspect its determinants, phenotypes, comparison status, and the full reasoning chain for every drug.', actions) +
      '<div class="table-tools"><div class="searchbox">' + icon('search') + '<input class="input" id="isolate-search" aria-label="Search isolates" placeholder="Search isolate, species, source, or gene…" value="' + esc(App.filters.isolateQuery) + '"></div>' +
      '<select class="select" id="isolate-species" aria-label="Filter by species" style="width:190px"><option value="all">All species</option>' +
      species.map(function (s) { return '<option value="' + esc(s) + '"' + (App.filters.species === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      '<select class="select" id="isolate-sort" aria-label="Sort isolates" style="width:180px">' +
      [['id', 'Sort: isolate ID'], ['concordance', 'Sort: concordance'], ['mismatch', 'Sort: mismatch burden'], ['genes', 'Sort: determinant count']].map(function (o) {
        return '<option value="' + o[0] + '"' + (App.filters.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select><div class="tiny muted" id="isolate-count"></div></div>' +
      '<div class="isolate-grid" id="isolate-grid"></div>';
  }
  function renderIsolateGrid() {
    const list = filteredIsolates();
    const grid = $('#isolate-grid');
    const count = $('#isolate-count');
    if (count) count.textContent = list.length + ' of ' + App.analysis.isolates.length + ' isolates';
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="table-empty" style="grid-column:1/-1">No isolates match the current filter.</div>';
      return;
    }
    grid.innerHTML = list.map(function (ia) { return isolateCard(ia); }).join('');
  }
  function isolateCard(ia) {
    const iso = ia.isolate;
    const total = ia.assessedCount || 1;
    const segs = [
      ['concordant-r', ia.counts['concordant-r']],
      ['concordant-s', ia.counts['concordant-s']],
      ['partial', ia.counts.partial],
      ['silent', ia.counts.silent],
      ['unexplained', ia.counts.unexplained]
    ].filter(function (x) { return x[1]; });
    const genes = iso.genes.slice(0, 5);
    return '<article class="card isolate-card" data-action="open-isolate" data-id="' + esc(iso.id) + '">' +
      '<div class="top"><div><div class="id">' + esc(iso.id) + '</div><div class="species">' + esc(E.speciesInfo(iso.species).label) + '</div></div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">' + mdrBadge(ia.mdrClass) + '<span class="badge outline">' + ia.geneCount + ' genes</span></div></div>' +
      '<div class="meta"><span>' + esc(iso.source || 'Source not recorded') + '</span><span>' + esc(iso.collectionDate || 'No date') + '</span><span>' + ia.assessedCount + ' tested</span></div>' +
      '<div class="genes">' + (genes.length ? genes.map(function (g) { return '<span class="gene-chip">' + esc(g.symbol) + '</span>'; }).join('') : '<span class="gene-chip more">no acquired genes</span>') +
      (iso.genes.length > 5 ? '<span class="gene-chip more">+' + (iso.genes.length - 5) + '</span>' : '') + '</div>' +
      '<div class="bar">' + segs.map(function (s) {
        return '<span style="width:' + (s[1] / total * 100).toFixed(2) + '%;background:' + KB.CONCORDANCE[s[0]].color + '"></span>';
      }).join('') + '</div>' +
      '<div class="bar-legend"><span>strict ' + pct(ia.strictRate) + '</span><span>' + ia.majorMismatch + ' major mismatch' + (ia.majorMismatch === 1 ? '' : 'es') + '</span></div>' +
      '</article>';
  }
  function bindIsolates() {
    renderIsolateGrid();
    const search = $('#isolate-search');
    if (search) search.addEventListener('input', function () {
      App.filters.isolateQuery = this.value;
      renderIsolateGrid();
    });
    const sp = $('#isolate-species');
    if (sp) sp.addEventListener('change', function () { App.filters.species = this.value; renderIsolateGrid(); });
    const sort = $('#isolate-sort');
    if (sort) sort.addEventListener('change', function () { App.filters.sort = this.value; renderIsolateGrid(); });
  }

  /* ------------------------------------------------------------------ */
  /* lab results                                                         */
  /* ------------------------------------------------------------------ */
  function studyPanel() {
    if (App.dataset && App.dataset.drugPanel && App.dataset.drugPanel.length) return App.dataset.drugPanel;
    return (KB.STUDY_DRUGS || []).slice();
  }
  function labStats() {
    const a = App.analysis;
    const panel = studyPanel();
    const isolates = a ? a.isolates : [];
    let entered = 0, isolatesWith = 0;
    const drugs = {};
    isolates.forEach(function (ia) {
      let any = false;
      panel.forEach(function (drug) {
        const p = (ia.isolate.phenotypes || []).find(function (x) { return x.drug === drug; });
        if (p && (p.sir || p.mic || p.zone)) {
          entered++;
          any = true;
          drugs[drug] = true;
        }
      });
      if (any) isolatesWith++;
    });
    return {
      panel: panel,
      total: isolates.length * panel.length,
      entered: entered,
      isolatesWith: isolatesWith,
      drugsCovered: Object.keys(drugs).length
    };
  }
  function labStat(label, value, id) {
    return '<div class="lab-stat"><div class="lab-stat-value" id="' + esc(id) + '">' + esc(value) + '</div><div class="lab-stat-label">' + esc(label) + '</div></div>';
  }
  function labCell(iso, drug) {
    const p = (iso.phenotypes || []).find(function (x) { return x.drug === drug; });
    const sir = p && p.sir ? p.sir : '';
    const value = p ? (p.mic || p.zone || '') : '';
    const tone = sir ? sir.toLowerCase() : 'none';
    const title = p ? (p.sirSource === 'interpreted' ? 'SIR interpreted from the entered value' : p.sirSource === 'reported' ? 'SIR reported by the lab' : '') : '';
    return '<td class="lab-cell lab-sir-' + tone + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' +
      '<select class="lab-select" aria-label="' + esc(iso.id + ' ' + E.drugInfo(drug).name + ' SIR') + '" data-lab-isolate="' + esc(iso.id) + '" data-lab-drug="' + esc(drug) + '" data-lab-field="sir">' +
      [['', '—'], ['S', 'S'], ['I', 'I'], ['R', 'R']].map(function (o) {
        return '<option value="' + o[0] + '"' + (sir === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<input class="lab-value" type="text" inputmode="decimal" placeholder="MIC/zone" aria-label="' + esc(iso.id + ' ' + E.drugInfo(drug).name + ' MIC or zone value') + '" data-lab-isolate="' + esc(iso.id) + '" data-lab-drug="' + esc(drug) + '" data-lab-field="value" value="' + esc(value) + '">' +
      '</td>';
  }
  function renderLab() {
    const a = App.analysis;
    if (!a || !a.isolates.length) {
      return '<div id="lab-view">' + pageHead('Study workflow', 'Lab results', 'Enter the phenotype results once the laboratory work is complete.') +
        emptyState('flask', 'No isolates to record against', 'Load the 50-isolate study template first, then enter the lab AST results here.', '<button class="btn primary" data-action="load-study">' + icon('flask') + 'Load study template</button>') + '</div>';
    }
    const stats = labStats();
    const panel = stats.panel;
    const progress = stats.total ? Math.round(stats.entered / stats.total * 100) : 0;
    const speciesList = a.speciesDistribution.map(function (s) { return s.label; });
    const active = App.lab.species !== 'all' && speciesList.indexOf(App.lab.species) >= 0 ? App.lab.species : 'all';
    const rows = a.isolates.filter(function (ia) {
      return active === 'all' || E.speciesInfo(ia.isolate.species).label === active;
    });
    const pills = '<button class="lab-pill' + (active === 'all' ? ' active' : '') + '" data-lab-species="all">All species <span>' + a.isolates.length + '</span></button>' +
      a.speciesDistribution.map(function (s) {
        return '<button class="lab-pill' + (active === s.label ? ' active' : '') + '" data-lab-species="' + esc(s.label) + '">' +
          esc(E.speciesInfo(s.label).short) + ' <span>' + s.count + '</span></button>';
      }).join('');

    const head = '<tr><th class="lab-iso">Isolate</th>' + panel.map(function (drug) {
      const info = E.drugInfo(drug);
      return '<th class="lab-drug"><span>' + esc(info.short || info.name) + '</span><small>' + esc(info.name) + '</small></th>';
    }).join('') + '</tr>';

    let body = '';
    let lastSpecies = null;
    rows.forEach(function (ia) {
      const iso = ia.isolate;
      const species = E.speciesInfo(iso.species).label;
      if (species !== lastSpecies) {
        lastSpecies = species;
        body += '<tr class="lab-group"><td colspan="' + (panel.length + 1) + '">' + esc(species) + '</td></tr>';
      }
      body += '<tr><th class="lab-iso"><strong>' + esc(iso.id) + '</strong><span>' + esc(E.speciesInfo(iso.species).short) + '</span></th>' +
        panel.map(function (drug) { return labCell(iso, drug); }).join('') + '</tr>';
    });

    const summary = '<div class="card card-pad lab-summary">' +
      '<div class="lab-summary-top"><div><div class="card-title">Data entry progress</div>' +
      '<div class="card-sub">S/I/R drives the comparison. Enter MIC in mg/L, or add “mm” for a zone diameter (for example 18 mm).</div></div>' +
      '<div class="lab-progress-num"><strong id="lab-stat-entered">' + stats.entered + '</strong><span> / ' + stats.total + ' results</span></div></div>' +
      '<div class="lab-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '" aria-label="Lab results entered"><span id="lab-progress-bar" style="width:' + progress + '%"></span></div>' +
      '<div class="lab-stat-grid">' +
      labStat('Isolates with a result', stats.isolatesWith + ' / ' + a.isolates.length, 'lab-stat-isolates') +
      labStat('Study drugs covered', stats.drugsCovered + ' / ' + panel.length, 'lab-stat-drugs') +
      labStat('Assessed comparisons', a.assessedTotal, 'lab-stat-assessed') +
      labStat('Strict concordance', pct(a.strictRate), 'lab-stat-concordance') +
      '</div></div>';

    const toolbar = '<div class="lab-toolbar"><div class="lab-pills">' + pills + '</div>' +
      '<div class="lab-legend"><span><i class="lab-dot s"></i>S susceptible</span><span><i class="lab-dot i"></i>I intermediate</span><span><i class="lab-dot r"></i>R resistant</span></div></div>';

    const table = '<div class="card lab-card"><div class="lab-card-head"><div><div class="card-title">' +
      (active === 'all' ? 'All study isolates' : esc(active)) + '</div>' +
      '<div class="card-sub">' + rows.length + ' isolate' + (rows.length === 1 ? '' : 's') + ' × ' + panel.length + ' drugs. Changes save automatically.</div></div>' +
      '<button class="btn small ghost" data-action="download-lab-template">' + icon('download') + 'Blank CSV</button></div>' +
      '<div class="lab-scroll"><table class="lab-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div></div>';

    const actions = '<button class="btn ghost" data-action="load-study">' + icon('refresh') + 'Reset study template</button>' +
      '<button class="btn" data-action="download-lab-template">' + icon('download') + 'Blank lab CSV</button>' +
      '<button class="btn" data-action="export-lab-results">' + icon('download') + 'Export results</button>' +
      '<button class="btn primary" data-action="download-report">' + icon('file') + 'Generate report</button>';

    return '<div id="lab-view">' +
      pageHead('Study workflow', 'Lab results', 'Record the disc diffusion or MIC result for each isolate and study drug. The comparison with the imported AMRFinderPlus determinants updates immediately.', actions) +
      summary + toolbar + table + '</div>';
  }
  function setLabResult(isolateId, drug, field, value) {
    if (!App.dataset) return null;
    const iso = App.dataset.isolates.find(function (x) { return x.id === isolateId; });
    if (!iso) return null;
    iso.phenotypes = iso.phenotypes || [];
    let p = iso.phenotypes.find(function (x) { return x.drug === drug; });
    if (!p) {
      if (!String(value || '').trim()) return null;
      p = {
        drug: drug, drugName: E.drugInfo(drug).name, mic: null, zone: null,
        sir: null, sirSource: null, method: 'Lab entry', note: '', confidence: 0.5
      };
      iso.phenotypes.push(p);
    }
    if (field === 'sir') {
      p.sir = E.normalizeSIR(value);
      p.sirSource = p.sir ? 'reported' : null;
      if (p.sir) p.confidence = 0.9;
    } else if (field === 'value') {
      const raw = String(value || '').trim();
      if (!raw) { p.mic = null; p.zone = null; }
      else if (/mm/i.test(raw)) {
        const m = raw.match(/(\d+(?:\.\d+)?)/);
        p.zone = (m ? m[1] : raw.replace(/mm/ig, '').trim()) + ' mm';
        p.mic = null;
      } else {
        p.mic = raw;
        p.zone = null;
      }
    }
    if (!p.sir && p.mic) {
      const r = E.interpretMIC(drug, p.mic, iso.species);
      if (r.sir) {
        p.sir = r.sir;
        p.sirSource = 'interpreted';
        p.confidence = r.confidence;
        p.note = r.note;
      }
    }
    if (!p.sir && !p.mic && !p.zone) {
      iso.phenotypes = iso.phenotypes.filter(function (x) { return x !== p; });
      p = null;
    }
    App.analysis = R.analyzeDataset(App.dataset);
    saveState();
    updateChrome();
    updateLabSummary();
    return p;
  }
  function updateLabSummary() {
    if (!App.analysis) return;
    const stats = labStats();
    const progress = stats.total ? Math.round(stats.entered / stats.total * 100) : 0;
    const bar = $('#lab-progress-bar');
    if (bar) bar.style.width = progress + '%';
    const barWrap = bar ? bar.parentElement : null;
    if (barWrap) barWrap.setAttribute('aria-valuenow', String(progress));
    const setText = function (id, value) {
      const el = $('#' + id);
      if (el) el.textContent = value;
    };
    setText('lab-stat-entered', stats.entered);
    setText('lab-stat-isolates', stats.isolatesWith + ' / ' + App.analysis.isolates.length);
    setText('lab-stat-drugs', stats.drugsCovered + ' / ' + stats.panel.length);
    setText('lab-stat-assessed', App.analysis.assessedTotal);
    setText('lab-stat-concordance', pct(App.analysis.strictRate));
  }
  function updateLabCellTone(cell, p) {
    if (!cell) return;
    cell.classList.remove('lab-sir-s', 'lab-sir-i', 'lab-sir-r', 'lab-sir-none');
    cell.classList.add('lab-sir-' + (p && p.sir ? p.sir.toLowerCase() : 'none'));
    cell.title = p ? (p.sirSource === 'interpreted' ? 'SIR interpreted from the entered value' : p.sirSource === 'reported' ? 'SIR reported by the lab' : '') : '';
  }
  function bindLab() {
    const view = $('#lab-view');
    if (!view) return;
    view.addEventListener('click', function (e) {
      const pill = e.target.closest('[data-lab-species]');
      if (pill) {
        App.lab.species = pill.getAttribute('data-lab-species');
        render();
      }
    });
    view.addEventListener('change', function (e) {
      const el = e.target.closest('[data-lab-field]');
      if (!el) return;
      const field = el.getAttribute('data-lab-field');
      const p = setLabResult(el.getAttribute('data-lab-isolate'), el.getAttribute('data-lab-drug'), field, el.value);
      const cell = el.closest('.lab-cell');
      if (field === 'sir' && p) el.value = p.sir || '';
      if (field === 'value' && cell) {
        const sel = cell.querySelector('[data-lab-field="sir"]');
        if (sel) sel.value = p && p.sir ? p.sir : '';
      }
      updateLabCellTone(cell, p);
    });
  }

  /* ------------------------------------------------------------------ */
  /* isolate drawer                                                      */
  /* ------------------------------------------------------------------ */
  function openIsolate(id) {
    const a = App.analysis && App.analysis.byId[id];
    if (!a) return;
    closeDrawer();
    const overlay = document.createElement('div');
    overlay.className = 'drawer-backdrop';
    overlay.setAttribute('data-action', 'close-drawer');
    document.body.appendChild(overlay);
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.id = 'isolate-drawer';
    drawer.innerHTML = drawerHtml(a);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';
    bindDrawer(a);
  }
  function closeDrawer() {
    const d = $('#isolate-drawer');
    if (d) d.remove();
    const o = $('.drawer-backdrop');
    if (o) o.remove();
    document.body.style.overflow = '';
  }
  function drawerHtml(a) {
    const iso = a.isolate;
    const tabs = [
      ['findings', 'Findings', a.findings.filter(function (f) { return f.observed || f.supports.length; }).length],
      ['genes', 'Genes', iso.genes.length],
      ['phenotypes', 'Phenotypes', iso.phenotypes.length],
      ['reasoning', 'Reasoning', a.assessedCount],
      ['notes', 'Notes & images', (iso.images || []).length]
    ];
    return '<div class="drawer-head"><div><div class="tiny muted mono">' + esc(iso.id) + ' · ' + esc(E.speciesInfo(iso.species).short) + '</div>' +
      '<div class="detail-title" style="margin-top:4px">' + esc(iso.id) + ' ' + mdrBadge(a.mdrClass) + '</div>' +
      '<div class="detail-sub">' + esc(E.speciesInfo(iso.species).label) + ' · ' + esc(iso.source || 'source not recorded') + (iso.collectionDate ? ' · ' + esc(iso.collectionDate) : '') + (iso.location ? ' · ' + esc(iso.location) : '') + '</div></div>' +
      '<button class="icon-btn" data-action="close-drawer" aria-label="Close isolate details">' + icon('close') + '</button></div>' +
      '<div class="detail-stats" style="padding:0 20px">' +
      '<div class="detail-stat"><div class="n">' + a.geneCount + '</div><div class="l">determinants</div></div>' +
      '<div class="detail-stat"><div class="n">' + a.phenotypeCount + '</div><div class="l">tested drugs</div></div>' +
      '<div class="detail-stat"><div class="n">' + pct(a.strictRate) + '</div><div class="l">strict concordance</div></div>' +
      '<div class="detail-stat"><div class="n" style="color:var(--red)">' + a.majorMismatch + '</div><div class="l">major mismatches</div></div>' +
      '<div class="detail-stat"><div class="n">' + pct(a.resistanceRate) + '</div><div class="l">resistance rate</div></div></div>' +
      '<div class="detail-tabs">' + tabs.map(function (t, i) {
        return '<button class="' + (i === 0 ? 'active' : '') + '" data-drawer-tab="' + t[0] + '">' + esc(t[1]) + ' <span class="muted">' + t[2] + '</span></button>';
      }).join('') + '</div><div class="detail-body" id="drawer-body">' + drawerTab('findings', a) + '</div>';
  }
  function drawerTab(tab, a) {
    if (tab === 'genes') return geneTable(a);
    if (tab === 'phenotypes') return phenotypeTable(a);
    if (tab === 'reasoning') {
      const findings = a.findings.filter(function (f) { return f.supports.length && f.observed; });
      const anchor = a.topMismatches[0] || a.topExplained[0];
      return '<div class="grid grid-2"><div class="card card-pad"><div class="card-title">Mechanism map</div><div class="chart-wrap">' +
        (findings.length ? C.flow(findings.slice(0, 6).map(function (f) {
          const s = f.supports[0];
          return {
            gene: s.display, geneSub: s.family || s.mechanism, mechanism: s.mechanism, mechanismSub: s.action,
            target: f.drugName, effectLabel: 'Predicted ' + f.predictedLabel + ' · observed ' + f.observed,
            status: f.status, statusLabel: f.statusLabel, confidence: f.confidence
          };
        }), { theme: 'dark', width: 760, rowH: 82 }) : '<div class="table-empty">No supported findings.</div>') +
        '</div></div><div class="card card-pad"><div class="card-title">Top inference</div>' +
        (anchor ? '<div class="chart-wrap">' + C.evidenceChain(anchor, { theme: 'dark' }) + '</div>' : '<div class="table-empty">No comparison available.</div>') +
        '</div></div>' + (a.geneFindings.length ? '<div class="section"><div class="section-head"><div class="section-title">Gene-level findings</div></div>' + dataTable([
          { label: 'Determinant' }, { label: 'Mechanism' }, { label: 'Affected' }, { label: 'Explained' }, { label: 'Silent' }, { label: 'Untested' }, { label: 'Support', align: 'right' }
        ], a.geneFindings.map(function (g) {
          return ['<strong class="mono">' + esc(g.display) + '</strong>', esc(g.mechanism), g.affected, g.explained, g.silent, g.untested,
            g.supportRate == null ? '—' : pct(g.supportRate)];
        })) + '</div>' : '');
    }
    if (tab === 'notes') {
      const imgs = (a.isolate.images || []).map(function (img) {
        return '<div class="image-card"><img src="' + img.dataUrl + '" alt="' + esc(img.name || 'evidence') + '"><div class="img-meta"><div class="img-name">' + esc(img.name || 'Evidence image') + '</div>' + esc(img.caption || '') + '</div></div>';
      }).join('');
      return '<div class="card card-pad"><div class="card-title">Laboratory / clinical note</div><div class="rp-text" style="color:var(--muted);margin-top:8px;white-space:pre-wrap">' + esc(a.isolate.notes || 'No narrative note was imported for this isolate.') + '</div></div>' +
        (imgs ? '<div class="section"><div class="section-head"><div class="section-title">Evidence images</div></div><div class="image-grid">' + imgs + '</div></div>' : '<div class="section">' + emptyState('image', 'No evidence images', 'Import images in the Import data view and associate them with this isolate.') + '</div>');
    }
    const findings = a.findings.filter(function (f) { return f.observed || f.supports.length; })
      .sort(function (x, y) {
        const rank = { unexplained: 0, silent: 1, partial: 2, 'concordant-r': 3, 'concordant-s': 4, untested: 5, 'no-call': 6 };
        return (rank[x.status] == null ? 9 : rank[x.status]) - (rank[y.status] == null ? 9 : rank[y.status]) || y.confidence - x.confidence;
      });
    if (!findings.length) return emptyState('flask', 'No drug-level findings', 'Import AST phenotypes for this isolate to compare them with the detected determinants.');
    return findings.map(function (f, i) { return detailsFinding(f, i < 3 && (f.status === 'silent' || f.status === 'unexplained')); }).join('');
  }
  function bindDrawer(a) {
    const drawer = $('#isolate-drawer');
    if (!drawer) return;
    drawer.addEventListener('click', function (e) {
      const tab = e.target.closest('[data-drawer-tab]');
      if (tab) {
        $$('[data-drawer-tab]', drawer).forEach(function (b) { b.classList.toggle('active', b === tab); });
        const body = $('#drawer-body');
        if (body) body.innerHTML = drawerTab(tab.getAttribute('data-drawer-tab'), a);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* matrix                                                              */
  /* ------------------------------------------------------------------ */
  function renderMatrix() {
    const a = App.analysis;
    const rows = a.isolates.filter(function (ia) {
      const q = App.matrix.query.trim().toLowerCase();
      return !q || (ia.isolate.id + ' ' + ia.isolate.species).toLowerCase().indexOf(q) >= 0;
    });
    const mode = App.matrix.mode;
    let cols = [];
    if (mode === 'gene') {
      const map = {};
      a.genePrevalence.forEach(function (g) { map[g.id] = g; });
      cols = a.genePrevalence.slice(0, 40).map(function (g) { return { id: g.id, label: g.display, prevalence: g }; });
    } else {
      const map = {};
      a.isolates.forEach(function (ia) {
        ia.assessed.forEach(function (f) {
          if (!map[f.drug]) map[f.drug] = { id: f.drug, label: E.drugInfo(f.drug).short || f.drugName, name: f.drugName, class: f.drugClass };
        });
      });
      cols = Object.keys(map).map(function (k) { return map[k]; });
      if (App.matrix.class !== 'all') cols = cols.filter(function (c) { return c.class === App.matrix.class; });
      cols.sort(function (x, y) { return (E.classInfo(x.class).label + x.name).localeCompare(E.classInfo(y.class).label + y.name); });
    }
    const classes = a.classResistance.map(function (c) { return c.id; });
    const classOptions = '<option value="all">All drug classes</option>' + classes.map(function (id) {
      return '<option value="' + esc(id) + '"' + (App.matrix.class === id ? ' selected' : '') + '>' + esc(E.classInfo(id).label) + '</option>';
    }).join('');

    let svg = '';
    if (!cols.length || !rows.length) {
      svg = '<div class="table-empty">No matrix cells for the current filter.</div>';
    } else if (mode === 'gene') {
      const get = function (row, c) {
        return row.ia.isolate.genes.find(function (g) { return (KB.resolveGene(g.symbol, g) || {}).id === c.id; }) || null;
      };
      svg = C.heatmap(rows.map(function (ia) { return { label: ia.isolate.id, ia: ia }; }), cols, {
        theme: 'dark', cell: 24, labelW: 118, top: 96, colChars: 13, legend: true,
        get: get,
        color: function (val) { return val ? (val.coverage != null && val.coverage < 80 ? '#a78bfa' : '#7dd3fc') : 'rgba(255,255,255,.03)'; },
        text: function (val) { return val && val.coverage != null && val.coverage < 80 ? '!' : ''; },
        textFill: function () { return '#06121c'; },
        legendItems: [
          { label: 'detected', color: '#7dd3fc' },
          { label: 'partial / low coverage', color: '#a78bfa' }
        ]
      });
    } else {
      const get = function (row, c) { return row.ia.findings.find(function (f) { return f.drug === c.id; }) || null; };
      const color = function (val) {
        if (!val) return 'rgba(255,255,255,.03)';
        if (mode === 'sir') return val.observed ? C.STATUS[val.observed] : 'rgba(125,211,252,.08)';
        return val.observed ? (C.STATUS[val.status] || '#647f96') : 'rgba(125,211,252,.08)';
      };
      const text = function (val) {
        if (!val) return '';
        if (mode === 'sir') return val.observed || '';
        return val.observed ? (KB.CONCORDANCE[val.status] ? KB.CONCORDANCE[val.status].short : '') : '';
      };
      svg = C.heatmap(rows.map(function (ia) { return { label: ia.isolate.id, ia: ia }; }), cols, {
        theme: 'dark', cell: 25, labelW: 118, top: 96, colChars: 13, legend: true,
        get: get, color: color, text: text, textSize: 8,
        textFill: function () { return '#06121c'; },
        legendItems: mode === 'sir' ? [
          { label: 'R', color: C.STATUS.R }, { label: 'I', color: C.STATUS.I }, { label: 'S', color: C.STATUS.S }, { label: 'not tested', color: 'rgba(125,211,252,.12)' }
        ] : [
          { label: 'Concordant R', color: C.STATUS['concordant-r'] }, { label: 'Concordant S', color: C.STATUS['concordant-s'] },
          { label: 'Partial', color: C.STATUS.partial }, { label: 'Silent', color: C.STATUS.silent }, { label: 'Unexplained', color: C.STATUS.unexplained }
        ]
      });
    }

    return pageHead('Cross-isolate view', 'Concordance matrix', 'Each cell is one drug–isolate comparison. Hover a cell to see the drug, isolate, and status. Switch to gene presence to see the molecular landscape.', '<button class="btn" data-view="reasoning">' + icon('brain') + 'Reasoning lab</button>') +
      '<div class="matrix-toolbar"><div class="segmented"><button class="' + (mode === 'status' ? 'active' : '') + '" data-matrix-mode="status">Concordance</button>' +
      '<button class="' + (mode === 'sir' ? 'active' : '') + '" data-matrix-mode="sir">Observed SIR</button>' +
      '<button class="' + (mode === 'gene' ? 'active' : '') + '" data-matrix-mode="gene">Gene presence</button></div>' +
      (mode !== 'gene' ? '<select class="select" id="matrix-class" aria-label="Filter matrix by drug class" style="width:200px">' + classOptions + '</select>' : '') +
      '<div class="searchbox" style="max-width:260px">' + icon('search') + '<input class="input" id="matrix-search" aria-label="Filter matrix isolates" placeholder="Filter isolates…" value="' + esc(App.matrix.query) + '"></div>' +
      '<div class="tiny muted">' + rows.length + ' isolates × ' + cols.length + (mode === 'gene' ? ' determinants' : ' drugs') + '</div></div>' +
      '<div class="card" style="padding:14px"><div class="heatmap-scroll">' + svg + '</div>' +
      '<div class="tiny muted" style="margin-top:10px">' + (mode === 'gene' ? 'Blue = determinant detected. Purple = partial or low-coverage call; verify allele integrity.' : 'Colour shows the comparison status. Faint cells are predictions without an AST result; they are not counted as concordant.') + '</div></div>';
  }
  function bindMatrix() {
    $$('[data-matrix-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        App.matrix.mode = b.getAttribute('data-matrix-mode');
        render();
      });
    });
    const cls = $('#matrix-class');
    if (cls) cls.addEventListener('change', function () { App.matrix.class = this.value; render(); });
    const search = $('#matrix-search');
    if (search) search.addEventListener('input', function () {
      App.matrix.query = this.value;
      render();
      const el = $('#matrix-search');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* reasoning lab                                                       */
  /* ------------------------------------------------------------------ */
  function renderReasoning() {
    const a = App.analysis;
    const selected = App.analysis.byId[App.selectedIsolateId] || a.isolates[0];
    if (!selected) return emptyState('brain', 'No isolate selected', 'Import data to run the reasoning lab.');
    const findings = selected.findings.filter(function (f) { return f.supports.length && f.observed; })
      .sort(function (x, y) { return y.confidence - x.confidence; });
    const options = a.isolates.map(function (ia) {
      return '<option value="' + esc(ia.isolate.id) + '"' + (ia.isolate.id === selected.isolate.id ? ' selected' : '') + '>' + esc(ia.isolate.id) + ' · ' + esc(E.speciesInfo(ia.isolate.species).short) + '</option>';
    }).join('');
    const flow = findings.length ? C.flow(findings.slice(0, 7).map(function (f) {
      const s = f.supports[0];
      return {
        gene: s.display, geneSub: s.family || s.mechanism, mechanism: s.mechanism, mechanismSub: s.action,
        target: f.drugName, effectLabel: 'Predicted ' + f.predictedLabel + ' · observed ' + f.observed + (f.observedMic ? ' (MIC ' + f.observedMic + ')' : ''),
        status: f.status, statusLabel: f.statusLabel, confidence: f.confidence
      };
    }), { theme: 'dark', width: 760, rowH: 82 }) : '<div class="table-empty">No supported drug-level findings for this isolate.</div>';
    const findingsHtml = selected.findings.filter(function (f) { return f.observed || f.supports.length; })
      .sort(function (x, y) {
        const rank = { unexplained: 0, silent: 1, partial: 2, 'concordant-r': 3, 'concordant-s': 4, untested: 5, 'no-call': 6 };
        return (rank[x.status] == null ? 9 : rank[x.status]) - (rank[y.status] == null ? 9 : rank[y.status]) || y.confidence - x.confidence;
      }).map(function (f, i) { return detailsFinding(f, i < 2); }).join('');
    return pageHead('First principles', 'Reasoning lab', 'Trace a single isolate from molecular evidence to drug effect to the observed phenotype. Every conclusion is falsifiable and every mismatch carries a next test.',
      '<select class="select" id="reasoning-isolate" aria-label="Select isolate for reasoning lab" style="width:260px">' + options + '</select><button class="btn primary" data-view="chat">' + icon('chat') + 'Ask about this isolate</button>') +
      '<div class="grid grid-2"><div class="card card-pad"><div class="card-title">' + esc(selected.isolate.id) + ' · ' + esc(E.speciesInfo(selected.isolate.species).label) + '</div>' +
      '<div class="detail-sub">' + esc(selected.isolate.source || 'source not recorded') + (selected.isolate.collectionDate ? ' · ' + esc(selected.isolate.collectionDate) : '') + ' · ' + mdrBadge(selected.mdrClass) + '</div>' +
      '<div class="detail-stats">' +
      '<div class="detail-stat"><div class="n">' + selected.geneCount + '</div><div class="l">determinants</div></div>' +
      '<div class="detail-stat"><div class="n">' + selected.assessedCount + '</div><div class="l">comparisons</div></div>' +
      '<div class="detail-stat"><div class="n">' + pct(selected.strictRate) + '</div><div class="l">strict</div></div>' +
      '<div class="detail-stat"><div class="n" style="color:var(--red)">' + selected.majorMismatch + '</div><div class="l">mismatches</div></div></div>' +
      '<div class="trace-box"><div class="trace-label">Leading signal</div><p>' + (selected.topMismatches[0] ?
        esc(selected.topMismatches[0].drugName) + ' is ' + esc(selected.topMismatches[0].statusLabel.toLowerCase()) + '. ' +
        esc(selected.topMismatches[0].hypotheses[0] ? selected.topMismatches[0].hypotheses[0].why : 'The current evidence set does not explain the phenotype.') :
        'No major mismatch. The model supports the observed phenotype, while retaining uncertainty about unmeasured mechanisms.') + '</p></div>' +
      '<div class="tiny muted">' + esc(selected.isolate.notes || '') + '</div></div>' +
      '<div class="card card-pad"><div class="card-title">Mechanism map</div><div class="chart-wrap">' + flow + '</div></div></div>' +
      '<div class="section"><div class="section-head"><div><div class="section-title">Drug-level inferences</div><div class="section-sub">Open any row for the full chain and alternative hypotheses.</div></div></div>' + findingsHtml + '</div>' +
      '<div class="section"><div class="section-head"><div><div class="section-title">Gene-level findings</div></div></div>' + geneFindingsTable(selected) + '</div>';
  }
  function geneFindingsTable(a) {
    return dataTable([
      { label: 'Determinant' }, { label: 'Mechanism' }, { label: 'Affected' }, { label: 'Explained' }, { label: 'Silent' }, { label: 'Untested' }, { label: 'Support', align: 'right' }
    ], a.geneFindings.map(function (g) {
      return ['<strong class="mono">' + esc(g.display) + '</strong>', esc(g.mechanism), g.affected, g.explained, g.silent, g.untested,
        g.supportRate == null ? '—' : pct(g.supportRate)];
    }), { empty: 'No gene-level findings.' });
  }
  function bindReasoning() {
    const sel = $('#reasoning-isolate');
    if (sel) sel.addEventListener('change', function () {
      App.selectedIsolateId = this.value;
      saveState();
      render();
    });
  }

  /* ------------------------------------------------------------------ */
  /* chat                                                                */
  /* ------------------------------------------------------------------ */
  function chatCtx() { return { dataset: App.dataset, analysis: App.analysis, isolateId: App.selectedIsolateId }; }
  function ensureChat() {
    if (!App.chat.messages.length) {
      const g = Chat.greeting(chatCtx());
      App.chat.messages.push({ role: 'assistant', textHtml: g.textHtml, visualHtml: g.visualHtml, suggestions: g.suggestions });
    }
  }
  function renderChat() {
    ensureChat();
    const a = App.analysis;
    const options = a.isolates.map(function (ia) {
      return '<option value="' + esc(ia.isolate.id) + '"' + (ia.isolate.id === App.selectedIsolateId ? ' selected' : '') + '>' + esc(ia.isolate.id) + ' · ' + esc(E.speciesInfo(ia.isolate.species).short) + '</option>';
    }).join('');
    const suggestions = Chat.suggestions(chatCtx());
    return '<div class="chat-layout"><div class="card chat-panel">' +
      '<div class="chat-head"><div class="chat-title"><div class="chat-orb">' + icon('sparkles') + '</div><div><div>Ask AMR Prism</div><div class="tiny muted">Local deterministic reasoner · no data leaves this browser</div></div></div>' +
      '<div class="chat-controls"><div class="segmented"><button class="' + (App.chat.mode === 'conversation' ? 'active' : '') + '" data-chat-mode="conversation">Conversation</button><button class="' + (App.chat.mode === 'visual' ? 'active' : '') + '" data-chat-mode="visual">Visual</button></div></div></div>' +
      '<div class="chat-messages" id="chat-messages">' + App.chat.messages.map(renderMessage).join('') + '</div>' +
      '<div class="chat-compose"><div class="compose-box"><textarea id="chat-input" aria-label="Ask AMR Prism" rows="1" placeholder="Ask about an isolate, gene, drug, or the whole cohort…"></textarea>' +
      '<button class="compose-send" id="chat-send" data-action="chat-send" aria-label="Send">' + icon('arrow') + '</button></div>' +
      '<div class="compose-hint"><span>Enter to send · Shift+Enter for a new line</span><span>Mode: <strong>' + (App.chat.mode === 'visual' ? 'annotated visual' : 'conversation') + '</strong></span></div></div></div>' +
      '<div class="chat-side"><div class="card context-card"><div class="card-title">Context</div><div class="tiny muted" style="margin-top:4px">' + esc(App.dataset.name) + '</div>' +
      '<div class="field" style="margin-top:10px"><label class="field-label" for="chat-isolate">Focused isolate</label><select class="select" id="chat-isolate">' + options + '</select></div>' +
      '<div class="tiny muted" style="margin-top:10px">The focused isolate is used when your question names a drug or gene but not an isolate.</div></div>' +
      '<div class="card context-card"><div class="card-title">Suggested prompts</div><div class="suggested" style="margin-top:8px">' +
      suggestions.map(function (s) { return '<button data-prompt="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card context-card"><div class="card-title">How it answers</div><div class="tiny muted" style="margin-top:6px">Every answer is assembled from the imported evidence and the explicit mechanism knowledge base. The confidence score is derived, not guessed. Switch to Visual for annotated charts and evidence chains.</div></div></div></div>';
  }
  function renderMessage(m) {
    if (m.role === 'user') {
      return '<div class="msg user"><div class="msg-avatar">YOU</div><div class="msg-body"><div class="msg-name">You</div><div class="bubble">' + m.textHtml + '</div></div></div>';
    }
    const visual = App.chat.mode === 'visual' && m.visualHtml;
    const body = visual ? m.visualHtml : m.textHtml;
    const suggestions = m.suggestions && m.suggestions.length ? '<div class="chat-actions">' + m.suggestions.map(function (s) {
      return '<button class="chat-action" data-prompt="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('') + '</div>' : '';
    return '<div class="msg assistant"><div class="msg-avatar">AI</div><div class="msg-body"><div class="msg-name">AMR Prism · ' + (visual ? 'visual' : 'conversation') + '</div><div class="bubble">' + body + '</div>' + suggestions + '</div></div>';
  }
  function renderChatMessages() {
    const box = $('#chat-messages');
    if (!box) return;
    box.innerHTML = App.chat.messages.map(renderMessage).join('');
    box.scrollTop = box.scrollHeight;
  }
  function bindChat() {
    const input = $('#chat-input');
    const send = $('#chat-send');
    function submit() {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendChat(text);
    }
    if (send) send.addEventListener('click', submit);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      });
      input.addEventListener('input', function () {
        input.style.height = 'auto';
        input.style.height = Math.min(130, input.scrollHeight) + 'px';
      });
    }
    $$('[data-chat-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        App.chat.mode = b.getAttribute('data-chat-mode');
        $$('[data-chat-mode]').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderChatMessages();
      });
    });
    const sel = $('#chat-isolate');
    if (sel) sel.addEventListener('change', function () { App.selectedIsolateId = this.value; saveState(); });
    const box = $('#chat-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }
  function sendChat(text) {
    if (!App.analysis || !App.dataset) { toast('Load or import a dataset first.', 'info'); return; }
    App.chat.messages.push({ role: 'user', textHtml: '<p>' + esc(text) + '</p>' });
    const res = Chat.respond(text, chatCtx());
    App.chat.messages.push({
      role: 'assistant', textHtml: res.textHtml,
      visualHtml: res.visualHtml || res.textHtml,
      suggestions: res.suggestions || []
    });
    renderChatMessages();
    const box = $('#chat-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  /* ------------------------------------------------------------------ */
  /* import                                                              */
  /* ------------------------------------------------------------------ */
  function ensurePending() {
    if (!App.pending) App.pending = { isolates: [], images: [], warnings: [], sources: [], name: '', mode: 'merge' };
    return App.pending;
  }
  function renderImport() {
    const pending = App.pending;
    const a = App.analysis;
    const targetOptions = '<option value="">Dataset-level image</option>' + (a ? a.isolates.map(function (ia) {
      return '<option value="' + esc(ia.isolate.id) + '">' + esc(ia.isolate.id) + ' · ' + esc(E.speciesInfo(ia.isolate.species).short) + '</option>';
    }).join('') : '');
    const preview = pending ? pendingPreview(pending) : '<div class="table-empty">Choose a file or paste text to see a parse preview. Nothing is applied until you confirm.</div>';
    const studyCard = '<div class="card card-pad study-workflow"><div class="study-workflow-main">' +
      '<div class="page-eyebrow">Final-year study</div>' +
      '<div class="study-workflow-title">5 species × 10 public genomes · 8 study drugs</div>' +
      '<div class="card-sub">E. coli, P. mirabilis, K. pneumoniae, Enterococcus spp. and P. aeruginosa, screened with AMRFinderPlus and compared with the lab AST panel: ampicillin, amoxicillin, cefuroxime, ceftriaxone, cefepime, ciprofloxacin, gentamicin and imipenem.</div>' +
      '<div class="study-actions"><button class="btn primary" data-action="load-study">' + icon('flask') + 'Load 50-isolate template</button>' +
      '<button class="btn" data-view="lab">' + icon('flask') + 'Enter lab results</button>' +
      '<button class="btn ghost" data-action="download-lab-template">' + icon('download') + 'Blank lab CSV</button></div></div>' +
      '<ol class="study-steps"><li><strong>Load</strong> the 50-isolate scaffold (or keep your current cohort).</li>' +
      '<li><strong>Import</strong> the AMRFinderPlus resistance gene table for the public genomes.</li>' +
      '<li><strong>Enter</strong> the lab S/I/R result for each isolate and study drug in Lab results.</li>' +
      '<li><strong>Review</strong> concordance, then generate the PDF report.</li></ol></div>';
    return pageHead('Ingestion', 'Import data', 'Drop AMRFinderPlus tables, AST tables, narratives, JSON datasets, or evidence images. Everything is parsed locally and can be merged with the current cohort.',
      '<button class="btn" data-action="load-study">' + icon('flask') + 'Load study</button>' +
      '<button class="btn" data-action="load-demo">' + icon('database') + 'Load demo</button>' +
      '<button class="btn" data-action="export-json">' + icon('download') + 'Export JSON</button>' +
      '<button class="btn danger" data-action="clear-data">' + icon('trash') + 'Clear data</button>') +
      studyCard +
      '<div class="import-grid"><div class="card card-pad"><div class="card-title">Add evidence</div>' +
      '<div class="dropzone" id="data-dropzone" role="button" tabindex="0"><div class="dz-icon">' + icon('upload') + '</div><div class="dz-title">Drop AMRFinderPlus, AST, narrative, or JSON files</div>' +
      '<div class="dz-sub">or click to choose files</div><div class="dz-formats">.tsv · .csv · .txt · .json · multiple files supported</div></div>' +
      '<input type="file" id="data-input" multiple accept=".tsv,.csv,.txt,.json,text/plain,text/csv,application/json" hidden>' +
      '<div class="mapping-grid"><div class="field"><label class="field-label" for="import-name">Dataset name</label><input class="input" id="import-name" placeholder="e.g. ICU cohort · March 2026" value="' + esc((pending && pending.name) || (App.dataset && App.dataset.name) || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="file-format">File format</label><select class="select" id="file-format"><option value="auto">Auto-detect</option><option value="amr">AMRFinderPlus table</option><option value="ast">AST table</option><option value="narrative">Narrative text</option></select></div>' +
      '<div class="field"><label class="field-label" for="import-mode">Merge behaviour</label><select class="select" id="import-mode"><option value="merge"' + (pending && pending.mode === 'replace' ? '' : ' selected') + '>Merge with current</option><option value="replace"' + (pending && pending.mode === 'replace' ? ' selected' : '') + '>Replace current</option></select></div></div>' +
      '<div class="divider"></div><div class="field"><label class="field-label" for="paste-text">Or paste a narrative / delimited table</label><textarea class="textarea" id="paste-text" placeholder="EC-9999&#10;Escherichia coli urine isolate&#10;blaCTX-M-15 detected&#10;meropenem MIC 8 R"></textarea></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" data-action="parse-paste">' + icon('flask') + 'Parse pasted text</button>' +
      '<button class="btn ghost" data-action="clear-pending">' + icon('refresh') + 'Reset preview</button></div>' +
      '<div class="divider"></div><div class="field"><label class="field-label">Evidence images</label><div class="tiny muted">Associate an image with an isolate or keep it dataset-level. Images are embedded in the PDF appendix.</div></div>' +
      '<div class="dropzone" id="image-dropzone" style="padding:18px"><div class="dz-icon" style="width:28px;height:28px">' + icon('image') + '</div><div class="dz-title">Drop images</div><div class="dz-sub">or click to choose</div></div>' +
      '<input type="file" id="image-input" multiple accept="image/*" hidden>' +
      '<div class="field" style="margin-top:9px"><label class="field-label" for="image-target">Associate with</label><select class="select" id="image-target">' + targetOptions + '</select></div>' +
      '</div><div class="card card-pad"><div class="card-title">Parse preview</div>' + preview + '</div></div>';
  }
  function pendingPreview(pending) {
    const isolateRows = pending.isolates.slice(0, 10).map(function (iso) {
      return ['<strong class="mono">' + esc(iso.id) + '</strong>', esc(E.speciesInfo(iso.species).short), iso.genes.length, iso.phenotypes.length];
    });
    const imgs = pending.images.map(function (img, i) {
      return '<div class="image-card"><img src="' + img.dataUrl + '" alt="' + esc(img.name || 'image') + '"><div class="img-meta"><div class="img-name">' + esc(img.name || 'Image') + '</div>' + esc(img.isolateId || 'dataset') +
        ' <button class="btn small ghost" data-action="remove-pending-image" data-index="' + i + '" style="height:20px;padding:0 5px;margin-left:4px">remove</button></div></div>';
    }).join('');
    return '<div class="parse-result"><span class="badge accent">' + pending.isolates.length + ' isolates</span><span class="badge blue">' + pending.images.length + ' images</span>' +
      '<span class="badge outline">' + (pending.mode === 'replace' ? 'replace' : 'merge') + '</span></div>' +
      (pending.sources.length ? '<div class="tiny muted" style="margin-top:8px">Sources: ' + pending.sources.map(esc).join(', ') + '</div>' : '') +
      (pending.warnings.length ? '<div class="tiny" style="margin-top:8px;color:var(--amber)">' + pending.warnings.map(esc).join(' ') + '</div>' : '') +
      '<div style="margin-top:12px">' + dataTable(['Isolate', 'Species', 'Genes', 'Phenotypes'], isolateRows, { empty: 'No isolates parsed yet.' }) + '</div>' +
      (imgs ? '<div class="image-grid" style="margin-top:12px">' + imgs + '</div>' : '') +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn primary" data-action="apply-import">' + icon('check') + 'Apply to workspace</button>' +
      '<button class="btn ghost" data-action="clear-pending">Reset</button></div>';
  }
  function readText(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Could not read ' + file.name)); };
      reader.readAsText(file);
    });
  }
  function parseOne(text, filename, format) {
    if (/\.json$/i.test(filename || '')) {
      const obj = JSON.parse(text);
      const isolates = Array.isArray(obj) ? obj : obj.isolates;
      if (!Array.isArray(isolates)) throw new Error('JSON must be a dataset with an isolates array, or an array of isolates.');
      return { isolates: isolates, images: (obj && obj.images) || [], warnings: [], kind: 'json' };
    }
    const fmt = format && format !== 'auto' ? format : E.autoDetect(text, filename);
    if (fmt === 'amr') {
      const r = E.parseAmrTable(text, filename);
      return { isolates: r.isolates, images: [], warnings: r.warnings || [], kind: 'amr' };
    }
    if (fmt === 'ast') {
      const r = E.parseAstTable(text, filename);
      return { isolates: r.isolates, images: [], warnings: r.warnings || [], kind: 'ast' };
    }
    const r = E.parseNarrative(text, filename);
    return { isolates: r.isolates, images: [], warnings: r.warnings || [], kind: 'narrative' };
  }
  function mergePending(parsedList) {
    const pending = ensurePending();
    const all = pending.isolates.slice();
    let images = pending.images.slice();
    const warnings = pending.warnings.slice();
    const sources = pending.sources.slice();
    parsedList.forEach(function (p) {
      (p.isolates || []).forEach(function (iso) {
        const existing = all.find(function (x) { return String(x.id).toLowerCase() === String(iso.id).toLowerCase(); });
        if (!existing) { all.push(iso); return; }
        // merge simple fields and append evidence
        if (!existing.species || /unspecified/i.test(existing.species)) existing.species = iso.species || existing.species;
        existing.genes = (existing.genes || []).concat(iso.genes || []);
        existing.phenotypes = (existing.phenotypes || []).concat(iso.phenotypes || []);
        existing.notes = [existing.notes, iso.notes].filter(Boolean).join('\n');
        existing.images = (existing.images || []).concat(iso.images || []);
      });
      (p.images || []).forEach(function (img) { images.push(img); });
      (p.warnings || []).forEach(function (w) { if (warnings.indexOf(w) < 0) warnings.push(w); });
      if (p.kind && sources.indexOf(p.kind) < 0) sources.push(p.kind);
    });
    // deduplicate genes and phenotypes by key
    all.forEach(function (iso) {
      const gs = {}, ps = {};
      iso.genes = (iso.genes || []).filter(function (g) { const k = (g.symbol + '|' + (g.contig || '')).toLowerCase(); if (gs[k]) return false; gs[k] = true; return true; });
      iso.phenotypes = (iso.phenotypes || []).filter(function (p) { const k = p.drug; if (ps[k]) return false; ps[k] = true; return true; });
    });
    pending.isolates = all.map(function (iso) { return E.normalizeIsolate(iso); });
    pending.images = images;
    pending.warnings = warnings;
    pending.sources = sources;
    const nameEl = $('#import-name');
    if (nameEl && nameEl.value) pending.name = nameEl.value;
    const modeEl = $('#import-mode');
    if (modeEl) pending.mode = modeEl.value;
  }
  async function handleDataFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const formatEl = $('#file-format');
    const format = formatEl ? formatEl.value : 'auto';
    const parsed = [];
    const errors = [];
    for (const file of list) {
      try {
        const text = await readText(file);
        parsed.push(parseOne(text, file.name, format));
      } catch (err) {
        errors.push(file.name + ': ' + (err && err.message ? err.message : String(err)));
      }
    }
    if (errors.length) toast(errors.join(' · '), 'error');
    if (!parsed.length) return;
    ensurePending();
    mergePending(parsed);
    render();
    toast(parsed.length + ' file' + (parsed.length === 1 ? '' : 's') + ' parsed. Review the preview before applying.', 'success');
  }
  async function handleImages(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const target = $('#image-target') ? $('#image-target').value : '';
    const pending = ensurePending();
    const results = await Promise.all(list.map(function (file) {
      return E.fileToImage(file, 1400).then(function (img) {
        img.isolateId = target;
        img.caption = '';
        return img;
      }).catch(function (err) {
        toast(file.name + ': ' + (err && err.message ? err.message : 'could not read image'), 'error');
        return null;
      });
    }));
    pending.images = pending.images.concat(results.filter(Boolean));
    render();
    toast(results.filter(Boolean).length + ' image' + (results.filter(Boolean).length === 1 ? '' : 's') + ' added to the preview.', 'success');
  }
  function applyImport() {
    const pending = App.pending;
    if (!pending || (!pending.isolates.length && !pending.images.length)) { toast('There is nothing to apply yet.', 'info'); return; }
    const nameEl = $('#import-name');
    const modeEl = $('#import-mode');
    if (nameEl && nameEl.value) pending.name = nameEl.value;
    if (modeEl) pending.mode = modeEl.value;
    const name = pending.name || (App.dataset && App.dataset.name) || 'Imported dataset';
    const base = pending.mode === 'replace' ? AMR.makeEmptyDataset(name) : (App.dataset || AMR.makeEmptyDataset(name));
    let ds;
    try {
      ds = E.mergeDataset(base, { isolates: pending.isolates, images: [] }, { replace: pending.mode === 'replace', name: name });
    } catch (err) {
      toast('Could not merge the dataset: ' + (err && err.message ? err.message : String(err)), 'error');
      return;
    }
    ds.name = name;
    ds.images = (pending.images || []).filter(function (img) { return !img.isolateId; });
    (pending.images || []).filter(function (img) { return img.isolateId; }).forEach(function (img) {
      const iso = ds.isolates.find(function (x) { return x.id === img.isolateId; });
      if (iso) { iso.images = iso.images || []; iso.images.push(img); }
      else ds.images.push(img);
    });
    App.pending = null;
    setDataset(ds, { render: false, toast: 'Workspace updated: ' + ds.isolates.length + ' isolates and ' + (ds.images.length + ds.isolates.reduce(function (n, x) { return n + (x.images || []).length; }, 0)) + ' images.' });
    navigate('isolates');
  }
  function bindImport() {
    const dz = $('#data-dropzone');
    const input = $('#data-input');
    if (dz && input) {
      dz.addEventListener('click', function () { input.click(); });
      dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag'); });
      dz.addEventListener('dragleave', function () { dz.classList.remove('drag'); });
      dz.addEventListener('drop', function (e) {
        e.preventDefault(); dz.classList.remove('drag');
        const files = Array.from(e.dataTransfer.files || []);
        const images = files.filter(function (f) { return /^image\//.test(f.type); });
        const data = files.filter(function (f) { return !/^image\//.test(f.type); });
        if (data.length) handleDataFiles(data);
        if (images.length) handleImages(images);
      });
      input.addEventListener('change', function () { handleDataFiles(this.files); this.value = ''; });
    }
    const idz = $('#image-dropzone');
    const iinput = $('#image-input');
    if (idz && iinput) {
      idz.addEventListener('click', function () { iinput.click(); });
      idz.addEventListener('dragover', function (e) { e.preventDefault(); idz.classList.add('drag'); });
      idz.addEventListener('dragleave', function () { idz.classList.remove('drag'); });
      idz.addEventListener('drop', function (e) { e.preventDefault(); idz.classList.remove('drag'); handleImages(e.dataTransfer.files); });
      iinput.addEventListener('change', function () { handleImages(this.files); this.value = ''; });
    }
    const nameEl = $('#import-name');
    if (nameEl) nameEl.addEventListener('input', function () { ensurePending().name = this.value; });
    const modeEl = $('#import-mode');
    if (modeEl) modeEl.addEventListener('change', function () { ensurePending().mode = this.value; });
  }

  /* ------------------------------------------------------------------ */
  /* report                                                              */
  /* ------------------------------------------------------------------ */
  function renderReport() {
    const opts = App.report || Rep.defaults();
    const preview = Rep.preview(App.dataset, App.analysis, opts);
    return pageHead('Output', 'Report builder', 'Configure a detailed, print-ready PDF. The report includes methods, cohort analysis, per-isolate reasoning, mismatch hypotheses, and an evidence appendix.',
      '<button class="btn primary" data-action="download-report">' + icon('download') + 'Generate PDF</button>') +
      '<div class="report-layout"><div class="card card-pad report-settings" id="report-settings"><div class="card-title">Report settings</div>' +
      '<div class="field" style="margin-top:12px"><label class="field-label" for="report-title">Title</label><input class="input" id="report-title" data-report-field="title" value="' + esc(opts.title) + '"></div>' +
      '<div class="field"><label class="field-label" for="report-subtitle">Subtitle</label><textarea class="textarea" id="report-subtitle" data-report-field="subtitle" style="min-height:64px;font-family:var(--font);font-size:12px">' + esc(opts.subtitle) + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="report-author">Prepared by</label><input class="input" id="report-author" data-report-field="author" placeholder="Name or team" value="' + esc(opts.author) + '"></div>' +
      '<div class="field"><label class="field-label" for="report-institution">Institution</label><input class="input" id="report-institution" data-report-field="institution" placeholder="Optional" value="' + esc(opts.institution) + '"></div>' +
      '<div class="divider"></div><div class="field-label">Include</div>' +
      checkbox('includeCharts', 'Annotated charts and mechanism maps', opts.includeCharts) +
      checkbox('includeIsolates', 'Per-isolate sections', opts.includeIsolates) +
      checkbox('includeHypotheses', 'Alternative hypotheses and next tests', opts.includeHypotheses) +
      checkbox('includeImages', 'Evidence images', opts.includeImages) +
      checkbox('includeAppendix', 'Methods, assumptions, and glossary appendix', opts.includeAppendix) +
      '<div class="field" style="margin-top:12px"><label class="field-label" for="report-notes">Reviewer notes (optional)</label><textarea class="textarea" id="report-notes" data-report-field="notes" style="min-height:72px;font-family:var(--font);font-size:12px" placeholder="Assumptions, limitations, or a note for the reviewer">' + esc(opts.notes) + '</textarea></div>' +
      '<div class="divider"></div><button class="btn primary" data-action="download-report" style="width:100%">' + icon('download') + 'Generate PDF report</button>' +
      '<div class="tiny muted" style="margin-top:8px">A4 · multi-page · embedded charts · page numbers</div>' +
      '<div class="report-progress"><span id="report-progress" style="width:0%"></span></div></div>' +
      '<div class="report-preview" id="report-preview">' + preview + '</div></div>';
  }
  function checkbox(field, label, checked) {
    return '<label class="checkbox" style="margin-top:8px"><input type="checkbox" data-report-field="' + field + '"' + (checked ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }
  function bindReport() {
    $$('#report-settings [data-report-field]').forEach(function (el) {
      const ev = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        const field = el.getAttribute('data-report-field');
        App.report[field] = el.type === 'checkbox' ? el.checked : el.value;
        const preview = $('#report-preview');
        if (preview) preview.innerHTML = Rep.preview(App.dataset, App.analysis, App.report);
        saveState();
      });
    });
  }
  function downloadReport() {
    if (!App.dataset || !App.analysis || !App.analysis.isolates.length) { toast('Load a dataset before generating a report.', 'info'); return; }
    if (App.report) {
      const settings = $('#report-settings');
      if (settings) {
        $$('[data-report-field]', settings).forEach(function (el) {
          const field = el.getAttribute('data-report-field');
          App.report[field] = el.type === 'checkbox' ? el.checked : el.value;
        });
      }
    }
    showBusy('Building your report', 'Preparing charts and evidence tables');
    const progress = $('#report-progress');
    if (progress) progress.style.width = '2%';
    Rep.generate(App.dataset, App.analysis, App.report, function (frac, label) {
      showBusy('Building your report', label || 'Working…');
      if (progress) progress.style.width = Math.round(frac * 100) + '%';
    }).then(function (res) {
      res.download();
      hideBusy();
      toast('Report generated: ' + res.pages + ' pages. Check your downloads folder.', 'success');
    }).catch(function (err) {
      console.error(err);
      hideBusy();
      toast('The report could not be generated: ' + (err && err.message ? err.message : String(err)), 'error');
    });
  }

  /* ------------------------------------------------------------------ */
  /* global actions / toasts / busy                                      */
  /* ------------------------------------------------------------------ */
  function showBusy(title, sub) {
    const root = $('#busy-root');
    if (!root) return;
    root.classList.remove('hidden');
    const t = $('#busy-title'); if (t) t.textContent = title;
    const s = $('#busy-sub'); if (s) s.textContent = sub || '';
  }
  function hideBusy() {
    const root = $('#busy-root');
    if (root) root.classList.add('hidden');
  }
  function toast(message, type) {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.innerHTML = '<span class="t-icon">' + icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info') + '</span><div>' + esc(message) + '</div>';
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, 5200);
  }
  function exportJson() {
    if (!App.dataset) { toast('There is no dataset to export.', 'info'); return; }
    const blob = new Blob([JSON.stringify(App.dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = String(App.dataset.name || 'amr-prism-dataset').replace(/[^\w.-]+/g, '-') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Dataset exported as JSON.', 'success');
  }
  function csvCell(value) {
    const s = String(value == null ? '' : value);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function labCsv(filled) {
    const panel = studyPanel();
    const lines = ['isolate_id,species,drug,sir,mic_or_zone'];
    (App.dataset ? App.dataset.isolates : []).forEach(function (iso) {
      panel.forEach(function (drug) {
        const p = filled ? (iso.phenotypes || []).find(function (x) { return x.drug === drug; }) : null;
        lines.push([
          csvCell(iso.id),
          csvCell(E.speciesInfo(iso.species).label),
          csvCell(E.drugInfo(drug).name),
          csvCell(p && p.sir ? p.sir : ''),
          csvCell(p ? (p.mic || p.zone || '') : '')
        ].join(','));
      });
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }
  function downloadLabCsv(filled) {
    if (!App.dataset || !App.dataset.isolates.length) { toast('Load a dataset before downloading a lab template.', 'info'); return; }
    const blob = new Blob([labCsv(filled)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filled ? 'amr-prism-lab-results.csv' : 'amr-prism-lab-template.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast(filled ? 'Lab results exported as CSV.' : 'Blank lab template downloaded: one row per isolate and study drug.', 'success');
  }
  function loadStudy() {
    const hasWork = App.dataset && App.dataset.isolates.some(function (iso) {
      return (iso.phenotypes || []).length || (iso.genes || []).length;
    });
    if (hasWork && !confirm('Load the blank 50-isolate study template? The current genes and lab results in this browser will be replaced. Export the dataset or lab CSV first if you want to keep them.')) return;
    App.pending = null;
    setDataset(AMR.STUDY, { render: false, toast: 'Study template loaded: 50 isolates across 5 species and 8 study drugs.' });
    navigate('overview');
  }
  function clearData() {
    if (!confirm('Clear the current dataset from this browser? Export JSON first if you want to keep it.')) return;
    App.pending = null;
    App.dataset = null; App.analysis = null; App.selectedIsolateId = null;
    App.chat.messages = [];
    localStorage.removeItem(STORE);
    updateChrome();
    navigate('import');
    toast('Workspace cleared.', 'info');
  }

  function handleAction(action, el) {
    if (action === 'load-study') { loadStudy(); return; }
    if (action === 'load-demo') {
      App.pending = null;
      setDataset(AMR.DEMO, { render: false, toast: 'Demo cohort loaded: 13 synthetic isolates.' });
      navigate('overview');
      return;
    }
    if (action === 'download-lab-template') { downloadLabCsv(false); return; }
    if (action === 'export-lab-results') { downloadLabCsv(true); return; }
    if (action === 'clear-data') { clearData(); return; }
    if (action === 'export-json') { exportJson(); return; }
    if (action === 'download-report') { downloadReport(); return; }
    if (action === 'open-isolate') { openIsolate(el.getAttribute('data-id')); return; }
    if (action === 'close-drawer') { closeDrawer(); return; }
    if (action === 'apply-import') { applyImport(); return; }
    if (action === 'clear-pending') { App.pending = null; render(); toast('Parse preview cleared.', 'info'); return; }
    if (action === 'remove-pending-image') {
      const idx = Number(el.getAttribute('data-index'));
      if (App.pending && App.pending.images[idx]) { App.pending.images.splice(idx, 1); render(); }
      return;
    }
    if (action === 'parse-paste') {
      const ta = $('#paste-text');
      const fmt = $('#file-format');
      if (!ta || !ta.value.trim()) { toast('Paste some text first.', 'info'); return; }
      try {
        const parsed = parseOne(ta.value, 'pasted-text.txt', fmt ? fmt.value : 'auto');
        ensurePending();
        mergePending([parsed]);
        render();
        toast('Pasted text parsed. Review the preview before applying.', 'success');
      } catch (err) {
        toast('Could not parse the pasted text: ' + (err && err.message ? err.message : String(err)), 'error');
      }
      return;
    }
    if (action === 'chat-send') {
      const input = $('#chat-input');
      if (input && input.value.trim()) { const v = input.value.trim(); input.value = ''; sendChat(v); }
      return;
    }
    if (action === 'refresh-preview') {
      const preview = $('#report-preview');
      if (preview) preview.innerHTML = Rep.preview(App.dataset, App.analysis, App.report);
      return;
    }
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    injectIcons();
    const saved = loadState();
    App.report = Object.assign(Rep.defaults(), (saved && saved.report) || {});
    if (saved && saved.dataset) {
      setDataset(saved.dataset, { render: false });
    } else {
      setDataset(AMR.STUDY, { render: false });
      App.view = 'overview';
      setTimeout(function () { toast('Loaded the 50-isolate final-year study template. Import AMRFinderPlus results, then enter the lab AST results.', 'info'); }, 700);
    }
    if (saved && VALID_VIEWS.indexOf(saved.view) >= 0) App.view = saved.view;

    // navigation
    $$('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.getAttribute('data-view')); });
    });
    $$('[data-view]').forEach(function (el) {
      if (el.classList.contains('nav-item')) return;
      el.addEventListener('click', function (e) { e.preventDefault(); navigate(el.getAttribute('data-view')); });
    });
    const menu = $('#menu-toggle');
    if (menu) menu.addEventListener('click', function () { $('#sidebar').classList.toggle('open'); });
    const importBtn = $('#topbar-import');
    if (importBtn) importBtn.addEventListener('click', function () { navigate('import'); });
    const reportBtn = $('#topbar-report');
    if (reportBtn) reportBtn.addEventListener('click', downloadReport);

    // delegated actions
    document.addEventListener('click', function (e) {
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        e.preventDefault();
        handleAction(actionEl.getAttribute('data-action'), actionEl);
        return;
      }
      const promptEl = e.target.closest('[data-prompt]');
      if (promptEl) {
        e.preventDefault();
        const text = promptEl.getAttribute('data-prompt');
        if (App.view !== 'chat') navigate('chat');
        sendChat(text);
        return;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); hideBusy(); }
    });

    updateChrome();
    render();
    if (App.view === 'chat') {
      // ensure greeting after initial render
      setTimeout(function () { if (App.view === 'chat') { ensureChat(); renderChatMessages(); } }, 0);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.AMR);
