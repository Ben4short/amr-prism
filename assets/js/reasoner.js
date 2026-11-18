/* =========================================================================
   AMR Prism — first-principles reasoning engine
   Premise -> mechanism -> drug effect -> prediction -> phenotype comparison
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';
  const E = AMR.Engine;
  const KB = AMR.KB;
  const R = {};

  const MUTATION_RE = /[A-Z]\d+[A-Z]/;
  const BETA_LACTAM_CLASSES = ['penicillins', 'cephalosporins', 'carbapenems', 'monobactams', 'bl_inhibitor', 'ceph_inhibitor', 'carb_inhibitor'];

  function isTargetMutation(entry, symbol) {
    return entry && ['gyra', 'parc', 'rpob'].indexOf(entry.id) >= 0 && MUTATION_RE.test(String(symbol || ''));
  }

  function geneConfidence(g, entry) {
    let c = entry.confidence == null ? 0.8 : entry.confidence;
    if (g.identity != null && !isNaN(g.identity)) {
      if (g.identity < 90) c *= 0.6;
      else if (g.identity < 97) c *= 0.82;
    }
    if (g.coverage != null && !isNaN(g.coverage)) {
      if (g.coverage < 60) c *= 0.45;
      else if (g.coverage < 80) c *= 0.65;
      else if (g.coverage < 95) c *= 0.85;
    }
    if (g.method && /NARRATIVE|TEXT/i.test(g.method)) c *= 0.75;
    if (entry.evidenceType === 'inferred' || entry.evidenceType === 'efflux') c *= 0.9;
    return E.clamp(c, 0.15, 0.99);
  }

  function makeGeneDet(g, entry) {
    const conf = geneConfidence(g, entry);
    let effects = entry.effects || {};
    let overrides = entry.overrides || {};
    let notes = entry.notes || '';
    let confidence = conf;
    if (['gyra', 'parc', 'rpob'].indexOf(entry.id) >= 0 && !isTargetMutation(entry, g.symbol)) {
      effects = {}; overrides = {}; confidence = conf * 0.45;
      notes = 'Target gene detected without a specified resistance mutation; not used as a stand-alone prediction.';
    }
    if (entry.id === 'oxa-other' && /oxa-(50|51|66|69|70|71|72|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|110|111|112|113|114|115|116|117|118|119|120)/i.test(g.symbol)) {
      effects = { penicillins: 'R', cephalosporins: 'variable', carbapenems: 'S' };
      overrides = {};
      confidence = Math.min(confidence, 0.55);
      notes = 'Intrinsic OXA-51-like/OXA-50 enzyme. Usually low-level; carbapenem resistance requires overexpression or a co-carried carbapenemase.';
    }
    return {
      key: 'gene:' + g.symbol + ':' + (g.contig || ''),
      kind: 'gene', id: entry.id, entry: entry, gene: g,
      display: g.symbol, family: entry.family, mechanism: entry.mechanism,
      action: entry.action, effects: effects, overrides: overrides,
      conditional: entry.conditional || null, notes: notes, caveats: entry.caveats || '',
      evidenceType: entry.evidenceType, confidence: confidence, source: 'AMRFinderPlus',
      identity: g.identity, coverage: g.coverage, contig: g.contig, method: g.method
    };
  }

  function makeNoteDet(mech, isolate) {
    const entryId = mech.id === 'ampc-overexpression' ? 'ampc' : mech.id;
    const entry = KB.GENE_ENTRIES.find(function (e) { return e.id === entryId; });
    if (!entry) {
      if (mech.id === 'inducible-mlsb') {
        return {
          key: 'note:inducible-mlsb', kind: 'note', id: 'inducible-mlsb', display: 'Inducible MLSB (D-test)',
          family: 'MLSB', mechanism: 'Inducible 23S rRNA methylation', action: 'Erythromycin induces clindamycin resistance; clindamycin may fail despite an initially susceptible MIC.',
          effects: { macrolides: 'R', lincosamides: 'R', streptogramins: 'R' }, overrides: {}, confidence: 0.8,
          evidenceType: 'target', source: 'Narrative', notes: 'D-test positive: inducible clindamycin resistance.', caveats: 'Avoid clindamycin monotherapy.'
        };
      }
      return null;
    }
    return {
      key: 'note:' + entry.id, kind: 'note', id: entry.id, entry: entry,
      display: mech.id === 'ampc-overexpression' ? 'AmpC derepressed (inferred)' : (entry.display + ' (inferred)'),
      family: entry.family, mechanism: entry.mechanism, action: entry.action,
      effects: entry.effects, overrides: entry.overrides, conditional: entry.conditional || null,
      notes: mech.reason, caveats: entry.caveats, evidenceType: entry.evidenceType,
      confidence: mech.confidence, source: 'Narrative', identity: null, coverage: null, contig: '', method: 'NARRATIVE'
    };
  }

  function determinantsFor(isolate) {
    const out = [];
    const seen = {};
    (isolate.genes || []).forEach(function (g) {
      const entry = KB.resolveGene(g.symbol, g);
      if (!entry) return;
      const det = makeGeneDet(g, entry);
      if (!seen[det.key]) { out.push(det); seen[det.key] = true; }
    });
    const noteMechs = E.noteMechanisms(isolate.notes || '');
    noteMechs.forEach(function (m) {
      const det = makeNoteDet(m, isolate);
      if (!det) return;
      // avoid duplicating a mechanism already represented by a gene
      const already = out.some(function (d) { return d.id === det.id; });
      if (!already && !seen[det.key]) { out.push(det); seen[det.key] = true; }
    });
    return out;
  }

  function speciesRuleKey(isolate) {
    const raw = String(isolate.species || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (KB.INTRINSIC_SPECIES[raw]) return raw;
    const found = Object.keys(KB.INTRINSIC_SPECIES).find(function (k) {
      return raw.indexOf(k) >= 0 || k.indexOf(raw) >= 0;
    });
    return found || null;
  }

  function intrinsicSupports(isolate, drugId, observed) {
    // Intrinsic rules are explanatory, not deterministic: a susceptible result
    // means the species-level expectation did not manifest, so the rule should
    // not be reported as a "silent determinant".
    if (observed === 'S') return [];
    const group = E.speciesGroup(isolate.species);
    const spKey = speciesRuleKey(isolate);
    const short = E.speciesInfo(isolate.species).short || group;
    const out = [];
    function add(rule, scope) {
      if (rule.drugs.indexOf(drugId) < 0) return;
      out.push({
        key: 'intrinsic:' + scope + ':' + drugId,
        kind: 'intrinsic', id: 'intrinsic-' + scope, display: 'Intrinsic (' + short + ')',
        mechanism: 'Species-intrinsic resistance', action: rule.reason,
        effect: 'R', effects: { other: 'R' }, overrides: {}, confidence: 0.9, evidenceType: 'intrinsic',
        source: 'Species rule', notes: rule.reason, caveats: 'Intrinsic resistance is expected and should not be attributed to an acquired gene.'
      });
    }
    (KB.INTRINSIC[group] || []).forEach(function (rule) { add(rule, group); });
    if (spKey) (KB.INTRINSIC_SPECIES[spKey] || []).forEach(function (rule) { add(rule, spKey); });
    return out;
  }

  function effectFor(det, drugId, drugClass, isolate, allDets) {
    let eff = null;
    if (det.overrides && Object.prototype.hasOwnProperty.call(det.overrides, drugId)) eff = det.overrides[drugId];
    else if (det.effects && Object.prototype.hasOwnProperty.call(det.effects, drugClass)) eff = det.effects[drugClass];
    if (eff == null) return null;
    if (det.conditional === 'beta-lactamase') {
      const hasBL = allDets.some(function (d) {
        return d.entry && /BETA-LACTAM/i.test(d.entry.class || '') && d.effects && (d.effects.carbapenems === 'R' || d.effects.cephalosporins === 'R' || d.effects.penicillins === 'R');
      });
      if (!hasBL) eff = eff === 'R' ? 'I' : eff;
      else if (eff === 'variable') eff = 'R';
    }
    return eff;
  }

  function strength(eff) {
    if (eff === 'R') return 3;
    if (eff === 'variable') return 2;
    if (eff === 'I') return 2;
    if (eff === 'S') return 1;
    return 0;
  }

  function predictedLabel(pred, variable, knownSusceptible) {
    if (pred === 'R') return variable ? 'R (variable)' : 'R';
    if (pred === 'I') return variable ? 'I (variable)' : 'I';
    if (pred === 'S') return knownSusceptible ? 'S (mechanism inhibited)' : 'S';
    return '—';
  }

  function statusFor(pred, observed, noKnown, knownSusceptible) {
    if (!observed) return 'untested';
    if (!pred && !noKnown) return 'no-call';
    if (pred === 'R') {
      if (observed === 'R') return 'concordant-r';
      if (observed === 'I') return 'partial';
      return 'silent';
    }
    if (pred === 'I') {
      if (observed === 'S') return 'silent';
      return 'partial';
    }
    if (pred === 'S') {
      if (observed === 'S') return 'concordant-s';
      return 'unexplained';
    }
    if (noKnown) {
      if (observed === 'S') return 'concordant-s';
      return 'unexplained';
    }
    return 'no-call';
  }

  function confidenceFor(status, supports, observedConf) {
    const confs = supports.map(function (s) { return s.confidence || 0.5; }).sort(function (a, b) { return b - a; });
    let mech = 0;
    confs.forEach(function (c, i) { mech = 1 - (1 - mech) * (1 - c * (i === 0 ? 0.85 : 0.5)); });
    if (!confs.length) mech = 0.45;
    const ph = observedConf == null ? 0.7 : observedConf;
    let c;
    if (status === 'concordant-r' || status === 'concordant-s') c = 0.6 * mech + 0.4 * ph;
    else if (status === 'partial') c = 0.5 * mech + 0.3 * ph + 0.04;
    else if (status === 'silent') c = 0.5 * mech + 0.3 * ph;
    else if (status === 'unexplained') c = 0.5 + 0.3 * ph;
    else c = 0.4;
    return E.clamp(c, 0.2, 0.98);
  }

  function confLabel(c) {
    if (c >= 0.8) return 'High';
    if (c >= 0.6) return 'Moderate';
    return 'Low';
  }

  function buildChain(finding, isolate) {
    const chain = [];
    const intrinsic = finding.supports.length ? /^intrinsic:/.test(finding.supports[0].key || '') : false;
    if (finding.supports.length) {
      const g = finding.supports[0];
      const ev = [];
      if (g.identity != null) ev.push(E.fmt(g.identity, 1) + '% identity');
      if (g.coverage != null) ev.push(E.fmt(g.coverage, 0) + '% coverage');
      chain.push({
        label: intrinsic ? 'Premise 1 · species context' : 'Premise 1 · molecular evidence',
        text: intrinsic
          ? 'The isolate is ' + (E.speciesInfo(isolate.species).label || isolate.species) + ', for which ' + finding.drugName + ' resistance is a recognized intrinsic property rather than an acquired gene.'
          : g.display + ' was detected' + (ev.length ? ' (' + ev.join(', ') + ')' : '') + ' by ' + (g.source || 'the imported evidence') + '.'
      });
      chain.push({
        label: intrinsic ? 'Premise 2 · intrinsic mechanism' : 'Premise 2 · biochemical action',
        text: g.action || g.mechanism || 'The determinant has a plausible effect on this drug class.'
      });
      chain.push({
        label: 'Premise 3 · drug context',
        text: finding.drugName + ' belongs to the ' + E.classInfo(finding.drugClass).label.toLowerCase() + ' class. ' + (finding.observedMic ? 'The reported MIC is ' + finding.observedMic + ' mg/L.' : finding.observedZone ? 'The reported zone diameter is ' + finding.observedZone + '.' : '')
      });
      chain.push({
        label: 'Inference · predicted effect',
        text: (intrinsic
          ? 'If the species-level expectation holds, the expected phenotype is '
          : 'If the determinant is expressed and accessible, the expected phenotype is ') + predictedLabel(finding.predicted, finding.variable, finding.knownSusceptible) + '.'
      });
    } else {
      chain.push({
        label: 'Premise 1 · molecular evidence',
        text: 'No detected determinant in the current evidence set has a mechanistically valid path to ' + finding.drugName + '.'
      });
      chain.push({
        label: 'Premise 2 · database scope',
        text: 'AMRFinderPlus reports known acquired determinants; it does not capture every target mutation, porin change, efflux phenotype, or uncharacterized mechanism.'
      });
      chain.push({
        label: 'Inference · predicted effect',
        text: 'The model predicts susceptibility by default, but with low confidence because absence of evidence is not evidence of absence.'
      });
    }
    chain.push({
      label: 'Observation · phenotype',
      text: finding.observed ? (finding.drugName + ' is ' + (finding.observed === 'R' ? 'resistant' : finding.observed === 'I' ? 'intermediate' : 'susceptible') + (finding.observedMic ? ' (MIC ' + finding.observedMic + ' mg/L)' : finding.observedZone ? ' (zone ' + finding.observedZone + ')' : '') + '.') : 'No phenotype is available for this drug.'
    });
    const conclusionDesc = intrinsic && finding.status === 'concordant-r'
      ? 'A species-intrinsic mechanism predicts resistance and the isolate is resistant.'
      : (KB.CONCORDANCE[finding.status] ? KB.CONCORDANCE[finding.status].desc : '');
    chain.push({
      label: 'Conclusion · concordance',
      text: finding.statusLabel + '. ' + conclusionDesc + ' Evidence strength: ' + confLabel(finding.confidence) + ' (' + Math.round(finding.confidence * 100) + '%).'
    });
    return chain;
  }

  function hypothesesFor(finding, isolate) {
    if (['silent', 'unexplained', 'partial'].indexOf(finding.status) < 0) return [];
    const group = E.speciesGroup(isolate.species);
    const gramNeg = group === 'ent' || group === 'psa' || group === 'aba';
    const cls = finding.drugClass;
    const isCarb = cls === 'carbapenems' || cls === 'carb_inhibitor';
    const isFq = cls === 'fluoroquinolones';
    const isPolymyxin = cls === 'polymyxins';
    const isBeta = BETA_LACTAM_CLASSES.indexOf(cls) >= 0;
    const h = [];

    if (finding.status === 'silent') {
      let p1 = 0.34;
      const g = finding.supports[0];
      if (g && ((g.coverage != null && g.coverage < 80) || (g.identity != null && g.identity < 95))) p1 += 0.18;
      if (g && /NARRATIVE/i.test(g.method || '')) p1 += 0.05;
      h.push({ title: 'Gene is present but not expressed or is truncated', why: 'Detection proves sequence, not function. Promoter loss, truncation, or silencing can disconnect genotype from phenotype.', next: 'RT-qPCR or RNA-seq; inspect promoter/reading frame; check coverage and allele integrity.', prior: p1 });
      h.push({ title: 'The drug is a poor substrate or the mechanism is inhibited', why: 'Some enzymes have weak activity against specific agents, and inhibitor combinations can restore activity.', next: 'Enzyme kinetics or inhibitor panel; verify the specific allele and drug.', prior: isBeta ? 0.24 : 0.16 });
      h.push({ title: 'Permeability or efflux limits access to the drug', why: 'The determinant may be active, but too little drug reaches the target.', next: 'Porin/efflux expression; outer-membrane protein profile.', prior: gramNeg ? 0.18 : 0.08 });
      h.push({ title: 'Testing error, inoculum effect, or mixed population', why: 'A single AST can miss subpopulations or be affected by method and inoculum.', next: 'Repeat AST by reference method; check purity; test a second colony.', prior: 0.14 });
      h.push({ title: 'Species context or breakpoint mismatch', why: 'The same MIC can be S or R depending on species and the applied breakpoint.', next: 'Verify species identification and local breakpoint table.', prior: 0.1 });
    } else if (finding.status === 'unexplained') {
      let p1 = 0.3;
      if (isCarb) p1 += 0.08;
      h.push({ title: 'An undetected resistance gene or variant is present', why: 'AMRFinderPlus cannot report genes absent from its database or below detection limits.', next: 'Whole-genome or metagenomic sequencing; update AMRFinderPlus database; targeted PCR.', prior: p1 });
      let p2 = 0.2;
      if (isFq || cls === 'rifamycins' || cls === 'oxazolidinones' || isPolymyxin) p2 += 0.14;
      h.push({ title: 'A target mutation outside the reported panel explains resistance', why: 'Point mutations in gyrA/parC, rpoB, 23S rRNA, pbp, or lipid-A regulators may not be captured.', next: 'Sequence the relevant target genes and regulators.', prior: p2 });
      let p3 = 0.18;
      if (gramNeg && (isCarb || isFq || isBeta)) p3 += 0.14;
      h.push({ title: 'Porin loss or efflux overexpression is the missing mechanism', why: 'These are regulatory/protein-level phenotypes, not single acquired genes, and are often absent from AMRFinderPlus output.', next: 'Outer-membrane protein profile, efflux pump expression, and porin sequencing.', prior: p3 });
      h.push({ title: 'Intrinsic or adaptive resistance is being expressed', why: 'Induction, biofilm growth, or stationary-phase physiology can raise MICs without a new gene.', next: 'Induction assays, biofilm testing, and time-kill studies.', prior: 0.12 });
      h.push({ title: 'Testing error or mixed culture', why: 'The resistance may not be stable or may come from a minority population.', next: 'Repeat AST, purity check, and colony picking.', prior: 0.12 });
      h.push({ title: 'Annotation or database gap', why: 'The gene may be present but mis-annotated, fragmented, or represented by a distant homolog.', next: 'Review raw reads, AMRFinderPlus version, and database release.', prior: 0.08 });
    } else {
      h.push({ title: 'Partial expression or intermediate resistance', why: 'The mechanism is present but does not fully cross the resistant breakpoint.', next: 'Quantify expression and test by reference MIC method.', prior: 0.32 });
      h.push({ title: 'Inoculum effect or borderline breakpoint', why: 'The MIC lies near a breakpoint and may shift with method or inoculum.', next: 'Repeat with a standardized inoculum and reference method.', prior: 0.24 });
      h.push({ title: 'Mixed susceptible/resistant subpopulations', why: 'A heterogeneous population can produce an intermediate MIC.', next: 'Pick multiple colonies and test separately.', prior: 0.18 });
      h.push({ title: 'Combination or inhibitor effect', why: 'The inhibitor may partially restore activity without fully reversing resistance.', next: 'Test the combination at clinically relevant exposures.', prior: 0.14 });
      h.push({ title: 'Additional unmeasured mechanism', why: 'A second determinant may be modifying the phenotype.', next: 'Expand molecular testing and review the full resistance profile.', prior: 0.12 });
    }
    const total = h.reduce(function (a, b) { return a + b.prior; }, 0) || 1;
    h.forEach(function (x) { x.probability = Math.round((x.prior / total) * 100); });
    return h.sort(function (a, b) { return b.probability - a.probability; }).slice(0, 5);
  }

  function analyzeIsolate(isolate, drugPanel) {
    const dets = determinantsFor(isolate);
    const phenotypes = {};
    (isolate.phenotypes || []).forEach(function (p) { phenotypes[p.drug] = p; });
    const drugIds = E.uniq(Object.keys(phenotypes).concat(
      dets.reduce(function (acc, d) { return acc.concat(Object.keys(d.overrides || {})); }, [])
    ));
    // A dataset can define a focused drug panel (the final-year study uses
    // eight drugs). Always keep any drug that actually has a phenotype so
    // imported extra results are never silently hidden.
    const panel = (drugPanel && drugPanel.length) ? drugPanel : Object.keys(KB.DRUGS);
    const allDrugIds = E.uniq(panel.concat(drugIds));
    const findings = [];
    allDrugIds.forEach(function (drugId) {
      const info = E.drugInfo(drugId);
      const obs = phenotypes[drugId];
      const supports = [];
      dets.forEach(function (d) {
        const eff = effectFor(d, drugId, info.class, isolate, dets);
        if (eff == null) return;
        supports.push({
          key: d.key, display: d.display, mechanism: d.mechanism, action: d.action,
          effect: eff, confidence: d.confidence, source: d.source, evidenceType: d.evidenceType,
          notes: d.notes, caveats: d.caveats, identity: d.identity, coverage: d.coverage,
          method: d.method, family: d.family
        });
      });
      intrinsicSupports(isolate, drugId, obs ? obs.sir : null).forEach(function (s) { supports.push(s); });
      // Deduplicate identical support displays, keep highest confidence
      const by = {};
      supports.forEach(function (s) {
        if (!by[s.display] || by[s.display].confidence < s.confidence) by[s.display] = s;
      });
      const uniqSupports = Object.keys(by).map(function (k) { return by[k]; });
      let strongest = 0, strongestEff = null;
      uniqSupports.forEach(function (s) {
        const st = strength(s.effect);
        if (st > strongest) { strongest = st; strongestEff = s.effect; }
      });
      const noKnown = uniqSupports.length === 0;
      let predicted = null, variable = false, knownSusceptible = false;
      if (!noKnown) {
        if (strongestEff === 'R') predicted = 'R';
        else if (strongestEff === 'I' || strongestEff === 'variable') { predicted = 'I'; variable = strongestEff === 'variable'; }
        else { predicted = 'S'; knownSusceptible = true; }
      }
      const observed = obs ? obs.sir : null;
      const status = statusFor(predicted, observed, noKnown, knownSusceptible);
      const observedConf = obs ? (obs.confidence || (obs.sirSource === 'interpreted' ? 0.8 : 0.9)) : 0.7;
      const confidence = confidenceFor(status, uniqSupports, observedConf);
      const finding = {
        drug: drugId, drugName: info.name, drugClass: info.class, drugClassLabel: E.classInfo(info.class).label,
        observed: observed, observedMic: obs ? obs.mic : null, observedZone: obs ? obs.zone : null, observedSource: obs ? obs.sirSource : null,
        observedMethod: obs ? obs.method : '', observedNote: obs ? obs.note : '',
        predicted: predicted, predictedLabel: predictedLabel(predicted, variable, knownSusceptible),
        noKnown: noKnown, variable: variable, knownSusceptible: knownSusceptible,
        status: status, statusLabel: KB.CONCORDANCE[status] ? KB.CONCORDANCE[status].label : status,
        confidence: confidence, confidenceLabel: confLabel(confidence),
        supports: uniqSupports, mechanisms: E.uniq(uniqSupports.map(function (s) { return s.mechanism; })),
        chain: [], hypotheses: []
      };
      finding.chain = buildChain(finding, isolate);
      finding.hypotheses = hypothesesFor(finding, isolate);
      findings.push(finding);
    });
    // Keep findings with a phenotype or a prediction; sort by clinical relevance
    const assessed = findings.filter(function (f) { return f.observed; });
    const counts = { 'concordant-r': 0, 'concordant-s': 0, 'partial': 0, 'silent': 0, 'unexplained': 0, 'untested': 0, 'no-call': 0 };
    findings.forEach(function (f) { counts[f.status] = (counts[f.status] || 0) + 1; });
    const assessedCount = assessed.length;
    const concordant = counts['concordant-r'] + counts['concordant-s'];
    const weighted = concordant + counts.partial * 0.5;
    const strictRate = assessedCount ? concordant / assessedCount : null;
    const weightedRate = assessedCount ? weighted / assessedCount : null;
    const majorMismatch = counts.silent + counts.unexplained;
    const majorRate = assessedCount ? majorMismatch / assessedCount : null;
    const resistanceCount = assessed.filter(function (f) { return f.observed === 'R' || f.observed === 'I'; }).length;
    const resistanceRate = assessedCount ? resistanceCount / assessedCount : null;

    // MDR / XDR / PDR
    const testedCats = {}, nonSusCats = {};
    assessed.forEach(function (f) {
      const cat = KB.MDR_CATEGORIES[f.drugClass];
      if (!cat) return;
      testedCats[cat] = true;
      if (f.observed === 'R' || f.observed === 'I') nonSusCats[cat] = true;
    });
    const testedCatCount = Object.keys(testedCats).length;
    const nonSusCatCount = Object.keys(nonSusCats).length;
    let mdrClass = 'Non-MDR';
    if (testedCatCount < 3) mdrClass = 'Insufficient panel';
    else if (nonSusCatCount === testedCatCount && testedCatCount >= 8) mdrClass = 'PDR';
    else if (nonSusCatCount >= testedCatCount - 2 && testedCatCount >= 8) mdrClass = 'XDR';
    else if (nonSusCatCount >= 3) mdrClass = 'MDR';

    // Gene findings
    const geneFindings = dets.map(function (d) {
      const affected = findings.filter(function (f) { return f.supports.some(function (s) { return s.key === d.key; }); });
      const explained = affected.filter(function (f) { return (f.observed === 'R' || f.observed === 'I') && (f.predicted === 'R' || f.predicted === 'I'); });
      const silent = affected.filter(function (f) { return f.observed === 'S' && f.predicted === 'R'; });
      const untested = affected.filter(function (f) { return !f.observed; });
      return {
        key: d.key, display: d.display, mechanism: d.mechanism, family: d.family, action: d.action,
        source: d.source, confidence: d.confidence, evidenceType: d.evidenceType,
        identity: d.identity, coverage: d.coverage, contig: d.contig, method: d.method,
        affected: affected.length, explained: explained.length, silent: silent.length, untested: untested.length,
        explainedDrugs: explained.slice(0, 8).map(function (f) { return f.drugName; }),
        silentDrugs: silent.slice(0, 8).map(function (f) { return f.drugName; }),
        supportRate: (explained.length + silent.length) ? explained.length / (explained.length + silent.length) : null,
        notes: d.notes, caveats: d.caveats
      };
    }).sort(function (a, b) { return b.confidence - a.confidence; });

    const topMismatches = findings.filter(function (f) { return f.status === 'silent' || f.status === 'unexplained' || f.status === 'partial'; })
      .sort(function (a, b) { return b.confidence - a.confidence; }).slice(0, 8);
    const topExplained = findings.filter(function (f) { return f.status === 'concordant-r'; })
      .sort(function (a, b) { return b.confidence - a.confidence; }).slice(0, 8);

    return {
      isolate: isolate, determinants: dets, findings: findings, assessed: assessed,
      counts: counts, assessedCount: assessedCount, concordant: concordant,
      strictRate: strictRate, weightedRate: weightedRate, majorMismatch: majorMismatch, majorRate: majorRate,
      resistanceRate: resistanceRate, resistanceCount: resistanceCount,
      mdrClass: mdrClass, testedCatCount: testedCatCount, nonSusCatCount: nonSusCatCount,
      mdrCategories: Object.keys(nonSusCats), geneFindings: geneFindings,
      topMismatches: topMismatches, topExplained: topExplained,
      confidenceAvg: findings.length ? E.sum(findings.map(function (f) { return f.confidence; })) / findings.length : 0,
      geneCount: dets.length,
      phenotypeCount: assessedCount
    };
  }

  function analyzeDataset(dataset) {
    const isolates = (dataset && dataset.isolates) || [];
    const panel = (dataset && dataset.drugPanel) || null;
    const analyses = isolates.map(function (iso) { return analyzeIsolate(iso, panel); });
    const byId = {};
    analyses.forEach(function (a) { byId[a.isolate.id] = a; });

    // gene prevalence across isolates
    const geneMap = {};
    analyses.forEach(function (a) {
      const seen = {};
      a.determinants.forEach(function (d) {
        if (seen[d.id]) return;
        seen[d.id] = true;
        if (!geneMap[d.id]) geneMap[d.id] = { id: d.id, display: d.display, mechanism: d.mechanism, family: d.family, isolates: [], count: 0, confidence: d.confidence };
        geneMap[d.id].isolates.push(a.isolate.id);
        geneMap[d.id].count++;
      });
    });
    const genePrevalence = Object.keys(geneMap).map(function (k) { return geneMap[k]; })
      .sort(function (a, b) { return b.count - a.count || a.display.localeCompare(b.display); });

    // species distribution
    const speciesMap = {};
    isolates.forEach(function (i) {
      const s = E.speciesInfo(i.species);
      speciesMap[s.label] = (speciesMap[s.label] || 0) + 1;
    });
    const speciesDistribution = Object.keys(speciesMap).map(function (k) { return { label: k, count: speciesMap[k] }; })
      .sort(function (a, b) { return b.count - a.count; });

    // drug and class resistance
    const drugMap = {}, classMap = {};
    analyses.forEach(function (a) {
      a.assessed.forEach(function (f) {
        if (!drugMap[f.drug]) drugMap[f.drug] = { id: f.drug, name: f.drugName, class: f.drugClass, tested: 0, nonSus: 0, r: 0, i: 0, s: 0 };
        const d = drugMap[f.drug];
        d.tested++;
        if (f.observed === 'R') { d.r++; d.nonSus++; }
        else if (f.observed === 'I') { d.i++; d.nonSus++; }
        else if (f.observed === 'S') d.s++;
        if (!classMap[f.drugClass]) classMap[f.drugClass] = { id: f.drugClass, label: E.classInfo(f.drugClass).label, color: E.classInfo(f.drugClass).color, tested: 0, nonSus: 0, r: 0, i: 0, s: 0 };
        const c = classMap[f.drugClass];
        c.tested++;
        if (f.observed === 'R') { c.r++; c.nonSus++; }
        else if (f.observed === 'I') { c.i++; c.nonSus++; }
        else if (f.observed === 'S') c.s++;
      });
    });
    const drugResistance = Object.keys(drugMap).map(function (k) { const d = drugMap[k]; d.rate = d.tested ? d.nonSus / d.tested : 0; return d; })
      .sort(function (a, b) { return b.rate - a.rate || b.tested - a.tested; });
    const classResistance = Object.keys(classMap).map(function (k) { const c = classMap[k]; c.rate = c.tested ? c.nonSus / c.tested : 0; return c; })
      .sort(function (a, b) { return b.rate - a.rate || b.tested - a.tested; });

    // concordance totals
    const counts = { 'concordant-r': 0, 'concordant-s': 0, 'partial': 0, 'silent': 0, 'unexplained': 0, 'untested': 0, 'no-call': 0 };
    analyses.forEach(function (a) { Object.keys(counts).forEach(function (k) { counts[k] += a.counts[k] || 0; }); });
    const assessedTotal = counts['concordant-r'] + counts['concordant-s'] + counts.partial + counts.silent + counts.unexplained;
    const concordantTotal = counts['concordant-r'] + counts['concordant-s'];
    const weightedTotal = concordantTotal + counts.partial * 0.5;
    const strictRate = assessedTotal ? concordantTotal / assessedTotal : null;
    const weightedRate = assessedTotal ? weightedTotal / assessedTotal : null;
    const majorMismatchTotal = counts.silent + counts.unexplained;
    const majorRate = assessedTotal ? majorMismatchTotal / assessedTotal : null;

    const topMismatches = [];
    analyses.forEach(function (a) {
      a.findings.forEach(function (f) {
        if (f.status === 'silent' || f.status === 'unexplained') {
          topMismatches.push({ isolateId: a.isolate.id, species: a.isolate.species, finding: f });
        }
      });
    });
    topMismatches.sort(function (a, b) { return b.finding.confidence - a.finding.confidence; });

    const mdrSummary = { 'MDR': 0, 'XDR': 0, 'PDR': 0, 'Non-MDR': 0, 'Insufficient panel': 0 };
    analyses.forEach(function (a) { mdrSummary[a.mdrClass] = (mdrSummary[a.mdrClass] || 0) + 1; });

    const images = [];
    (dataset.images || []).forEach(function (img) { images.push(img); });
    isolates.forEach(function (i) { (i.images || []).forEach(function (img) { images.push(Object.assign({ isolateId: i.id }, img)); }); });

    return {
      dataset: dataset,
      isolates: analyses,
      byId: byId,
      genePrevalence: genePrevalence,
      speciesDistribution: speciesDistribution,
      drugResistance: drugResistance,
      classResistance: classResistance,
      counts: counts,
      assessedTotal: assessedTotal,
      concordantTotal: concordantTotal,
      strictRate: strictRate,
      weightedRate: weightedRate,
      majorMismatchTotal: majorMismatchTotal,
      majorRate: majorRate,
      topMismatches: topMismatches,
      mdrSummary: mdrSummary,
      images: images,
      generatedAt: new Date().toISOString(),
      totalGenes: genePrevalence.reduce(function (a, g) { return a + g.count; }, 0)
    };
  }

  R.analyzeIsolate = analyzeIsolate;
  R.analyzeDataset = analyzeDataset;
  R.determinantsFor = determinantsFor;
  R.confLabel = confLabel;
  R.predictedLabel = predictedLabel;
  R.statusFor = statusFor;
  AMR.Reasoner = R;
})(window.AMR);
