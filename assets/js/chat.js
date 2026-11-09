/* =========================================================================
   AMR Prism — local, first-principles chat layer
   Parses questions, resolves isolates/genes/drugs, and returns two views:
   - textHtml: conversational answer
   - visualHtml: annotated charts / mechanism diagrams
   No network, no opaque model. Every answer is derived from the knowledge
   base, the imported evidence, and the reasoner's explicit inference chain.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const E = AMR.Engine;
  const KB = AMR.KB;
  const C = AMR.Charts;
  const R = AMR.Reasoner;
  const Chat = {};

  const esc = E.escapeHtml;

  /* ------------------------------------------------------------------ */
  /* small HTML helpers                                                  */
  /* ------------------------------------------------------------------ */
  function p(s) { return '<p>' + s + '</p>'; }
  function ul(items) {
    return '<ul>' + items.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
  }
  function code(s) { return '<span class="inline-code">' + esc(s) + '</span>'; }
  function strong(s) { return '<strong>' + esc(s) + '</strong>'; }

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
    const tone = sir === 'R' ? 'red' : sir === 'I' ? 'amber' : 'green';
    return '<span class="badge ' + tone + '">' + esc(sir) + '</span>';
  }
  function confBadge(c) {
    const tone = c >= 0.8 ? 'green' : c >= 0.6 ? 'amber' : 'outline';
    return '<span class="badge ' + tone + '">' + Math.round(c * 100) + '% ' + esc(R.confLabel(c)) + '</span>';
  }
  function chart(title, svg, note) {
    if (!svg) return '';
    return '<div class="chat-chart"><div class="chart-title">' + esc(title) + '</div>' + svg +
      (note ? '<div class="chat-caption">' + note + '</div>' : '') + '</div>';
  }
  function visualOnly(html) { return html || ''; }
  function table(headers, rows) {
    return '<div class="chat-table-wrap"><table class="chat-table"><thead><tr>' +
      headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------------ */
  /* context helpers                                                     */
  /* ------------------------------------------------------------------ */
  function analysisFor(ctx) {
    if (ctx && ctx.analysis) return ctx.analysis;
    if (ctx && ctx.dataset) return R.analyzeDataset(ctx.dataset);
    return null;
  }
  function isolateAnalysis(ctx, id) {
    const a = analysisFor(ctx);
    if (!a) return null;
    if (id) {
      const found = a.isolates.find(function (x) { return x.isolate.id.toLowerCase() === String(id).toLowerCase(); });
      if (found) return found;
    }
    if (ctx && ctx.isolateId && a.byId[ctx.isolateId]) return a.byId[ctx.isolateId];
    return a.isolates[0] || null;
  }
  function assessed(a) { return a.findings.filter(function (f) { return f.observed; }); }
  function statusCounts(a) {
    return [
      { key: 'concordant-r', label: 'Concordant R', value: a.counts['concordant-r'] || 0, color: KB.CONCORDANCE['concordant-r'].color },
      { key: 'concordant-s', label: 'Concordant S', value: a.counts['concordant-s'] || 0, color: KB.CONCORDANCE['concordant-s'].color },
      { key: 'partial', label: 'Partial', value: a.counts.partial || 0, color: KB.CONCORDANCE.partial.color },
      { key: 'silent', label: 'Silent determinant', value: a.counts.silent || 0, color: KB.CONCORDANCE.silent.color },
      { key: 'unexplained', label: 'Unexplained resistance', value: a.counts.unexplained || 0, color: KB.CONCORDANCE.unexplained.color }
    ].filter(function (s) { return s.value; });
  }
  function flowGroups(findings, limit) {
    return findings.slice(0, limit || 6).map(function (f) {
      const s = f.supports[0];
      return {
        gene: s ? s.display : 'No detected determinant',
        geneSub: s ? (s.family || s.mechanism || '') : 'database-limited',
        mechanism: s ? (s.mechanism || s.action || '') : 'Unknown / unmeasured mechanism',
        mechanismSub: s ? (s.action || '').slice(0, 52) : 'target mutation, porin, efflux, or uncharacterised',
        target: f.drugName,
        effectLabel: 'Predicted ' + f.predictedLabel + ' · observed ' + (f.observed || 'NT') + (f.observedMic ? ' (MIC ' + f.observedMic + ')' : ''),
        status: f.status,
        statusLabel: f.statusLabel,
        confidence: f.confidence
      };
    });
  }
  function flowSvg(findings, limit) {
    const groups = flowGroups(findings, limit || 6);
    if (!groups.length) return '';
    return C.flow(groups, { theme: 'dark', width: 760, rowH: 82 });
  }
  function evidenceSvg(f) {
    if (!f) return '';
    return C.evidenceChain(f, { theme: 'dark' });
  }
  function stackedRows(analysis) {
    const keys = ['Concordant R', 'Concordant S', 'Partial', 'Silent', 'Unexplained'];
    const colors = {
      'Concordant R': KB.CONCORDANCE['concordant-r'].color,
      'Concordant S': KB.CONCORDANCE['concordant-s'].color,
      'Partial': KB.CONCORDANCE.partial.color,
      'Silent': KB.CONCORDANCE.silent.color,
      'Unexplained': KB.CONCORDANCE.unexplained.color
    };
    const rows = analysis.isolates.map(function (a) {
      return {
        label: a.isolate.id,
        segments: [
          { key: 'Concordant R', value: a.counts['concordant-r'] || 0 },
          { key: 'Concordant S', value: a.counts['concordant-s'] || 0 },
          { key: 'Partial', value: a.counts.partial || 0 },
          { key: 'Silent', value: a.counts.silent || 0 },
          { key: 'Unexplained', value: a.counts.unexplained || 0 }
        ]
      };
    });
    return { rows: rows, keys: keys, colors: colors };
  }

  /* ------------------------------------------------------------------ */
  /* resolvers                                                           */
  /* ------------------------------------------------------------------ */
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function word(q, w) { return new RegExp('(^|[^a-z0-9])' + w + '([^a-z0-9]|$)', 'i').test(q); }

  function findIsolates(q, ctx) {
    const a = analysisFor(ctx);
    if (!a) return [];
    const ql = q.toLowerCase();
    const qn = ' ' + norm(q) + ' ';
    const out = [];
    a.isolates.forEach(function (x) {
      const id = x.isolate.id;
      const idl = id.toLowerCase();
      if (ql.indexOf(idl) >= 0 || qn.indexOf(' ' + norm(id) + ' ') >= 0) out.push(x);
    });
    // Common shorthand: "ec 2412", "kp2413"
    if (!out.length) {
      a.isolates.forEach(function (x) {
        const compact = norm(x.isolate.id).replace(/\s+/g, '');
        const qc = norm(q).replace(/\s+/g, '');
        if (qc.indexOf(compact) >= 0) out.push(x);
      });
    }
    return out.filter(function (x, i, arr) { return arr.indexOf(x) === i; });
  }

  function findDrugs(q) {
    const ql = String(q || '').toLowerCase();
    const hits = [];
    Object.keys(KB.DRUGS).forEach(function (id) {
      const d = KB.DRUGS[id];
      const names = [id, d.name, d.short].concat(d.aliases || []).map(function (x) { return String(x).toLowerCase(); });
      names.forEach(function (n) {
        if (n.length >= 4 && ql.indexOf(n) >= 0) hits.push({ id: id, weight: n.length });
      });
    });
    const direct = KB.normalizeDrug(q);
    if (direct) hits.push({ id: direct, weight: 100 });
    const seen = {};
    return hits.sort(function (a, b) { return b.weight - a.weight; }).filter(function (h) {
      if (seen[h.id]) return false;
      seen[h.id] = true;
      return true;
    }).map(function (h) { return h.id; });
  }

  function findClass(q) {
    const ql = String(q || '').toLowerCase();
    const map = [
      ['carbapenems', ['carbapenem', 'carbapenems', 'meropenem', 'imipenem', 'ertapenem']],
      ['cephalosporins', ['cephalosporin', 'cephalosporins', 'ceftriaxone', 'cefotaxime', 'ceftazidime', 'cefepime']],
      ['penicillins', ['penicillin', 'penicillins', 'ampicillin']],
      ['fluoroquinolones', ['fluoroquinolone', 'fluoroquinolones', 'quinolone', 'quinolones']],
      ['aminoglycosides', ['aminoglycoside', 'aminoglycosides']],
      ['tetracyclines', ['tetracycline', 'tetracyclines']],
      ['glycopeptides', ['glycopeptide', 'glycopeptides', 'vancomycin']],
      ['macrolides', ['macrolide', 'macrolides']],
      ['polymyxins', ['polymyxin', 'polymyxins', 'colistin']],
      ['folate', ['folate', 'sulfonamide', 'trimethoprim']],
      ['oxazolidinones', ['oxazolidinone', 'linezolid']],
      ['lipopeptides', ['lipopeptide', 'daptomycin']],
      ['phenicols', ['phenicol', 'chloramphenicol']]
    ];
    for (let i = 0; i < map.length; i++) {
      if (map[i][1].some(function (w) { return ql.indexOf(w) >= 0; })) return map[i][0];
    }
    return null;
  }

  function geneTokens(entry) {
    const out = [];
    // Only stable identifiers and family names. Descriptive display text contains
    // generic words ("resistance", "transferase") that would create false matches.
    [entry.id, entry.family].forEach(function (x) {
      if (!x) return;
      out.push(String(x).toLowerCase());
      String(x).split(/[^A-Za-z0-9-]+/).forEach(function (t) { if (t.length >= 3) out.push(t.toLowerCase()); });
    });
    (entry.exact || []).forEach(function (x) { out.push(String(x).toLowerCase()); });
    return E.uniq(out);
  }

  function tokenInQuery(ql, token) {
    const t = String(token || '').toLowerCase();
    if (!t) return false;
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + escaped + '($|[^a-z0-9])', 'i').test(ql);
  }
  function findGene(q, ctx) {
    const a = analysisFor(ctx);
    const ql = String(q || '').toLowerCase();
    const candidates = [];
    // exact symbols present in the dataset first
    if (a) {
      a.isolates.forEach(function (x) {
        x.determinants.forEach(function (d) {
          if (!d.gene) return;
          const sym = String(d.gene.symbol || '').toLowerCase();
          const bare = sym.replace(/^bla/, '');
          if (sym.length >= 3 && (tokenInQuery(ql, sym) || tokenInQuery(ql, bare))) {
            candidates.push({ entry: d.entry, symbol: d.gene.symbol, weight: sym.length + 5 });
          }
        });
      });
    }
    // knowledge-base names / families
    KB.GENE_ENTRIES.forEach(function (entry) {
      geneTokens(entry).forEach(function (t) {
        if (t.length >= 3 && tokenInQuery(ql, t)) candidates.push({ entry: entry, symbol: null, weight: t.length });
      });
    });
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return b.weight - a.weight; });
    return candidates[0];
  }

  function drugFindings(a, drugId) {
    return a.findings.filter(function (f) { return f.drug === drugId; });
  }

  /* ------------------------------------------------------------------ */
  /* answer builders                                                     */
  /* ------------------------------------------------------------------ */
  function answerOverview(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const ds = a.dataset;
    const topGenes = a.genePrevalence.slice(0, 6).map(function (g) { return code(g.display) + ' (' + g.count + ')'; }).join(', ');
    const teaching = a.topMismatches.slice(0, 3);
    let text = p('<strong>' + esc(ds.name) + '</strong> contains ' + strong(a.isolates.length) + ' isolates and ' +
      strong(a.assessedTotal) + ' drug–isolate comparisons. The strict concordance rate is ' +
      strong(E.pct(a.strictRate)) + '; the weighted rate is ' + strong(E.pct(a.weightedRate)) + '.') +
      p('The model finds <strong>' + a.majorMismatchTotal + '</strong> major mismatches: ' +
        (a.counts.silent || 0) + ' silent determinants and ' + (a.counts.unexplained || 0) + ' unexplained resistance results. ' +
        'Those are the cases where the genotype and phenotype disagree, so they carry the most teaching value.') +
      p('Most common determinants: ' + (topGenes || 'none detected') + '.') +
      ul([
        'MDR/XDR/PDR: ' + Object.keys(a.mdrSummary).filter(function (k) { return a.mdrSummary[k]; }).map(function (k) { return strong(a.mdrSummary[k] + ' ' + k); }).join(', '),
        'Species: ' + a.speciesDistribution.map(function (s) { return esc(s.label) + ' (' + s.count + ')'; }).join(', '),
        teaching.length ? 'Highest-value mismatch: ' + esc(teaching[0].isolateId) + ' · ' + esc(teaching[0].finding.drugName) + ' · ' + esc(teaching[0].finding.statusLabel) : ''
      ]);
    const visual = chart('Concordance profile', C.donut(statusCounts(a), {
      theme: 'dark', size: 190, centerValue: E.pct(a.strictRate), centerLabel: 'strict concordance'
    })) +
      chart('Resistance by drug class', C.bars(a.classResistance.slice(0, 9).map(function (c) {
        return { label: c.label, value: Math.round(c.rate * 100), color: c.color };
      }), { theme: 'dark', width: 470, valueFormat: function (v) { return v + '%'; }, labelChars: 22 })) +
      chart('Most prevalent determinants', C.bars(a.genePrevalence.slice(0, 10).map(function (g) {
        return { label: g.display, value: g.count, color: '#7dd3fc' };
      }), { theme: 'dark', width: 470, labelChars: 22 }));
    return {
      intent: 'overview', textHtml: text, visualHtml: visual,
      suggestions: ['Show the biggest mismatches', 'Which isolates are MDR or XDR?', 'Explain the silent KPC-2 in KP-2413', 'What should we test next?']
    };
  }

  function answerConcordance(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const c = a.counts;
    const rows = [
      ['Concordant R', c['concordant-r'], KB.CONCORDANCE['concordant-r'].desc],
      ['Concordant S', c['concordant-s'], KB.CONCORDANCE['concordant-s'].desc],
      ['Partial', c.partial, KB.CONCORDANCE.partial.desc],
      ['Silent determinant', c.silent, KB.CONCORDANCE.silent.desc],
      ['Unexplained resistance', c.unexplained, KB.CONCORDANCE.unexplained.desc]
    ].map(function (r) { return [r[0], '<strong>' + r[1] + '</strong>', esc(r[2])]; });
    const worst = a.isolates.slice().sort(function (x, y) {
      return (y.majorRate || 0) - (x.majorRate || 0);
    }).slice(0, 5);
    const text = p('Across <strong>' + a.assessedTotal + '</strong> assessed comparisons, the strict concordance rate is <strong>' +
      E.pct(a.strictRate) + '</strong>. The weighted rate, which gives half credit to R/I partial calls, is <strong>' +
      E.pct(a.weightedRate) + '</strong>. Major mismatches account for <strong>' + E.pct(a.majorRate) + '</strong>.') +
      table(['Category', 'Count', 'What it means'], rows) +
      p('Isolates with the largest mismatch burden: ' + worst.map(function (x) {
        return code(x.isolate.id) + ' (' + E.pct(x.majorRate) + ')';
      }).join(', ') + '.') +
      p('Concordance is not a score to maximise. It is a diagnostic of the model: agreement supports the mechanism, while disagreement points to a missing premise such as expression, permeability, a target mutation, or an unmeasured determinant.');
    const sr = stackedRows(a);
    const visual = chart('Concordance composition', C.donut(statusCounts(a), {
      theme: 'dark', size: 190, centerValue: E.pct(a.strictRate), centerLabel: 'strict'
    })) +
      chart('Per-isolate comparison mix', C.stackedBars(sr.rows, {
        theme: 'dark', width: 620, keys: sr.keys, colors: sr.colors, rowH: 26
      }), 'Bar length = assessed comparisons; colours = concordance status.');
    return {
      intent: 'concordance', textHtml: text, visualHtml: visual,
      suggestions: ['Show only the mismatches', 'Which isolate has the most silent determinants?', 'Explain concordance from first principles']
    };
  }

  function answerMismatch(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const list = a.topMismatches.slice(0, 8);
    if (!list.length) {
      return {
        intent: 'mismatch', textHtml: p('No silent or unexplained mismatches are present in this dataset. Every assessed resistance phenotype is explained by a detected mechanism, and no detected mechanism predicts resistance without an observed resistance phenotype.'),
        visualHtml: chart('Concordance composition', C.donut(statusCounts(a), { theme: 'dark', size: 190, centerValue: E.pct(a.strictRate), centerLabel: 'strict' })),
        suggestions: ['Summarize the cohort', 'Show concordance']
      };
    }
    let text = p('The model ranks mismatches by evidence strength. Each one is an invitation to find the missing premise, not a reason to distrust either assay.') + ul(list.map(function (m) {
      const f = m.finding;
      const h = f.hypotheses && f.hypotheses[0];
      return code(m.isolateId) + ' · <strong>' + esc(f.drugName) + '</strong> · ' + statusBadge(f.status) +
        ' — ' + esc(f.statusLabel) + '. Predicted ' + esc(f.predictedLabel) + ', observed ' + esc(f.observed) +
        (f.observedMic ? ' (MIC ' + esc(f.observedMic) + ')' : '') + '.' +
        (h ? ' Most likely next explanation: <em>' + esc(h.title) + '</em> (' + h.probability + '%). Next test: ' + esc(h.next) : '');
    }));
    text += p('A silent determinant means the gene is present but the phenotype is susceptible; an unexplained resistance means the phenotype is resistant but the current evidence set has no valid mechanism. Both are expected when the assay panel, database, or expression layer is incomplete.');
    const findings = list.map(function (m) { return m.finding; });
    const visual = chart('Mismatch mechanism map', flowSvg(findings, 6)) +
      chart('Mismatch types', C.donut([
        { label: 'Silent determinant', value: a.counts.silent || 0, color: KB.CONCORDANCE.silent.color },
        { label: 'Unexplained resistance', value: a.counts.unexplained || 0, color: KB.CONCORDANCE.unexplained.color },
        { label: 'Partial R/I', value: a.counts.partial || 0, color: KB.CONCORDANCE.partial.color }
      ], { theme: 'dark', size: 190, centerValue: (a.counts.silent || 0) + (a.counts.unexplained || 0), centerLabel: 'major mismatches' }));
    return {
      intent: 'mismatch', textHtml: text, visualHtml: visual,
      suggestions: ['Explain the EC-2412 carbapenem result', 'Why is KPC-2 silent in KP-2413?', 'What should we test next?']
    };
  }

  function answerMdr(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const groups = {};
    a.isolates.forEach(function (x) { (groups[x.mdrClass] = groups[x.mdrClass] || []).push(x); });
    let text = p('MDR/XDR/PDR is assigned from the tested drug categories, not from the number of genes. The classifier needs at least three tested categories; XDR and PDR require a broad panel (eight or more categories).') +
      ul(Object.keys(groups).map(function (k) {
        return '<strong>' + esc(k) + '</strong> (' + groups[k].length + '): ' + groups[k].map(function (x) {
          return code(x.isolate.id) + ' ' + esc(E.speciesInfo(x.isolate.species).short);
        }).join(', ');
      }));
    text += p('The category counts are ' + Object.keys(a.mdrSummary).map(function (k) {
      return strong(a.mdrSummary[k] + ' ' + k);
    }).join(', ') + '.');
    const visual = chart('MDR classification', C.donut(Object.keys(a.mdrSummary).filter(function (k) {
      return a.mdrSummary[k];
    }).map(function (k) {
      const color = k === 'PDR' ? '#ff6b78' : k === 'XDR' ? '#fb7185' : k === 'MDR' ? '#f5b84b' : k === 'Non-MDR' ? '#4ade80' : '#647f96';
      return { label: k, value: a.mdrSummary[k], color: color };
    }), { theme: 'dark', size: 190, centerValue: a.isolates.length, centerLabel: 'isolates' })) +
      chart('Non-susceptible categories per isolate', C.bars(a.isolates.slice().sort(function (x, y) {
        return (y.nonSusCatCount || 0) - (x.nonSusCatCount || 0);
      }).slice(0, 12).map(function (x) {
        return { label: x.isolate.id, value: x.nonSusCatCount || 0, color: x.mdrClass === 'PDR' ? '#ff6b78' : x.mdrClass === 'XDR' ? '#fb7185' : x.mdrClass === 'MDR' ? '#f5b84b' : '#4ade80' };
      }), { theme: 'dark', width: 470, labelChars: 14 }));
    return {
      intent: 'mdr', textHtml: text, visualHtml: visual,
      suggestions: ['Show the XDR isolates in detail', 'Which resistance classes are missing from the panel?', 'Summarize the cohort']
    };
  }

  function answerIsolate(ctx, ia) {
    if (!ia) return noData();
    const iso = ia.isolate;
    const mism = ia.topMismatches.slice(0, 3);
    const explained = ia.topExplained.slice(0, 3);
    let text = p('<strong>' + esc(iso.id) + '</strong> · <em>' + esc(E.speciesInfo(iso.species).label) + '</em> · ' +
      esc(iso.source || 'source not recorded') + (iso.collectionDate ? ' · ' + esc(iso.collectionDate) : '') + '. ' +
      'Classification: ' + strong(ia.mdrClass) + '.') +
      p('The isolate carries <strong>' + ia.geneCount + '</strong> resolved determinant(s) and has <strong>' +
        ia.phenotypeCount + '</strong> assessed drug comparisons. Strict concordance is <strong>' + E.pct(ia.strictRate) +
        '</strong>; major mismatch rate is <strong>' + E.pct(ia.majorRate) + '</strong>.');
    if (iso.genes.length) {
      text += p('Detected determinants: ' + iso.genes.slice(0, 12).map(function (g) {
        return code(g.symbol) + (g.coverage != null && g.coverage < 95 ? ' (' + E.fmt(g.coverage, 0) + '% coverage)' : '');
      }).join(', ') + (iso.genes.length > 12 ? ' …' : '') + '.');
    }
    if (mism.length) {
      text += p('<strong>Where the model disagrees with the phenotype:</strong>') + ul(mism.map(function (f) {
        const h = f.hypotheses && f.hypotheses[0];
        return esc(f.drugName) + ' — ' + statusBadge(f.status) + ' predicted ' + esc(f.predictedLabel) + ', observed ' + esc(f.observed) +
          (h ? '. Leading hypothesis: ' + esc(h.title) + ' (' + h.probability + '%). Next test: ' + esc(h.next) : '');
      }));
    }
    if (explained.length) {
      text += p('<strong>Best-supported explanations:</strong> ' + explained.map(function (f) {
        return esc(f.drugName) + ' (' + esc(f.supports[0] ? f.supports[0].display : 'mechanism') + ')';
      }).join('; ') + '.');
    }
    const anchor = mism[0] || explained[0] || ia.findings.filter(function (f) { return f.observed; })[0];
    if (anchor) {
      text += '<div class="chat-callout"><strong>First-principles trace · ' + esc(anchor.drugName) + '</strong>' +
        ul(anchor.chain.map(function (s) { return '<strong>' + esc(s.label) + ':</strong> ' + esc(s.text); })) + '</div>';
    }
    const visualFindings = ia.findings.filter(function (f) { return f.supports.length && f.observed; })
      .sort(function (x, y) { return y.confidence - x.confidence; });
    let visual = '';
    if (visualFindings.length) visual += chart('Mechanism map · ' + iso.id, flowSvg(visualFindings, 7));
    if (anchor) visual += chart('Evidence chain · ' + anchor.drugName, evidenceSvg(anchor));
    if (!visual) visual = chart('Concordance composition', C.donut(statusCounts(ia), { theme: 'dark', size: 190, centerValue: E.pct(ia.strictRate), centerLabel: 'strict' }));
    return {
      intent: 'isolate', textHtml: text, visualHtml: visual,
      suggestions: [
        mism[0] ? 'Why is ' + iso.id + ' resistant to ' + mism[0].drugName + '?' : 'Explain ' + iso.id + ' from first principles',
        'Show all genes in ' + iso.id,
        'What should we test next for ' + iso.id + '?'
      ]
    };
  }

  function answerIsolateDrug(ctx, ia, drugId) {
    if (!ia) return noData();
    const drug = E.drugInfo(drugId);
    const f = ia.findings.find(function (x) { return x.drug === drugId; });
    if (!f) {
      const dets = ia.determinants.filter(function (d) {
        return d.effects && Object.prototype.hasOwnProperty.call(d.effects, drug.class);
      });
      return {
        intent: 'isolate-drug',
        textHtml: p('<strong>' + esc(ia.isolate.id) + '</strong> has no phenotype or prediction for <strong>' + esc(drug.name) +
          '</strong>. ' + (dets.length ? 'It does carry ' + dets.map(function (d) { return code(d.display); }).join(', ') +
            ', which can affect the ' + esc(E.classInfo(drug.class).label.toLowerCase()) + ' class; add an AST result to test the prediction.' :
            'No detected determinant in the current evidence set maps to this drug class.')),
        visualHtml: dets.length ? chart('Potential mechanism map', flowSvg(dets.map(function (d) {
          return {
            supports: [{ display: d.display, mechanism: d.mechanism, action: d.action, family: d.family }],
            drugName: drug.name, predictedLabel: 'untested', observed: null, status: 'untested', statusLabel: 'Not tested', confidence: d.confidence
          };
        }), 5)) : '',
        suggestions: ['Show all findings for ' + ia.isolate.id, 'Which drugs were tested for ' + ia.isolate.id + '?']
      };
    }
    let text = p('<strong>' + esc(ia.isolate.id) + ' · ' + esc(drug.name) + '</strong> is ' +
      (f.observed ? sirBadge(f.observed) + ' with MIC ' + esc(f.observedMic || 'not reported') + ' mg/L' : 'not tested') +
      '. The model predicts ' + strong(f.predictedLabel) + ' and classifies the comparison as ' + statusBadge(f.status) + '. ' +
      'Confidence is ' + confBadge(f.confidence) + '.');
    if (f.supports.length) {
      text += p('Mechanistic support: ' + f.supports.map(function (s) {
        return code(s.display) + ' — ' + esc(s.mechanism || s.action || '') +
          (s.coverage != null ? ' (' + E.fmt(s.coverage, 0) + '% coverage)' : '');
      }).join('; ') + '.');
    } else {
      text += p('No detected determinant has a valid biochemical path to this drug. The prediction is therefore susceptibility by default, with low confidence because absence of evidence is not evidence of absence.');
    }
    text += '<div class="chat-callout"><strong>Reasoning chain</strong>' + ul(f.chain.map(function (s) {
      return '<strong>' + esc(s.label) + ':</strong> ' + esc(s.text);
    })) + '</div>';
    if (f.hypotheses && f.hypotheses.length) {
      text += p('<strong>If the prediction and phenotype disagree, the ranked explanations are:</strong>') +
        ul(f.hypotheses.slice(0, 4).map(function (h) {
          return '<strong>' + esc(h.title) + '</strong> (' + h.probability + '%) — ' + esc(h.why) + ' <em>Next test: ' + esc(h.next) + '</em>';
        }));
    }
    const visual = chart('Evidence chain · ' + ia.isolate.id + ' / ' + drug.name, evidenceSvg(f)) +
      (f.supports.length ? chart('Mechanism map', flowSvg([f], 1)) : '');
    return {
      intent: 'isolate-drug', textHtml: text, visualHtml: visual,
      suggestions: ['What should we test next for ' + ia.isolate.id + '?', 'Show all mismatches for ' + ia.isolate.id, 'Explain the mechanism from first principles']
    };
  }

  function answerIsolateClass(ctx, ia, cls) {
    if (!ia || !cls) return noData();
    const info = E.classInfo(cls);
    const findings = ia.findings.filter(function (f) { return f.drugClass === cls && f.observed; });
    if (!findings.length) return answerIsolate(ctx, ia);
    const mism = findings.filter(function (f) { return f.status !== 'concordant-r' && f.status !== 'concordant-s'; });
    const focus = mism.length ? mism : findings;
    let text = p('<strong>' + esc(ia.isolate.id) + ' · ' + esc(info.label) + '</strong>: ' +
      findings.length + ' tested drug(s) in this class. ' +
      (mism.length ? '<strong>' + mism.length + '</strong> comparison(s) are not fully concordant.' :
        'All tested comparisons are concordant with the detected mechanisms.'));
    if (mism.length) {
      text += p('<strong>Where the model and phenotype diverge:</strong>') + ul(mism.map(function (f) {
        const h = f.hypotheses && f.hypotheses[0];
        return '<strong>' + esc(f.drugName) + '</strong> — observed ' + sirBadge(f.observed) + ', predicted ' +
          esc(f.predictedLabel) + ' · ' + statusBadge(f.status) +
          (h ? '. Leading hypothesis: ' + esc(h.title) + ' (' + h.probability + '%). Next test: ' + esc(h.next) : '');
      }));
    } else {
      text += p('The class-level pattern is explained by: ' + E.uniq(findings.reduce(function (acc, f) {
        return acc.concat(f.supports.map(function (s) { return s.display; }));
      }, [])).map(function (s) { return code(s); }).join(', ') + '.');
    }
    const anchor = focus[0];
    if (anchor) {
      text += '<div class="chat-callout"><strong>First-principles trace · ' + esc(anchor.drugName) + '</strong>' +
        ul(anchor.chain.map(function (s) { return '<strong>' + esc(s.label) + ':</strong> ' + esc(s.text); })) + '</div>';
    }
    let visual = chart('Class evidence map · ' + esc(info.label), flowSvg(focus, 6));
    if (anchor) visual += chart('Evidence chain · ' + esc(anchor.drugName), evidenceSvg(anchor));
    return {
      intent: 'isolate-class', textHtml: text, visualHtml: visual,
      suggestions: [
        anchor ? 'Why is ' + ia.isolate.id + ' resistant to ' + anchor.drugName + '?' : 'Explain ' + ia.isolate.id,
        'Show all mismatches for ' + ia.isolate.id,
        'What should we test next for ' + ia.isolate.id + '?'
      ]
    };
  }

  function answerIsolateGene(ctx, ia, gene) {
    if (!ia || !gene) return noData();
    const entry = gene.entry;
    const symbol = gene.symbol || (ia.isolate.genes.find(function (g) { return KB.resolveGene(g.symbol, g) === entry; }) || {}).symbol || entry.display;
    const det = ia.determinants.find(function (d) { return d.entry === entry || d.id === entry.id; });
    const affected = ia.findings.filter(function (f) { return f.supports.some(function (s) { return s.key && det && s.key === det.key; }); });
    let text = p('<strong>' + esc(symbol) + '</strong> in <strong>' + esc(ia.isolate.id) + '</strong> resolves to ' +
      strong(entry.display) + ' — ' + esc(entry.mechanism || entry.family) + '. ' + esc(entry.action || ''));
    if (det) {
      text += p('Evidence: ' + (det.identity != null ? E.fmt(det.identity, 1) + '% identity, ' : '') +
        (det.coverage != null ? E.fmt(det.coverage, 0) + '% coverage, ' : '') +
        'source ' + esc(det.source || 'imported evidence') + '. Derived confidence: ' + confBadge(det.confidence) + '.');
      text += p('Expected class effects: ' + Object.keys(det.effects || {}).map(function (k) {
        return esc(E.classInfo(k).label) + ' → ' + esc(det.effects[k]);
      }).join('; ') + '.');
    }
    if (affected.length) {
      text += p('Drug-level consequences in this isolate:') + ul(affected.slice(0, 8).map(function (f) {
        return esc(f.drugName) + ' — predicted ' + esc(f.predictedLabel) + ', observed ' + esc(f.observed || 'NT') + ' · ' + statusBadge(f.status);
      }));
    } else {
      text += p('No tested drug in this isolate is directly affected by this determinant. That can be a silent or untested mechanism rather than a contradiction.');
    }
    if (entry.caveats) text += p('<strong>Caveat:</strong> ' + esc(entry.caveats));
    const visual = affected.length ? chart('Gene → mechanism → phenotype', flowSvg(affected, 6)) : chart('Concordance composition', C.donut(statusCounts(ia), { theme: 'dark', size: 190, centerValue: E.pct(ia.strictRate), centerLabel: 'strict' }));
    return {
      intent: 'isolate-gene', textHtml: text, visualHtml: visual,
      suggestions: ['Show all genes in ' + ia.isolate.id, 'Why is ' + ia.isolate.id + ' resistant to ' + (affected[0] ? affected[0].drugName : 'meropenem') + '?']
    };
  }

  function answerGene(ctx, gene) {
    const a = analysisFor(ctx);
    if (!a || !gene) return noData();
    const entry = gene.entry;
    const carriers = [];
    a.isolates.forEach(function (ia) {
      const hit = ia.determinants.find(function (d) { return d.entry === entry || d.id === entry.id; });
      if (hit) carriers.push({ ia: ia, det: hit });
    });
    const affected = [];
    a.isolates.forEach(function (ia) {
      ia.findings.forEach(function (f) {
        if (f.supports.some(function (s) { return carriers.some(function (c) { return c.ia === ia && c.det.key === s.key; }); })) affected.push(f);
      });
    });
    let text = p('<strong>' + esc(entry.display) + '</strong> is a ' + esc(entry.mechanism || entry.family) + ' determinant. ' +
      esc(entry.action || '') + ' The knowledge base assigns it ' + strong(E.pct(entry.confidence, 0)) + ' baseline confidence.');
    text += p('In this dataset it is carried by <strong>' + carriers.length + '</strong> isolate(s)' +
      (carriers.length ? ': ' + carriers.map(function (c) { return code(c.ia.isolate.id); }).join(', ') : '') + '.');
    if (entry.effects && Object.keys(entry.effects).length) {
      text += p('Expected effect by class: ' + Object.keys(entry.effects).map(function (k) {
        return esc(E.classInfo(k).label) + ' → ' + strong(entry.effects[k]);
      }).join('; ') + '.');
    }
    if (affected.length) {
      const statuses = {};
      affected.forEach(function (f) { statuses[f.status] = (statuses[f.status] || 0) + 1; });
      text += p('Across the dataset, this mechanism participates in <strong>' + affected.length + '</strong> drug comparisons: ' +
        Object.keys(statuses).map(function (k) { return strong(statuses[k] + ' ' + (KB.CONCORDANCE[k] ? KB.CONCORDANCE[k].label : k)); }).join(', ') + '.');
    }
    if (entry.caveats) text += p('<strong>Caveat:</strong> ' + esc(entry.caveats));
    text += p('<strong>First-principles logic:</strong> detection proves the sequence is present, not that it is expressed. The prediction follows only if the enzyme is transcribed, correctly folded, and reaches its substrate; species context and permeability determine whether the effect is visible.');
    const visual = affected.length ? chart('Mechanism map · ' + entry.display, flowSvg(affected.slice(0, 7), 7)) :
      chart('Carrier count', C.bars(carriers.map(function (c) { return { label: c.ia.isolate.id, value: 1, color: '#7dd3fc' }; }), { theme: 'dark', width: 460, valueFormat: function () { return 'carrier'; } }));
    return {
      intent: 'gene', textHtml: text, visualHtml: visual,
      suggestions: ['Which isolates carry ' + entry.display + '?', 'Explain the mechanism from first principles', 'Show the biggest mismatches']
    };
  }

  function answerDrug(ctx, drugId) {
    const a = analysisFor(ctx);
    if (!a || !drugId) return noData();
    const drug = E.drugInfo(drugId);
    const findings = [];
    a.isolates.forEach(function (ia) {
      const f = ia.findings.find(function (x) { return x.drug === drugId && x.observed; });
      if (f) findings.push({ ia: ia, f: f });
    });
    const r = findings.filter(function (x) { return x.f.observed === 'R'; }).length;
    const i = findings.filter(function (x) { return x.f.observed === 'I'; }).length;
    const s = findings.filter(function (x) { return x.f.observed === 'S'; }).length;
    const mismatches = findings.filter(function (x) { return ['silent', 'unexplained', 'partial'].indexOf(x.f.status) >= 0; });
    let text = p('<strong>' + esc(drug.name) + '</strong> belongs to the ' + esc(E.classInfo(drug.class).label) + ' class. ' +
      'In this dataset it was tested against <strong>' + findings.length + '</strong> isolate(s): ' + r + ' R, ' + i + ' I, ' + s + ' S. ' +
      (findings.length ? 'Non-susceptibility is <strong>' + E.pct((r + i) / findings.length) + '</strong>.' : 'No AST results are available.'));
    if (drug.bp) {
      text += p('Illustrative breakpoints in the knowledge base: ' + Object.keys(drug.bp).map(function (g) {
        return esc(g.toUpperCase()) + ' S ≤ ' + drug.bp[g].s + ' / R ≥ ' + drug.bp[g].r + ' mg/L';
      }).join('; ') + '. Verify local breakpoints before clinical use.');
    }
    if (findings.length) {
      text += table(['Isolate', 'MIC', 'Observed', 'Predicted', 'Status'], findings.slice(0, 12).map(function (x) {
        return [code(x.ia.isolate.id), esc(x.f.observedMic || '—'), sirBadge(x.f.observed), esc(x.f.predictedLabel), statusBadge(x.f.status)];
      }));
    }
    if (mismatches.length) {
      text += p('<strong>Where the drug result is not fully explained:</strong>') + ul(mismatches.slice(0, 5).map(function (x) {
        const h = x.f.hypotheses && x.f.hypotheses[0];
        return code(x.ia.isolate.id) + ' — ' + statusBadge(x.f.status) + (h ? '. ' + esc(h.title) + '. Next: ' + esc(h.next) : '');
      }));
    }
    const visual = findings.length ? chart('Drug-level mechanism map', flowSvg(findings.slice(0, 7).map(function (x) { return x.f; }), 7)) +
      chart('Observed distribution', C.donut([
        { label: 'Resistant', value: r, color: '#ff6b78' },
        { label: 'Intermediate', value: i, color: '#f5b84b' },
        { label: 'Susceptible', value: s, color: '#4ade80' }
      ], { theme: 'dark', size: 180, centerValue: findings.length, centerLabel: 'tested' })) : '';
    return {
      intent: 'drug', textHtml: text, visualHtml: visual,
      suggestions: ['Which genes explain ' + drug.name + ' resistance?', 'Show the mismatches for ' + drug.name, 'Summarize the cohort']
    };
  }

  function answerCompare(ctx, list) {
    if (list.length < 2) return noData();
    const x = list[0], y = list[1];
    const gx = {}, gy = {};
    x.determinants.forEach(function (d) { gx[d.id] = d.display; });
    y.determinants.forEach(function (d) { gy[d.id] = d.display; });
    const shared = Object.keys(gx).filter(function (k) { return gy[k]; });
    const onlyX = Object.keys(gx).filter(function (k) { return !gy[k]; });
    const onlyY = Object.keys(gy).filter(function (k) { return !gx[k]; });
    const text = p('<strong>' + esc(x.isolate.id) + '</strong> (' + esc(E.speciesInfo(x.isolate.species).short) + ', ' + esc(x.mdrClass) + ') versus <strong>' +
      esc(y.isolate.id) + '</strong> (' + esc(E.speciesInfo(y.isolate.species).short) + ', ' + esc(y.mdrClass) + ').') +
      p('Strict concordance: ' + code(x.isolate.id) + ' ' + E.pct(x.strictRate) + ', ' + code(y.isolate.id) + ' ' + E.pct(y.strictRate) + '. ' +
        'Major mismatch rate: ' + E.pct(x.majorRate) + ' versus ' + E.pct(y.majorRate) + '.') +
      ul([
        'Shared determinants: ' + (shared.length ? shared.map(function (k) { return code(gx[k]); }).join(', ') : 'none'),
        'Only ' + code(x.isolate.id) + ': ' + (onlyX.length ? onlyX.map(function (k) { return code(gx[k]); }).join(', ') : 'none'),
        'Only ' + code(y.isolate.id) + ': ' + (onlyY.length ? onlyY.map(function (k) { return code(gy[k]); }).join(', ') : 'none')
      ]) +
      p('The comparison is most useful where the same drug was tested in both isolates. Differences in species, permeability, and expression can make the same gene produce different phenotypes, so compare the reasoning chain rather than only the gene list.');
    const sr = stackedRows({ isolates: [x, y] });
    const visual = chart('Comparison of comparison mix', C.stackedBars(sr.rows, {
      theme: 'dark', width: 560, keys: sr.keys, colors: sr.colors, rowH: 34
    })) +
      chart('Mechanism map · ' + x.isolate.id, flowSvg(x.findings.filter(function (f) { return f.supports.length && f.observed; }), 4)) +
      chart('Mechanism map · ' + y.isolate.id, flowSvg(y.findings.filter(function (f) { return f.supports.length && f.observed; }), 4));
    return {
      intent: 'compare', textHtml: text, visualHtml: visual,
      suggestions: ['Explain ' + x.isolate.id, 'Explain ' + y.isolate.id, 'Show the biggest mismatches']
    };
  }

  function answerNextTest(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const list = a.topMismatches.slice(0, 6);
    if (!list.length) {
      return { intent: 'next-test', textHtml: p('There are no major mismatches to chase in this dataset. The next step is prospective validation: confirm that the knowledge-base breakpoints match your local method, and add isolates that stress the model with target mutations, porin loss, and uncharacterised mechanisms.'), visualHtml: '', suggestions: ['Summarize the cohort', 'Explain concordance from first principles'] };
    }
    let text = p('The next test should discriminate between the leading hypotheses, not simply repeat the same assay. These are ranked by the evidence gap and the actionability of the answer.') +
      ul(list.map(function (m) {
        const f = m.finding;
        const h = f.hypotheses && f.hypotheses[0];
        return code(m.isolateId) + ' · <strong>' + esc(f.drugName) + '</strong> (' + esc(f.statusLabel) + '): ' +
          (h ? esc(h.title) + '. <em>' + esc(h.next) + '</em>' : 'Repeat the reference AST and review the full resistance profile.');
      }));
    text += p('For a silent determinant, the discriminating test is expression or allele integrity. For unexplained resistance, it is a broader search for target mutation, porin loss, efflux, or an uncharacterised enzyme. For a partial call, it is a reference MIC near the breakpoint.');
    return {
      intent: 'next-test', textHtml: text,
      visualHtml: chart('Evidence gaps and next tests', flowSvg(list.map(function (m) { return m.finding; }), 6)),
      suggestions: ['Explain the EC-2412 carbapenem result', 'Why is KPC-2 silent in KP-2413?', 'Show the biggest mismatches']
    };
  }

  function answerCarbapenem(ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const findings = [];
    a.isolates.forEach(function (ia) {
      ia.findings.forEach(function (f) {
        if ((f.drugClass === 'carbapenems' || f.drugClass === 'carb_inhibitor') && f.observed) findings.push({ ia: ia, f: f });
      });
    });
    const r = findings.filter(function (x) { return x.f.observed === 'R'; });
    const mism = findings.filter(function (x) { return ['silent', 'unexplained', 'partial'].indexOf(x.f.status) >= 0; });
    const mechanisms = {};
    r.forEach(function (x) {
      x.f.supports.forEach(function (s) { mechanisms[s.display] = (mechanisms[s.display] || 0) + 1; });
    });
    let text = p('Carbapenem results are the hardest test of a genotype–phenotype model because resistance can arise from an enzyme, porin loss, efflux, or a combination. In this dataset, <strong>' +
      r.length + '/' + findings.length + '</strong> carbapenem comparisons are resistant and <strong>' + mism.length + '</strong> are not fully explained.') +
      p('Detected mechanisms in resistant comparisons: ' + (Object.keys(mechanisms).length ? Object.keys(mechanisms).map(function (k) {
        return code(k) + ' (' + mechanisms[k] + ')';
      }).join(', ') : 'none — the resistance is unexplained by the current evidence set') + '.') +
      p('The key distinction is enzyme activity versus access. A carbapenemase directly hydrolyses the drug; porin loss and efflux reduce the amount reaching the periplasmic target. The same MIC can therefore have different molecular meanings, and the next test must separate them.');
    if (mism.length) {
      text += p('<strong>Carbapenem mismatches:</strong>') + ul(mism.slice(0, 6).map(function (x) {
        const h = x.f.hypotheses && x.f.hypotheses[0];
        return code(x.ia.isolate.id) + ' · ' + esc(x.f.drugName) + ' — ' + statusBadge(x.f.status) + (h ? '. ' + esc(h.title) + '. Next: ' + esc(h.next) : '');
      }));
    }
    return {
      intent: 'carbapenem', textHtml: text,
      visualHtml: chart('Carbapenem mechanism map', flowSvg(findings.map(function (x) { return x.f; }).slice(0, 7), 7)),
      suggestions: ['Explain the EC-2412 carbapenem result', 'Why is KPC-2 silent in KP-2413?', 'What should we test next?']
    };
  }

  function answerMechanisms(ctx) {
    const a = analysisFor(ctx);
    const sample = a ? a.isolates.reduce(function (acc, ia) {
      if (acc) return acc;
      const f = ia.findings.find(function (x) { return x.supports.length && x.observed; });
      return f || null;
    }, null) : null;
    const text = p('AMR Prism does not ask a model to guess. It walks an explicit chain: <strong>premise → biochemical action → drug effect → prediction → phenotype comparison</strong>.') +
      ul([
        'Premise 1: the molecular evidence. What was detected, at what identity and coverage, and from which source?',
        'Premise 2: the biochemical action. Does the determinant hydrolyse, modify, protect, or bypass the drug target?',
        'Premise 3: the drug context. Is the drug a substrate, and does the species/breakpoint context permit the effect?',
        'Inference: the expected phenotype, with a confidence derived from evidence strength and phenotype reliability.',
        'Observation: the reported MIC/SIR. The comparison is labelled concordant, partial, silent, or unexplained.',
        'Falsification: for every disagreement, the reasoner ranks alternative mechanisms and names the next discriminating test.'
      ]) +
      p('The eight axioms encode the limits of the method: presence is not expression, absence of evidence is not evidence of absence, phenotype is the integrated output, and every conclusion must carry its uncertainty.') +
      (sample ? p('<strong>Worked example · ' + esc(sample.drugName) + ':</strong>') + ul(sample.chain.map(function (s) {
        return '<strong>' + esc(s.label) + ':</strong> ' + esc(s.text);
      })) : '');
    return {
      intent: 'mechanisms', textHtml: text,
      visualHtml: sample ? chart('Worked evidence chain', evidenceSvg(sample)) : chart('The reasoning loop', C.flow([
        { gene: 'Detected determinant', geneSub: 'sequence evidence', mechanism: 'Biochemical action', mechanismSub: 'hydrolysis / protection / bypass', target: 'Drug class', effectLabel: 'Predicted effect', status: 'concordant-r', statusLabel: 'Infer', confidence: 0.9 },
        { gene: 'Observed phenotype', geneSub: 'MIC / SIR', mechanism: 'Comparison', mechanismSub: 'concordance or gap', target: 'Uncertainty', effectLabel: 'Rank alternatives', status: 'partial', statusLabel: 'Test', confidence: 0.7 }
      ], { theme: 'dark', width: 760, rowH: 82 })),
      suggestions: ['Show the axioms', 'Show the biggest mismatches', 'Explain the silent KPC-2 in KP-2413']
    };
  }

  function answerHelp(ctx) {
    const text = p('I reason over the imported AMRFinderPlus evidence, the AST phenotypes, and the built-in mechanism knowledge base. I can answer questions about the whole cohort or a single isolate, and I can switch between a conversational answer and an annotated visual explanation.') +
      ul([
        'Cohort: “Summarize the cohort”, “Show concordance”, “Show the biggest mismatches”, “Which isolates are MDR?”',
        'Isolate: “Explain EC-2412”, “Why is KP-2413 resistant to ceftriaxone?”, “Show all genes in PA-2409”',
        'Mechanism: “Explain CTX-M-15 from first principles”, “How does KPC-2 work?”, “What is the difference between an enzyme and porin loss?”',
        'Next step: “What should we test next?”, “Which carbapenem results are unexplained?”',
        'Comparison: “Compare EC-2401 and KP-2413”'
      ]) +
      p('Every answer is local and deterministic. The model is a transparent rule engine, not a black box, and the confidence labels are derived from evidence strength rather than invented certainty.');
    return {
      intent: 'help', textHtml: text,
      visualHtml: chart('What the reasoner compares', C.flow([
        { gene: 'AMRFinderPlus determinants', geneSub: 'identity · coverage · source', mechanism: 'Mechanism knowledge base', mechanismSub: 'action → class effects', target: 'AST phenotype', effectLabel: 'MIC / SIR', status: 'concordant-r', statusLabel: 'Compare', confidence: 0.9 },
        { gene: 'Discordance', geneSub: 'silent · unexplained · partial', mechanism: 'Hypothesis ranking', mechanismSub: 'expression · access · target · error', target: 'Next test', effectLabel: 'Discriminating assay', status: 'unexplained', statusLabel: 'Explain', confidence: 0.7 }
      ], { theme: 'dark', width: 760, rowH: 82 })),
      suggestions: ['Summarize the cohort', 'Show the biggest mismatches', 'Explain the reasoning method']
    };
  }

  function noData() {
    return {
      intent: 'no-data',
      textHtml: p('There is no dataset loaded yet. Import an AMRFinderPlus table, an AST table, or a narrative, or load the synthetic demo cohort to begin.') +
        p('The app accepts TSV/CSV, long- or wide-format AST tables, free-text isolate narratives, and images. Everything stays in your browser.'),
      visualHtml: '',
      suggestions: ['Load the demo cohort', 'How do I import data?']
    };
  }

  /* ------------------------------------------------------------------ */
  /* intent routing                                                      */
  /* ------------------------------------------------------------------ */
  Chat.respond = function (query, ctx) {
    const q = String(query == null ? '' : query).trim();
    const ql = q.toLowerCase();
    try {
      const a = analysisFor(ctx);
      if (!a || !a.isolates.length) {
        if (/demo|example|sample/i.test(q)) {
          return {
            intent: 'load-demo',
            textHtml: p('Use the <strong>Import data</strong> view and choose <strong>Load demo cohort</strong>. The demo contains 13 synthetic isolates designed to exercise ESBL, KPC, MBL, OXA-23, MRSA, VRE, mcr-1, porin/efflux, silent, and unexplained scenarios.'),
            visualHtml: '',
            suggestions: ['How do I import data?', 'What can you do?']
          };
        }
        return noData();
      }

      if (/^(hi|hello|hey|help|what can you do|how does this work)\b/i.test(q) || word(q, 'help')) return answerHelp(ctx);

      const isolates = findIsolates(q, ctx);
      const drugs = findDrugs(q);
      const gene = findGene(q, ctx);
      const cls = findClass(q);

      // comparison
      if (isolates.length >= 2 && (word(ql, 'compare') || ql.indexOf(' vs ') >= 0 || word(ql, 'versus'))) {
        return answerCompare(ctx, isolates);
      }

      // isolate + drug
      if (isolates.length && drugs.length) {
        return answerIsolateDrug(ctx, isolates[0], drugs[0]);
      }
      // isolate + gene
      if (isolates.length && gene) {
        return answerIsolateGene(ctx, isolates[0], gene);
      }
      // isolate + drug class
      if (isolates.length && cls) {
        return answerIsolateClass(ctx, isolates[0], cls);
      }
      // isolate profile
      if (isolates.length) {
        return answerIsolate(ctx, isolates[0]);
      }

      // gene / drug questions take precedence over broad topic keywords
      if (gene) return answerGene(ctx, gene);
      if (drugs.length) return answerDrug(ctx, drugs[0]);

      // explicit topic intents
      if (/mismatch|discordan|disagree|silent|unexplained|gap/i.test(ql)) return answerMismatch(ctx);
      if (/concordan|agreement|accuracy|match rate|strict rate/i.test(ql)) return answerConcordance(ctx);
      if (/mdr|xdr|pdr|multidrug|pan.?drug/i.test(ql)) return answerMdr(ctx);
      if (/next test|what should|recommend|confirm|further test|workup|discriminat/i.test(ql)) return answerNextTest(ctx);
      if (/carbapenem|carbapenemase|meropenem|imipenem|ertapenem/i.test(ql) && !drugs.length) return answerCarbapenem(ctx);
      if (/axiom|first.principle|mechanism|how does|why does|explain the method|reasoning method/i.test(ql)) return answerMechanisms(ctx);
      if (/overview|summary|summarize|cohort|dataset|how many|composition|landscape/i.test(ql)) return answerOverview(ctx);

      if (cls) {
        const drugIds = Object.keys(KB.DRUGS).filter(function (id) { return KB.DRUGS[id].class === cls; });
        return answerDrug(ctx, drugIds[0] || null);
      }

      // fallback: use the closest concept we can find, otherwise help
      const fallback = answerOverview(ctx);
      fallback.textHtml = p('I did not find a specific isolate, gene, or drug in that question, so here is the cohort-level picture. You can name an isolate (for example ' +
        code(a.isolates[0].isolate.id) + '), a determinant (for example ' + code('CTX-M-15') + '), or a drug (for example ' + code('meropenem') + ').') + fallback.textHtml;
      fallback.suggestions = ['Show the biggest mismatches', 'Explain ' + a.isolates[0].isolate.id, 'What can you do?'];
      return fallback;
    } catch (err) {
      return {
        intent: 'error',
        textHtml: p('<strong>The reasoner hit an unexpected condition.</strong> The dataset is still loaded; try a narrower question such as an isolate ID, a drug name, or “show the mismatches”.') +
          p('<span class="inline-code">' + esc(err && err.message ? err.message : String(err)) + '</span>'),
        visualHtml: '',
        suggestions: ['Summarize the cohort', 'Show the biggest mismatches', 'What can you do?']
      };
    }
  };

  Chat.greeting = function (ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return noData();
    const first = a.isolates[0].isolate.id;
    return {
      intent: 'greeting',
      textHtml: p('I am <strong>AMR Prism</strong>. I compare detected resistance determinants with the measured phenotype using an explicit, first-principles chain, and I show my uncertainty instead of hiding it.') +
        p('The current dataset has <strong>' + a.isolates.length + '</strong> isolates and <strong>' + a.assessedTotal +
          '</strong> assessed drug comparisons. Ask about the cohort, a specific isolate, a gene, or a drug. Switch to <strong>Visual</strong> for annotated mechanism maps and evidence chains.') +
        ul(['Try “Show the biggest mismatches”', 'Try “Why is ' + esc(first) + ' resistant to ' + esc((a.isolates[0].topMismatches[0] || { drugName: 'meropenem' }).drugName) + '?”', 'Try “Explain KPC-2 from first principles”']),
      visualHtml: chart('Cohort concordance', C.donut(statusCounts(a), {
        theme: 'dark', size: 190, centerValue: E.pct(a.strictRate), centerLabel: 'strict concordance'
      })) + chart('Resistance by class', C.bars(a.classResistance.slice(0, 7).map(function (c) {
        return { label: c.label, value: Math.round(c.rate * 100), color: c.color };
      }), { theme: 'dark', width: 470, valueFormat: function (v) { return v + '%'; }, labelChars: 20 })),
      suggestions: Chat.suggestions(ctx)
    };
  };

  Chat.suggestions = function (ctx) {
    const a = analysisFor(ctx);
    if (!a || !a.isolates.length) return ['Load the demo cohort', 'How do I import data?', 'What can you do?'];
    const first = a.isolates[0].isolate.id;
    const mm = a.topMismatches[0];
    const out = [
      'Summarize the cohort',
      'Show the biggest mismatches',
      'Which isolates are MDR or XDR?'
    ];
    if (mm) out.push('Why is ' + mm.isolateId + ' resistant to ' + mm.finding.drugName + '?');
    else out.push('Explain ' + first);
    out.push('What should we test next?');
    out.push('Explain the reasoning method');
    return out.slice(0, 6);
  };

  Chat.analysisFor = analysisFor;
  AMR.Chat = Chat;
})(window.AMR);
