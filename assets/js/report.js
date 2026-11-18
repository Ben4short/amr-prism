/* =========================================================================
   AMR Prism — detailed PDF report builder
   Uses the dependency-free PDF writer plus rasterized SVG charts.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const E = AMR.Engine;
  const KB = AMR.KB;
  const C = AMR.Charts;
  const R = AMR.Reasoner;
  const PDF = AMR.PDF;

  const Rep = {};
  const X = 40;
  const W = 515.28;
  const BOTTOM = 62;

  const C_DARK = '#102a3a';
  const C_TEXT = '#274456';
  const C_MUTED = '#6b8294';
  const C_LINE = '#d8e4ec';
  const C_TEAL = '#0f766e';
  const C_TEAL_SOFT = '#eef8f6';
  const C_RED = '#b4232f';
  const C_AMBER = '#9a6200';
  const C_GREEN = '#127a45';
  const C_PURPLE = '#6d4fc4';

  function statusColor(status) {
    if (status === 'concordant-r') return C_RED;
    if (status === 'concordant-s') return C_GREEN;
    if (status === 'partial') return C_AMBER;
    if (status === 'silent') return C_PURPLE;
    if (status === 'unexplained') return C_RED;
    return C_MUTED;
  }
  function statusLabel(status) {
    return KB.CONCORDANCE[status] ? KB.CONCORDANCE[status].label : status;
  }
  function fmtPct(v) { return v == null || isNaN(v) ? '—' : Math.round(v * 100) + '%'; }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  function newPage(doc) {
    doc.addPage();
    return 60;
  }
  function ensure(doc, y, needed) {
    if (y + (needed || 0) > doc.height - BOTTOM) {
      doc.addPage();
      return 60;
    }
    return y;
  }
  function sectionTitle(doc, kicker, title, y) {
    y = ensure(doc, y, 54);
    doc.text(kicker.toUpperCase(), X, y, { size: 7.5, bold: true, color: C_TEAL });
    y += 14;
    doc.text(title, X, y, { size: 17, bold: true, color: C_DARK });
    y += 24;
    doc.line(X, y, X + W, y, { color: C_LINE, sw: 0.8 });
    return y + 12;
  }
  function body(doc, text, y, opts) {
    opts = opts || {};
    const size = opts.size || 9.2;
    const lh = opts.lineHeight || size * 1.45;
    const maxW = opts.width || W;
    const lines = doc.wrap(text, maxW, size, !!opts.bold);
    const h = lines.length * lh;
    y = ensure(doc, y, h);
    return doc.textBlock(text, opts.x == null ? X : opts.x, y, maxW, {
      size: size, lineHeight: lh, bold: !!opts.bold, color: opts.color || C_TEXT
    });
  }
  function kpiRow(doc, items, y) {
    y = ensure(doc, y, 58);
    const gap = 8;
    const w = (W - gap * (items.length - 1)) / items.length;
    items.forEach(function (it, i) {
      const x = X + i * (w + gap);
      doc.rect(x, y, w, 50, { fill: '#f7fafc', stroke: C_LINE, rx: 6, sw: 0.7 });
      doc.text(String(it.value), x + 9, y + 8, { size: 16, bold: true, color: it.color || C_DARK });
      doc.text(it.label.toUpperCase(), x + 9, y + 29, { size: 6.5, bold: true, color: C_MUTED });
      if (it.sub) doc.text(it.sub, x + 9, y + 39, { size: 6.5, color: C_MUTED });
    });
    return y + 62;
  }
  function callout(doc, title, text, y) {
    const lines = doc.wrap(text, W - 24, 8.5, false);
    const h = 18 + lines.length * 11.4;
    y = ensure(doc, y, h);
    doc.rect(X, y, W, h, { fill: C_TEAL_SOFT, rx: 5 });
    doc.rect(X, y, 3, h, { fill: C_TEAL, rx: 1.5 });
    doc.text(title, X + 12, y + 6, { size: 8, bold: true, color: C_TEAL });
    doc.textBlock(text, X + 12, y + 18, W - 24, { size: 8.5, lineHeight: 11.4, color: '#28535a' });
    return y + h + 10;
  }

  /* ------------------------------------------------------------------ */
  /* chart rendering                                                     */
  /* ------------------------------------------------------------------ */
  function statusSegments(a) {
    return [
      { label: 'Concordant R', value: a.counts['concordant-r'] || 0, color: KB.CONCORDANCE['concordant-r'].color },
      { label: 'Concordant S', value: a.counts['concordant-s'] || 0, color: KB.CONCORDANCE['concordant-s'].color },
      { label: 'Partial', value: a.counts.partial || 0, color: KB.CONCORDANCE.partial.color },
      { label: 'Silent', value: a.counts.silent || 0, color: KB.CONCORDANCE.silent.color },
      { label: 'Unexplained', value: a.counts.unexplained || 0, color: KB.CONCORDANCE.unexplained.color }
    ].filter(function (s) { return s.value; });
  }
  function flowGroups(findings, limit) {
    return findings.slice(0, limit || 6).map(function (f) {
      const s = f.supports[0];
      return {
        gene: s ? s.display : 'No detected determinant',
        geneSub: s ? (s.family || s.mechanism || '') : 'database-limited',
        mechanism: s ? (s.mechanism || s.action || '') : 'Unknown / unmeasured',
        mechanismSub: s ? (s.action || '').slice(0, 54) : 'target, porin, efflux, or uncharacterised',
        target: f.drugName,
        effectLabel: 'Predicted ' + f.predictedLabel + ' · observed ' + (f.observed || 'NT'),
        status: f.status,
        statusLabel: f.statusLabel,
        confidence: f.confidence
      };
    });
  }
  function chartJobs(a, opts) {
    const jobs = [];
    if (!opts.includeCharts) return jobs;
    jobs.push({ key: 'status', svg: C.donut(statusSegments(a), { theme: 'light', size: 190, centerValue: fmtPct(a.strictRate), centerLabel: 'strict concordance' }), w: 395, h: 190 });
    const classes = a.classResistance.slice(0, 8).map(function (c) {
      return { label: c.label, value: Math.round(c.rate * 100), color: c.color };
    });
    if (classes.length) jobs.push({ key: 'classes', svg: C.bars(classes, { theme: 'light', width: 470, valueFormat: function (v) { return v + '%'; }, labelChars: 22 }), w: 470, h: Math.max(60, classes.length * 27 + 18) });
    const genes = a.genePrevalence.slice(0, 10).map(function (g) {
      return { label: g.display, value: g.count, color: '#2f8fb5' };
    });
    if (genes.length) jobs.push({ key: 'genes', svg: C.bars(genes, { theme: 'light', width: 470, labelChars: 24 }), w: 470, h: Math.max(60, genes.length * 27 + 18) });
    if (a.speciesDistribution.length) jobs.push({ key: 'species', svg: C.speciesBars(a.speciesDistribution, { theme: 'light', width: 470 }), w: 470, h: Math.max(60, a.speciesDistribution.length * 27 + 18) });
    if (a.topMismatches.length) jobs.push({ key: 'mismatchFlow', svg: C.flow(flowGroups(a.topMismatches.map(function (m) { return m.finding; }), 6), { theme: 'light', width: 760, rowH: 82 }), w: 760, h: Math.max(80, Math.min(6, a.topMismatches.length) * 82 + 34) });
    if (opts.includeIsolates) {
      a.isolates.forEach(function (ia) {
        const fs = ia.findings.filter(function (f) { return f.supports.length && f.observed; }).sort(function (x, y) { return y.confidence - x.confidence; });
        if (fs.length) {
          const n = Math.min(5, fs.length);
          jobs.push({ key: 'flow:' + ia.isolate.id, svg: C.flow(flowGroups(fs, n), { theme: 'light', width: 760, rowH: 82 }), w: 760, h: n * 82 + 34 });
        }
        const anchor = ia.topMismatches[0] || ia.topExplained[0];
        if (anchor) jobs.push({ key: 'chain:' + ia.isolate.id, svg: C.evidenceChain(anchor, { theme: 'light' }), w: 760, h: 158 });
      });
    }
    return jobs;
  }

  function renderCharts(jobs, onProgress) {
    const out = {};
    let i = 0;
    function next() {
      if (i >= jobs.length) return Promise.resolve(out);
      const job = jobs[i++];
      if (onProgress) onProgress(0.06 + 0.5 * (i / jobs.length), 'Rendering chart ' + i + ' of ' + jobs.length);
      return PDF.svgToJpeg(job.svg, job.w, job.h, 2).then(function (r) {
        out[job.key] = r;
        return next();
      }).catch(function () {
        // A chart failure must not block the report.
        return next();
      });
    }
    return next();
  }

  function putImage(doc, rendered, key, x, y, width) {
    const r = rendered[key];
    if (!r) return y;
    const h = width * (r.height / r.width);
    if (y + h > doc.height - BOTTOM) {
      doc.addPage();
      y = 60;
    }
    return doc.image(r.dataUrl, x, y, width, h, r.width, r.height);
  }

  function imageToJpeg(dataUrl) {
    return new Promise(function (resolve) {
      if (!dataUrl) return resolve(null);
      if (/^data:image\/jpeg/i.test(dataUrl)) return resolve({ dataUrl: dataUrl, width: null, height: null });
      const img = new Image();
      img.onload = function () {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const w = Math.round((img.naturalWidth || img.width) * scale);
        const h = Math.round((img.naturalHeight || img.height) * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.9), width: w, height: h });
      };
      img.onerror = function () { resolve(null); };
      img.src = dataUrl;
    });
  }

  /* ------------------------------------------------------------------ */
  /* sections                                                            */
  /* ------------------------------------------------------------------ */
  function cover(doc, ds, a, opts) {
    const page = doc.pages[0];
    page.chrome = false;
    doc.rect(0, 0, doc.width, doc.height, { fill: '#07131f' });
    doc.circle(doc.width - 60, 40, 190, { fill: '#0d2b3a' });
    doc.circle(doc.width - 30, 120, 110, { fill: '#103b47' });
    doc.rect(0, 0, 7, doc.height, { fill: C_TEAL });

    doc.text('AMR PRISM', X, 54, { size: 9, bold: true, color: '#39e0c4' });
    doc.text('GENOTYPE → PHENOTYPE INTELLIGENCE', X + 76, 54, { size: 8, color: '#6f8ba0' });
    doc.line(X, 70, X + W, 70, { color: '#1b3b4b', sw: 0.8 });

    const title = opts.title || 'Genotype–Phenotype Analysis';
    let y = 112;
    const lines = doc.wrap(title, W - 40, 30, true);
    lines.forEach(function (ln) {
      doc.text(ln, X, y, { size: 30, bold: true, color: '#f2f8fb' });
      y += 36;
    });
    y += 4;
    y = doc.textBlock(opts.subtitle || 'First-principles review of AMRFinderPlus determinants against phenotypic susceptibility results.', X, y, W - 60, { size: 11, lineHeight: 16, color: '#9db6c8' });
    y += 22;

    doc.rect(X, y, W, 1, { fill: '#1b3b4b' });
    y += 22;
    doc.text('DATASET', X, y, { size: 7, bold: true, color: '#6f8ba0' });
    doc.text(ds.name || 'Untitled dataset', X + 76, y, { size: 10.5, bold: true, color: '#e7f1f8' });
    y += 20;
    doc.text('SOURCE', X, y, { size: 7, bold: true, color: '#6f8ba0' });
    doc.text(ds.source || 'Imported evidence', X + 76, y, { size: 10, color: '#c9dbe6' });
    y += 20;
    doc.text('GENERATED', X, y, { size: 7, bold: true, color: '#6f8ba0' });
    doc.text(new Date().toLocaleString(), X + 76, y, { size: 10, color: '#c9dbe6' });
    if (opts.author) {
      y += 20;
      doc.text('PREPARED BY', X, y, { size: 7, bold: true, color: '#6f8ba0' });
      doc.text(opts.author + (opts.institution ? ' · ' + opts.institution : ''), X + 76, y, { size: 10, color: '#c9dbe6' });
    }

    // metric strip
    const my = doc.height - 250;
    const items = [
      { label: 'Isolates', value: a.isolates.length },
      { label: 'Comparisons', value: a.assessedTotal },
      { label: 'Strict concordance', value: fmtPct(a.strictRate) },
      { label: 'Major mismatches', value: a.majorMismatchTotal }
    ];
    const gap = 8;
    const w = (W - gap * 3) / 4;
    items.forEach(function (it, i) {
      const x = X + i * (w + gap);
      doc.rect(x, my, w, 58, { fill: '#0c2231', stroke: '#1b3b4b', rx: 6, sw: 0.7 });
      doc.text(String(it.value), x + 10, my + 9, { size: 20, bold: true, color: '#39e0c4' });
      doc.text(it.label.toUpperCase(), x + 10, my + 37, { size: 6.5, bold: true, color: '#6f8ba0' });
    });

    doc.text('RESEARCH AND EDUCATION USE ONLY', X, doc.height - 62, { size: 7.5, bold: true, color: '#f5b84b' });
    doc.text('Decision support, not a clinical diagnosis. Verify species identification, local breakpoints, and method validation before clinical use.', X, doc.height - 50, { size: 7, color: '#6f8ba0' });
    doc.text('AMR Prism · deterministic first-principles engine', X + W, doc.height - 50, { size: 7, color: '#6f8ba0', align: 'right' });
  }

  function executive(doc, ds, a, opts) {
    doc.addPage();
    let y = sectionTitle(doc, '01 · Executive summary', 'What the evidence says', 60);
    y = body(doc, (ds.description || 'This report reviews the imported AMRFinderPlus determinants against the available phenotypic susceptibility results.') +
      ' The cohort contains ' + a.isolates.length + ' isolates and ' + a.assessedTotal + ' assessed drug–isolate comparisons. ' +
      'The strict concordance rate is ' + fmtPct(a.strictRate) + '; the weighted rate, which gives half credit to R/I partial calls, is ' + fmtPct(a.weightedRate) + '.', y);
    y += 6;
    y = kpiRow(doc, [
      { label: 'Isolates', value: a.isolates.length, sub: a.speciesDistribution.length + ' species' },
      { label: 'Assessed comparisons', value: a.assessedTotal, sub: 'MIC, zone, or SIR available' },
      { label: 'Strict concordance', value: fmtPct(a.strictRate), color: C_TEAL, sub: 'weighted ' + fmtPct(a.weightedRate) },
      { label: 'Major mismatches', value: a.majorMismatchTotal, color: C_RED, sub: fmtPct(a.majorRate) + ' of assessed' }
    ], y);

    const top = a.topMismatches[0];
    const message = top
      ? 'The highest-value discordance is ' + top.isolateId + ' · ' + top.finding.drugName + ' (' + statusLabel(top.finding.status) + '). ' +
        'The leading hypothesis is “' + (top.finding.hypotheses[0] ? top.finding.hypotheses[0].title : 'unmeasured mechanism') + '”, and the next discriminating test is: ' +
        (top.finding.hypotheses[0] ? top.finding.hypotheses[0].next : 'repeat the reference AST and review the full resistance profile.') +
        ' Discordance is treated as a missing premise, not as a failed assay.'
      : 'No major discordance was detected. The model still carries uncertainty from database scope, expression, permeability, and target mutations that are not represented in the evidence set.';
    y = callout(doc, 'Headline interpretation', message, y);

    y = sectionTitle(doc, 'Methods', 'How the inference works', y);
    y = body(doc, 'AMR Prism uses a deterministic rule engine. Each detected determinant is resolved to a mechanism, the mechanism is mapped to drug-class effects, and the predicted effect is compared with the observed MIC/SIR. The engine never invents a prediction from a gene name alone: it requires a valid biochemical path from the determinant to the drug. Every comparison is labelled concordant, partial, silent, or unexplained, and every discordance receives ranked alternative hypotheses and a next test.', y);
    y += 4;
    const axioms = KB.AXIOMS;
    const colW = (W - 12) / 2;
    let colY = [y, y];
    axioms.forEach(function (ax, i) {
      const col = i % 2;
      const x = X + col * (colW + 12);
      const yy = colY[col];
      const lines = doc.wrap(ax.text, colW - 16, 7.8, false);
      const h = 18 + lines.length * 10.5;
      if (yy + h > doc.height - BOTTOM) return;
      doc.rect(x, yy, colW, h, { fill: '#f7fafc', stroke: C_LINE, rx: 5, sw: 0.6 });
      doc.text(ax.id + ' · ' + ax.title, x + 8, yy + 5, { size: 7.8, bold: true, color: C_DARK });
      doc.textBlock(ax.text, x + 8, yy + 16, colW - 16, { size: 7.8, lineHeight: 10.5, color: C_TEXT });
      colY[col] = yy + h + 6;
    });
    y = Math.max(colY[0], colY[1]) + 6;

    y = ensure(doc, y, 90);
    doc.text('Concordance definitions', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.5, headerSize: 6.8,
      columns: [
        { key: 'label', label: 'Category', width: 115, bold: true },
        { key: 'desc', label: 'Interpretation', width: 400 }
      ],
      rows: ['concordant-r', 'concordant-s', 'partial', 'silent', 'unexplained'].map(function (k) {
        return { label: KB.CONCORDANCE[k].label, desc: KB.CONCORDANCE[k].desc };
      })
    });
    return y;
  }

  function overviewSection(doc, a, rendered, opts) {
    doc.addPage();
    let y = sectionTitle(doc, '02 · Cohort overview', 'Resistance and concordance landscape', 60);
    y = body(doc, 'The cohort is summarised by concordance status, drug-class resistance, determinant prevalence, and species composition. Percentages are based on assessed comparisons only; untested predictions are excluded from the denominator.', y);
    y += 4;

    if (rendered.status) {
      const w1 = 248;
      const h1 = w1 * (rendered.status.height / rendered.status.width);
      const h2 = w1 * (rendered.classes ? rendered.classes.height / rendered.classes.width : 0);
      const rowH = Math.max(h1, h2 || 0);
      y = ensure(doc, y, rowH + 20);
      doc.text('Concordance composition', X, y, { size: 8, bold: true, color: C_DARK });
      doc.text('Resistance by drug class', X + 266, y, { size: 8, bold: true, color: C_DARK });
      const topY = y + 12;
      doc.image(rendered.status.dataUrl, X, topY, w1, h1, rendered.status.width, rendered.status.height);
      if (rendered.classes) doc.image(rendered.classes.dataUrl, X + 266, topY, w1, h2, rendered.classes.width, rendered.classes.height);
      y = topY + rowH + 14;
    }

    if (rendered.genes) {
      y = ensure(doc, y, 170);
      doc.text('Most prevalent determinants', X, y, { size: 8, bold: true, color: C_DARK });
      y = putImage(doc, rendered, 'genes', X, y + 12, 470);
      y += 8;
    }
    if (rendered.species) {
      y = ensure(doc, y, 150);
      doc.text('Species distribution', X, y, { size: 8, bold: true, color: C_DARK });
      y = putImage(doc, rendered, 'species', X, y + 12, 430);
      y += 8;
    }

    y = ensure(doc, y, 150);
    doc.text('Cohort composition and classification', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.6, headerSize: 6.8,
      columns: [
        { key: 'id', label: 'Isolate', width: 78, bold: true },
        { key: 'species', label: 'Species', width: 150 },
        { key: 'source', label: 'Source', width: 80 },
        { key: 'genes', label: 'Genes', width: 45, align: 'right' },
        { key: 'tested', label: 'Tested', width: 48, align: 'right' },
        { key: 'conc', label: 'Strict', width: 50, align: 'right' },
        { key: 'mdr', label: 'Class', width: 64 }
      ],
      rows: a.isolates.map(function (ia) {
        return {
          id: ia.isolate.id,
          species: E.speciesInfo(ia.isolate.species).label,
          source: clean(ia.isolate.source),
          genes: ia.geneCount,
          tested: ia.assessedCount,
          conc: fmtPct(ia.strictRate),
          mdr: ia.mdrClass
        };
      })
    });
    return y;
  }

  function isolateSection(doc, ia, rendered, opts) {
    doc.addPage();
    const iso = ia.isolate;
    let y = 60;
    doc.rect(X, y, W, 62, { fill: C_TEAL_SOFT, rx: 6 });
    doc.rect(X, y, 4, 62, { fill: C_TEAL, rx: 2 });
    doc.text(iso.id, X + 14, y + 8, { size: 17, bold: true, color: C_DARK });
    doc.text(E.speciesInfo(iso.species).label, X + 14, y + 31, { size: 9, color: C_TEXT });
    doc.text((iso.source || 'Source not recorded') + (iso.collectionDate ? ' · ' + iso.collectionDate : '') + (iso.location ? ' · ' + iso.location : ''), X + 14, y + 45, { size: 7.5, color: C_MUTED });
    doc.rect(X + W - 92, y + 10, 78, 22, { fill: ia.mdrClass === 'Non-MDR' ? '#e3f8ec' : '#fff4dd', rx: 4 });
    doc.text(ia.mdrClass, X + W - 53, y + 15, { size: 8, bold: true, color: ia.mdrClass === 'Non-MDR' ? C_GREEN : C_AMBER, align: 'center' });
    y += 74;

    const demo = [iso.age ? iso.age + 'y' : '', iso.sex || '', ia.geneCount + ' determinants', ia.phenotypeCount + ' tested drugs'].filter(Boolean).join(' · ');
    y = body(doc, demo, y, { size: 8, color: C_MUTED });
    if (iso.notes) y = body(doc, 'Clinical / laboratory note: ' + iso.notes, y + 2, { size: 8.2 });
    y += 6;
    y = kpiRow(doc, [
      { label: 'Strict concordance', value: fmtPct(ia.strictRate), color: C_TEAL },
      { label: 'Weighted', value: fmtPct(ia.weightedRate) },
      { label: 'Major mismatches', value: ia.majorMismatch, color: C_RED, sub: fmtPct(ia.majorRate) },
      { label: 'Resistance rate', value: fmtPct(ia.resistanceRate) }
    ], y);

    if (iso.genes.length) {
      y = ensure(doc, y, 90);
      doc.text('Detected determinants', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      y = doc.table({
        x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.5,
        columns: [
          { key: 'symbol', label: 'Determinant', width: 125, bold: true },
          { key: 'mechanism', label: 'Resolved mechanism', width: 175 },
          { key: 'identity', label: 'Identity', width: 48, align: 'right' },
          { key: 'coverage', label: 'Coverage', width: 52, align: 'right' },
          { key: 'source', label: 'Source', width: 65 },
          { key: 'contig', label: 'Contig', width: 60 }
        ],
        rows: iso.genes.map(function (g) {
          const entry = KB.resolveGene(g.symbol, g);
          return {
            symbol: g.symbol,
            mechanism: entry ? entry.mechanism : (g.mechanism || 'unresolved'),
            identity: g.identity != null ? E.fmt(g.identity, 1) + '%' : '—',
            coverage: g.coverage != null ? E.fmt(g.coverage, 0) + '%' : '—',
            source: g.method || '—',
            contig: g.contig || '—'
          };
        })
      });
    }

    const assessedFindings = ia.findings.filter(function (f) { return f.observed; });
    if (assessedFindings.length) {
      y = ensure(doc, y, 100);
      doc.text('Drug-level inference', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      y = doc.table({
        x: X, y: y, width: W, fontSize: 7.1, headerSize: 6.3,
        columns: [
          { key: 'drug', label: 'Drug', width: 120, bold: true },
          { key: 'mic', label: 'MIC/zone', width: 54, align: 'right' },
          { key: 'obs', label: 'Obs', width: 30, align: 'center' },
          { key: 'pred', label: 'Pred', width: 48 },
          { key: 'status', label: 'Status', width: 90 },
          { key: 'conf', label: 'Conf.', width: 40, align: 'right' },
          { key: 'mech', label: 'Mechanism', width: 120 }
        ],
        rows: assessedFindings.map(function (f) {
          return {
            drug: f.drugName,
            mic: f.observedMic || f.observedZone || '—',
            obs: f.observed,
            pred: f.predictedLabel,
            status: statusLabel(f.status),
            conf: Math.round(f.confidence * 100) + '%',
            mech: f.supports.length ? f.supports[0].display : 'none detected'
          };
        })
      });
    }

    if (opts.includeCharts && rendered['flow:' + iso.id]) {
      y = ensure(doc, y, 140);
      doc.text('Mechanism map', X, y, { size: 9.5, bold: true, color: C_DARK });
      y = putImage(doc, rendered, 'flow:' + iso.id, X, y + 12, W);
      y += 8;
    }

    const anchor = ia.topMismatches[0] || ia.topExplained[0];
    if (anchor) {
      y = ensure(doc, y, 130);
      doc.text('Reasoning chain · ' + anchor.drugName, X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      if (opts.includeCharts && rendered['chain:' + iso.id]) {
        y = putImage(doc, rendered, 'chain:' + iso.id, X, y, W);
        y += 8;
      }
      anchor.chain.forEach(function (step) {
        const lines = doc.wrap(step.text, W - 14, 7.8, false);
        y = ensure(doc, y, lines.length * 10.4 + 8);
        doc.text(step.label, X, y, { size: 7.4, bold: true, color: C_TEAL });
        y += 9;
        doc.textBlock(step.text, X, y, W, { size: 7.8, lineHeight: 10.4, color: C_TEXT });
        y += lines.length * 10.4 + 4;
      });
    }

    if (opts.includeHypotheses && anchor && anchor.hypotheses && anchor.hypotheses.length) {
      y = ensure(doc, y, 100);
      doc.text('Alternative explanations and next tests', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      y = doc.table({
        x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.4,
        columns: [
          { key: 'title', label: 'Hypothesis', width: 165, bold: true },
          { key: 'why', label: 'Why it fits the gap', width: 190 },
          { key: 'next', label: 'Next discriminating test', width: 120 },
          { key: 'prob', label: 'Weight', width: 40, align: 'right' }
        ],
        rows: anchor.hypotheses.map(function (h) {
          return { title: h.title, why: h.why, next: h.next, prob: h.probability + '%' };
        })
      });
    }

    return y;
  }

  function crossSection(doc, a, rendered, opts) {
    doc.addPage();
    let y = sectionTitle(doc, '03 · Cross-isolate analysis', 'Where the model and the phenotype diverge', 60);
    y = body(doc, 'Mismatches are ranked by evidence strength, not by how surprising they are. A silent determinant is a test of expression and allele integrity; an unexplained resistance is a test of database scope, target mutation, permeability, and efflux.', y);
    y += 4;

    if (rendered.mismatchFlow) {
      doc.text('Mismatch mechanism map', X, y, { size: 8, bold: true, color: C_DARK });
      y = putImage(doc, rendered, 'mismatchFlow', X, y + 12, W);
      y += 10;
    }

    if (a.topMismatches.length) {
      y = ensure(doc, y, 100);
      doc.text('Ranked discordances', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      y = doc.table({
        x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.4,
        columns: [
          { key: 'iso', label: 'Isolate', width: 66, bold: true },
          { key: 'drug', label: 'Drug', width: 105, bold: true },
          { key: 'status', label: 'Status', width: 88 },
          { key: 'pred', label: 'Pred / Obs', width: 64 },
          { key: 'hyp', label: 'Leading hypothesis', width: 120 },
          { key: 'next', label: 'Next test', width: 70 }
        ],
        rows: a.topMismatches.slice(0, 10).map(function (m) {
          const f = m.finding;
          const h = f.hypotheses && f.hypotheses[0];
          return {
            iso: m.isolateId,
            drug: f.drugName,
            status: statusLabel(f.status),
            pred: f.predictedLabel + ' / ' + f.observed,
            hyp: h ? h.title : 'unmeasured mechanism',
            next: h ? h.next : 'repeat reference AST'
          };
        })
      });
    } else {
      y = callout(doc, 'No major discordance', 'The current evidence set is internally consistent. That is not proof of completeness: the model still cannot see unmeasured expression, porin loss, efflux, or target mutations outside the panel.', y);
    }

    y = ensure(doc, y, 100);
    doc.text('Gene prevalence across the cohort', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.4,
      columns: [
        { key: 'gene', label: 'Determinant', width: 150, bold: true },
        { key: 'mech', label: 'Mechanism', width: 190 },
        { key: 'count', label: 'Isolates', width: 45, align: 'right' },
        { key: 'ids', label: 'Carried by', width: 130 }
      ],
      rows: a.genePrevalence.slice(0, 20).map(function (g) {
        return { gene: g.display, mech: g.mechanism, count: g.count, ids: g.isolates.slice(0, 4).join(', ') + (g.isolates.length > 4 ? '…' : '') };
      })
    });

    y = ensure(doc, y, 100);
    doc.text('Drug-class resistance summary', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.4,
      columns: [
        { key: 'cls', label: 'Class', width: 180, bold: true },
        { key: 'tested', label: 'Tested', width: 55, align: 'right' },
        { key: 'r', label: 'R', width: 40, align: 'right' },
        { key: 'i', label: 'I', width: 40, align: 'right' },
        { key: 's', label: 'S', width: 40, align: 'right' },
        { key: 'rate', label: 'Non-susceptible', width: 80, align: 'right' }
      ],
      rows: a.classResistance.map(function (c) {
        return { cls: c.label, tested: c.tested, r: c.r, i: c.i, s: c.s, rate: fmtPct(c.rate) };
      })
    });

    y = ensure(doc, y, 80);
    doc.text('MDR / XDR / PDR classification', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.4, headerSize: 6.6,
      columns: [
        { key: 'cls', label: 'Classification', width: 140, bold: true },
        { key: 'count', label: 'Isolates', width: 55, align: 'right' },
        { key: 'ids', label: 'Isolates in this category', width: 320 }
      ],
      rows: Object.keys(a.mdrSummary).filter(function (k) { return a.mdrSummary[k]; }).map(function (k) {
        return {
          cls: k,
          count: a.mdrSummary[k],
          ids: a.isolates.filter(function (ia) { return ia.mdrClass === k; }).map(function (ia) { return ia.isolate.id; }).join(', ')
        };
      })
    });
    return y;
  }

  function appendix(doc, ds, a, opts, images) {
    doc.addPage();
    let y = sectionTitle(doc, '04 · Appendix', 'Assumptions, provenance, and evidence images', 60);
    y = body(doc, 'This appendix records the assumptions behind the report so that another reviewer can reproduce or challenge the conclusions. The analysis is deterministic: the same inputs and knowledge base produce the same outputs.', y);
    y += 4;
    y = callout(doc, 'Scope and limitations', 'Breakpoints in the knowledge base are illustrative defaults for research and teaching. They are not a validated clinical breakpoint table. AMRFinderPlus reports known acquired determinants; it does not capture every target mutation, porin change, efflux phenotype, or uncharacterized mechanism. Phenotypic methods, inoculum, incubation, and mixed populations can all shift a single result. Confirm any actionable finding with a reference method and local expertise.', y);

    y = ensure(doc, y, 100);
    doc.text('Data provenance', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.5, headerSize: 6.6,
      columns: [
        { key: 'k', label: 'Field', width: 110, bold: true },
        { key: 'v', label: 'Value', width: 405 }
      ],
      rows: [
        { k: 'Dataset', v: ds.name || 'Untitled' },
        { k: 'Dataset ID', v: ds.id || '—' },
        { k: 'Source', v: ds.source || '—' },
        { k: 'Created', v: ds.createdAt || '—' },
        { k: 'Report generated', v: new Date().toISOString() },
        { k: 'Engine', v: 'AMR Prism deterministic reasoner v1' },
        { k: 'Knowledge base', v: KB.GENE_ENTRIES.length + ' mechanism entries · ' + Object.keys(KB.DRUGS).length + ' drugs · ' + KB.AXIOMS.length + ' axioms' },
        { k: 'Prepared by', v: (opts.author || '—') + (opts.institution ? ' · ' + opts.institution : '') }
      ]
    });

    if (opts.notes) {
      y = ensure(doc, y, 50);
      doc.text('Reviewer notes', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      y = body(doc, opts.notes, y);
    }

    if (opts.includeImages && images && images.length) {
      y = ensure(doc, y, 80);
      doc.text('Evidence images', X, y, { size: 9.5, bold: true, color: C_DARK });
      y += 12;
      images.forEach(function (img) {
        if (!img || !img.dataUrl) return;
        const r = img.jpeg;
        if (!r) return;
        const w = 230;
        const h = r.width && r.height ? w * (r.height / r.width) : 150;
        y = ensure(doc, y, h + 26);
        doc.image(r.dataUrl, X, y, w, h, r.width || 1000, r.height || 1000);
        doc.text(img.name || 'Evidence image', X, y + h + 5, { size: 7.5, bold: true, color: C_DARK });
        doc.text((img.isolateId ? 'Isolate ' + img.isolateId + ' · ' : '') + (img.caption || 'Imported evidence'), X, y + h + 15, { size: 7, color: C_MUTED });
        y += h + 30;
      });
    }

    y = ensure(doc, y, 90);
    doc.text('Glossary', X, y, { size: 9.5, bold: true, color: C_DARK });
    y += 12;
    y = doc.table({
      x: X, y: y, width: W, fontSize: 7.2, headerSize: 6.4,
      columns: [
        { key: 'term', label: 'Term', width: 120, bold: true },
        { key: 'def', label: 'Definition', width: 395 }
      ],
      rows: [
        { term: 'Determinant', def: 'A gene, mutation, or inferred mechanism that can change susceptibility.' },
        { term: 'Silent determinant', def: 'A determinant predicts resistance but the isolate tests susceptible; presence is not expression.' },
        { term: 'Unexplained resistance', def: 'The isolate tests resistant but no detected determinant provides a valid mechanistic path.' },
        { term: 'Partial', def: 'Prediction and phenotype agree on reduced susceptibility but differ in degree (R vs I).' },
        { term: 'Confidence', def: 'A derived score combining molecular evidence strength, phenotype reliability, and concordance status. It is not a probability of clinical outcome.' },
        { term: 'MDR / XDR / PDR', def: 'Multidrug-, extensively drug-, and pandrug-resistant classifications based on non-susceptibility across drug categories. XDR/PDR require a broad tested panel.' }
      ]
    });
    return y;
  }

  /* ------------------------------------------------------------------ */
  /* public API                                                          */
  /* ------------------------------------------------------------------ */
  Rep.defaults = function () {
    return {
      title: 'Genotype–Phenotype Analysis',
      subtitle: 'First-principles review of AMRFinderPlus determinants against phenotypic susceptibility results.',
      author: '',
      institution: '',
      includeCharts: true,
      includeIsolates: true,
      includeHypotheses: true,
      includeImages: true,
      includeAppendix: true,
      notes: ''
    };
  };

  Rep.generate = function (dataset, analysis, opts, onProgress) {
    opts = Object.assign(Rep.defaults(), opts || {});
    const a = analysis || R.analyzeDataset(dataset);
    const ds = dataset || a.dataset;
    const progress = function (frac, label) { if (onProgress) onProgress(frac, label); };
    progress(0.03, 'Preparing report structure');
    const jobs = chartJobs(a, opts);
    const selected = opts.includeImages ? (a.images || []).slice(0, 24) : [];
    const imagesPromise = Promise.all(selected.map(function (img) {
      return imageToJpeg(img.dataUrl).then(function (r) {
        return r ? Object.assign({}, img, { jpeg: r }) : null;
      });
    }));
    return Promise.all([renderCharts(jobs, progress), imagesPromise]).then(function (results) {
      const rendered = results[0];
      const images = results[1].filter(Boolean);
      progress(0.64, 'Building document');
      const doc = new PDF.PDFDoc();
      doc.setChrome({
        title: 'AMR Prism · ' + (ds.name || 'Genotype–phenotype report'),
        footer: 'Research and education use only. Verify breakpoints and methods locally.',
        right: new Date().toISOString().slice(0, 10)
      });
      cover(doc, ds, a, opts);
      let y = executive(doc, ds, a, opts);
      y = overviewSection(doc, a, rendered, opts);
      if (opts.includeIsolates) {
        a.isolates.forEach(function (ia) { isolateSection(doc, ia, rendered, opts); });
      }
      crossSection(doc, a, rendered, opts);
      if (opts.includeAppendix) appendix(doc, ds, a, opts, images);
      progress(0.9, 'Finalising pages');
      const blob = doc.save();
      progress(1, 'Ready');
      return {
        blob: blob,
        pages: doc.pages.length,
        filename: 'AMR-Prism-' + String(ds.name || 'report').replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') + '-' + new Date().toISOString().slice(0, 10) + '.pdf',
        download: function () {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url; link.download = this.filename;
          document.body.appendChild(link); link.click(); link.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        }
      };
    });
  };

  Rep.preview = function (dataset, analysis, opts) {
    opts = Object.assign(Rep.defaults(), opts || {});
    const a = analysis || R.analyzeDataset(dataset);
    const ds = dataset || a.dataset;
    const top = a.topMismatches.slice(0, 5);
    const rows = a.isolates.slice(0, 8).map(function (ia) {
      return '<tr><td><strong>' + E.escapeHtml(ia.isolate.id) + '</strong></td><td>' + E.escapeHtml(E.speciesInfo(ia.isolate.species).short) +
        '</td><td>' + ia.geneCount + '</td><td>' + ia.assessedCount + '</td><td>' + fmtPct(ia.strictRate) + '</td><td>' + E.escapeHtml(ia.mdrClass) + '</td></tr>';
    }).join('');
    const mismatchRows = top.map(function (m) {
      const f = m.finding;
      return '<tr><td>' + E.escapeHtml(m.isolateId) + '</td><td>' + E.escapeHtml(f.drugName) + '</td><td>' + E.escapeHtml(statusLabel(f.status)) +
        '</td><td>' + E.escapeHtml(f.predictedLabel + ' / ' + f.observed) + '</td><td>' + E.escapeHtml(f.hypotheses[0] ? f.hypotheses[0].title : 'unmeasured mechanism') + '</td></tr>';
    }).join('');
    return '<div class="report-page rp-cover">' +
      '<div class="rp-kicker">AMR Prism · research use only</div>' +
      '<div class="rp-title">' + E.escapeHtml(opts.title) + '</div>' +
      '<div class="rp-sub">' + E.escapeHtml(opts.subtitle) + '</div>' +
      '<div class="rp-meta"><div><div class="l">Dataset</div><div class="v">' + E.escapeHtml(ds.name || 'Untitled') + '</div></div>' +
      '<div><div class="l">Isolates</div><div class="v">' + a.isolates.length + '</div></div>' +
      '<div><div class="l">Comparisons</div><div class="v">' + a.assessedTotal + '</div></div>' +
      '<div><div class="l">Strict concordance</div><div class="v">' + fmtPct(a.strictRate) + '</div></div></div></div>' +
      '<div class="report-page"><div class="rp-section-title">Executive summary</div>' +
      '<div class="rp-text">' + E.escapeHtml(ds.description || 'Genotype–phenotype review of the imported cohort.') +
      ' The cohort contains ' + a.isolates.length + ' isolates and ' + a.assessedTotal + ' assessed comparisons. Strict concordance is ' + fmtPct(a.strictRate) + '; weighted concordance is ' + fmtPct(a.weightedRate) + '.</div>' +
      '<div class="rp-kpis"><div class="rp-kpi"><div class="n">' + a.isolates.length + '</div><div class="l">Isolates</div></div>' +
      '<div class="rp-kpi"><div class="n">' + a.assessedTotal + '</div><div class="l">Comparisons</div></div>' +
      '<div class="rp-kpi"><div class="n">' + fmtPct(a.strictRate) + '</div><div class="l">Strict</div></div>' +
      '<div class="rp-kpi"><div class="n">' + a.majorMismatchTotal + '</div><div class="l">Mismatches</div></div></div>' +
      '<div class="rp-callout"><strong>Headline.</strong> ' + (top.length ? E.escapeHtml(top[0].isolateId + ' · ' + top[0].finding.drugName + ' is ' + statusLabel(top[0].finding.status) + '. The leading hypothesis is “' + (top[0].finding.hypotheses[0] ? top[0].finding.hypotheses[0].title : 'unmeasured mechanism') + '”.') : 'No major discordance detected.') + '</div>' +
      '<table class="rp-table"><thead><tr><th>Isolate</th><th>Species</th><th>Genes</th><th>Tested</th><th>Strict</th><th>Class</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (mismatchRows ? '<div class="rp-section-title" style="margin-top:14px">Ranked discordances</div><table class="rp-table"><thead><tr><th>Isolate</th><th>Drug</th><th>Status</th><th>Pred / Obs</th><th>Leading hypothesis</th></tr></thead><tbody>' + mismatchRows + '</tbody></table>' : '') +
      '</div>';
  };

  AMR.Report = Rep;
})(window.AMR);
