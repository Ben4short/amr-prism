/* =========================================================================
   AMR Prism — ingestion, normalization, and parsing engine
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';
  const E = {};
  const KB = AMR.KB;

  /* ---------- generic ---------- */
  E.slug = function (s) {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };
  E.titleCase = function (s) {
    return String(s || '').replace(/\w\S*/g, function (t) { return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); });
  };
  E.clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  E.round = function (n, d) { const p = Math.pow(10, d || 0); return Math.round(n * p) / p; };
  E.pct = function (n, d) { return (n == null || isNaN(n)) ? '—' : E.round(n * 100, d == null ? 0 : d) + '%'; };
  E.fmt = function (n, d) { return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d == null ? 1 : d); };
  E.escapeHtml = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  E.uniq = function (arr) { return Array.from(new Set(arr)); };
  E.sum = function (arr) { return arr.reduce(function (a, b) { return a + (Number(b) || 0); }, 0); };

  E.speciesInfo = function (name) {
    const raw = String(name || '').trim();
    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    if (KB.SPECIES[key]) return KB.SPECIES[key];
    // try genus/species match
    const found = Object.keys(KB.SPECIES).find(function (k) { return key.indexOf(k) >= 0 || k.indexOf(key) >= 0; });
    if (found) return KB.SPECIES[found];
    return { label: raw || 'Unspecified organism', short: raw || 'Unspecified', group: 'other', gram: 'unknown' };
  };
  E.speciesGroup = function (name) { return E.speciesInfo(name).group; };
  E.drugInfo = function (id, fallback) {
    if (KB.DRUGS[id]) return KB.DRUGS[id];
    return { name: fallback || id || 'Unknown drug', short: (fallback || id || '?').slice(0, 5).toUpperCase(), class: 'other', aliases: [], bp: {} };
  };
  E.drugClass = function (id, fallback) { return E.drugInfo(id, fallback).class; };
  E.classInfo = function (cls) { return KB.DRUG_CLASSES[cls] || KB.DRUG_CLASSES.other; };

  /* ---------- SIR / MIC ---------- */
  E.normalizeSIR = function (raw) {
    if (raw == null) return null;
    const s = String(raw).trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!s) return null;
    if (/^(R|RES|RESISTANT|NS|NON[S]?USCEPTIBLE)$/.test(s)) return 'R';
    if (/^(I|INT|INTERMEDIATE|SDD|SUSCEPTIBLEDOSEDEPENDENT)$/.test(s)) return 'I';
    if (/^(S|SUS|SENS|SENSITIVE|SUSCEPTIBLE)$/.test(s)) return 'S';
    if (/^R$/.test(s)) return 'R';
    return null;
  };
  E.parseMIC = function (raw) {
    if (raw == null) return null;
    const s = String(raw).replace(/,/g, '.').trim();
    if (!s) return null;
    const m = s.match(/(<=|≤|<|>=|≥|>|=)?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/);
    if (!m) return null;
    const op = (m[1] || '=').replace('≤', '<=').replace('≥', '>=');
    return { raw: s, value: parseFloat(m[2]), op: op, second: m[3] != null ? parseFloat(m[3]) : null };
  };
  E.interpretMIC = function (drugId, mic, species) {
    const drug = E.drugInfo(drugId);
    const group = E.speciesGroup(species);
    let b = drug.bp && (drug.bp[group] || drug.bp.ent);
    if (!b && drug.bp) {
      const keys = Object.keys(drug.bp);
      if (keys.length) b = drug.bp[keys[0]];
    }
    const parsed = typeof mic === 'object' ? mic : E.parseMIC(mic);
    if (!parsed || !b || parsed.value == null) return { sir: null, confidence: 0.4, note: 'No matching MIC breakpoint; SIR not interpreted.' };
    const v = parsed.value;
    let sir = null;
    if (parsed.op === '>' || parsed.op === '>=') {
      if (v >= b.r) sir = 'R';
      else if (v >= b.s) sir = 'I';
      else sir = 'S';
    } else if (parsed.op === '<' || parsed.op === '<=') {
      if (v <= b.s) sir = 'S';
      else if (v < b.r) sir = 'I';
      else sir = 'R';
    } else {
      if (v >= b.r) sir = 'R';
      else if (v <= b.s) sir = 'S';
      else sir = 'I';
    }
    return {
      sir: sir,
      confidence: 0.8,
      note: 'Interpreted with ' + (b.s + '/' + b.r) + ' mg/L ' + (group === 'ent' ? 'Enterobacterales' : group.toUpperCase()) + ' breakpoint.'
    };
  };

  /* ---------- delimited text ---------- */
  E.parseDelimited = function (text) {
    let t = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = t.split('\n').filter(function (l) { return l.trim() !== '' && !/^\s*#/.test(l); });
    if (!lines.length) return { headers: [], rows: [], delimiter: '\t' };
    const first = lines[0];
    const counts = { '\t': (first.match(/\t/g) || []).length, ',': (first.match(/,/g) || []).length, ';': (first.match(/;/g) || []).length };
    let delim = '\t';
    if (counts[','] > counts['\t'] && counts[','] >= counts[';']) delim = ',';
    else if (counts[';'] > counts['\t'] && counts[';'] > counts[',']) delim = ';';

    function splitLine(line) {
      const out = [];
      let cur = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') q = false;
          else cur += c;
        } else {
          if (c === '"') q = true;
          else if (c === delim) { out.push(cur.trim()); cur = ''; }
          else cur += c;
        }
      }
      out.push(cur.trim());
      return out;
    }
    const headers = splitLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = splitLine(lines[i]);
      if (cells.every(function (c) { return c === ''; })) continue;
      const row = {};
      headers.forEach(function (h, idx) { row[h] = cells[idx] == null ? '' : cells[idx]; });
      row.__line = i + 1;
      rows.push(row);
    }
    return { headers: headers, rows: rows, delimiter: delim };
  };

  E.normHeader = function (h) {
    return String(h || '').toLowerCase()
      .replace(/%/g, 'pct')
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, '');
  };
  E.findColumn = function (headers, aliases) {
    const norm = headers.map(E.normHeader);
    for (const a of aliases) {
      const na = E.normHeader(a);
      const idx = norm.indexOf(na);
      if (idx >= 0) return headers[idx];
    }
    for (const a of aliases) {
      const na = E.normHeader(a);
      const idx = norm.findIndex(function (h) { return h.indexOf(na) >= 0 || na.indexOf(h) >= 0; });
      if (idx >= 0) return headers[idx];
    }
    return null;
  };

  const AMR_COLS = {
    isolate: ['isolate', 'sample', 'sample id', 'strain', 'strain id', 'genome id', 'assembly', 'id', 'organism', 'species'],
    species: ['organism', 'species', 'organism name', 'taxon'],
    gene: ['element symbol', 'gene symbol', 'gene', 'symbol', 'element', 'gene name', 'name of closest sequence'],
    name: ['element name', 'gene name', 'name of closest sequence', 'product', 'description'],
    cls: ['class', 'drug class', 'resistance class', 'antimicrobial class'],
    subclass: ['subclass', 'sub class', 'subclassification'],
    type: ['type', 'element type', 'elementtype'],
    subtype: ['subtype', 'element subtype'],
    mechanism: ['resistance mechanism', 'mechanism'],
    identity: ['% identity to reference', 'pct identity to reference', 'identity', 'percent identity', '% identity', 'pct identity', 'identity to reference'],
    coverage: ['% coverage of reference', 'pct coverage of reference', 'coverage', 'percent coverage', '% coverage', 'pct coverage', 'coverage of reference'],
    contig: ['contig id', 'contig', 'contigid'],
    start: ['start', 'start position'],
    stop: ['stop', 'stop position', 'end'],
    strand: ['strand'],
    method: ['method', 'detection method'],
    accession: ['accession of closest sequence', 'accession', 'closest accession'],
    scope: ['scope']
  };

  E.detectAmrColumns = function (headers) {
    const out = {};
    Object.keys(AMR_COLS).forEach(function (k) { out[k] = E.findColumn(headers, AMR_COLS[k]); });
    return out;
  };
  E.looksLikeAmr = function (headers) {
    const c = E.detectAmrColumns(headers);
    return !!(c.gene && (c.cls || c.subclass || c.mechanism || c.identity || c.coverage));
  };

  E.parseAmrTable = function (text, filename) {
    const parsed = E.parseDelimited(text);
    if (!parsed.headers.length) throw new Error('The AMRFinderPlus file is empty.');
    const cols = E.detectAmrColumns(parsed.headers);
    if (!cols.gene) throw new Error('Could not find an AMRFinderPlus gene column. Expected "Element symbol", "Gene symbol", or "Gene".');
    const fallbackId = (filename || 'Sample').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-');
    const map = {};
    let skipped = 0;
    parsed.rows.forEach(function (row) {
      const geneRaw = String(row[cols.gene] || '').trim();
      if (!geneRaw) { skipped++; return; }
      const type = cols.type ? String(row[cols.type] || '').trim() : '';
      if (type && !/AMR|RESIST|BETA|AMINO|QUIN|TET|MACRO|GLYCO|POLY|FOLATE|PHENICOL|FOSFO|RIFAM|OXAZOL|LINCOS|STREPTO|EFFLUX|PORIN|PERMEABILITY/i.test(type) && !/AMR/i.test(type)) {
        // Keep non-AMR rows out of the resistance analysis but count them.
        skipped++;
        return;
      }
      let id = cols.isolate ? String(row[cols.isolate] || '').trim() : '';
      if (!id) id = fallbackId;
      id = id.replace(/\s+/g, '-');
      if (!map[id]) {
        map[id] = {
          id: id, species: cols.species ? String(row[cols.species] || '').trim() : '',
          source: '', collectionDate: '', location: '', notes: '', genes: [], phenotypes: [], images: []
        };
      }
      const symbol = geneRaw;
      const entry = KB.resolveGene(symbol, { class: cols.cls ? row[cols.cls] : '', subclass: cols.subclass ? row[cols.subclass] : '' });
      const identity = cols.identity ? parseFloat(String(row[cols.identity] || '').replace('%', '')) : null;
      const coverage = cols.coverage ? parseFloat(String(row[cols.coverage] || '').replace('%', '')) : null;
      map[id].genes.push({
        symbol: symbol,
        name: cols.name ? String(row[cols.name] || symbol) : symbol,
        class: cols.cls ? String(row[cols.cls] || '') : (entry ? entry.class : ''),
        subclass: cols.subclass ? String(row[cols.subclass] || '') : (entry ? entry.subclass : ''),
        mechanism: cols.mechanism ? String(row[cols.mechanism] || '') : (entry ? entry.mechanism : ''),
        type: type || 'AMR',
        subtype: cols.subtype ? String(row[cols.subtype] || '') : '',
        identity: isNaN(identity) ? null : identity,
        coverage: isNaN(coverage) ? null : coverage,
        contig: cols.contig ? String(row[cols.contig] || '') : '',
        start: cols.start ? row[cols.start] : '',
        stop: cols.stop ? row[cols.stop] : '',
        strand: cols.strand ? row[cols.strand] : '',
        method: cols.method ? String(row[cols.method] || '') : '',
        product: cols.name ? String(row[cols.name] || '') : '',
        scope: cols.scope ? String(row[cols.scope] || '') : '',
        accession: cols.accession ? String(row[cols.accession] || '') : '',
        raw: row
      });
    });
    return {
      isolates: Object.keys(map).map(function (k) { return map[k]; }),
      warnings: skipped ? [skipped + ' non-AMR or empty rows were ignored.'] : [],
      columns: cols,
      rowCount: parsed.rows.length,
      kind: 'amr'
    };
  };

  const AST_COLS = {
    isolate: ['isolate', 'sample', 'sample id', 'strain', 'strain id', 'id', 'patient', 'organism'],
    species: ['organism', 'species', 'organism name'],
    drug: ['drug', 'antibiotic', 'antimicrobial', 'agent', 'drug name', 'antibiotic name'],
    mic: ['mic', 'mic mg/l', 'mic (mg/l)', 'mic value', 'minimum inhibitory concentration'],
    sir: ['sir', 'interpretation', 'result', 'susceptibility', 'category', 'susceptibility category', 's/i/r'],
    method: ['method', 'test method', 'assay'],
    date: ['date', 'test date'],
    note: ['note', 'notes', 'comment']
  };
  E.detectAstColumns = function (headers) {
    const out = {};
    Object.keys(AST_COLS).forEach(function (k) { out[k] = E.findColumn(headers, AST_COLS[k]); });
    return out;
  };
  E.looksLikeAst = function (headers) {
    const c = E.detectAstColumns(headers);
    if (c.drug && (c.mic || c.sir)) return true;
    // wide format: at least 2 recognizable drug headers
    let n = 0;
    headers.forEach(function (h) { if (KB.normalizeDrug(h)) n++; });
    return n >= 2;
  };

  function parseAstValue(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return { mic: null, sir: null };
    let sir = E.normalizeSIR(s);
    let mic = null;
    if (!sir || /[0-9]/.test(s)) {
      const m = s.match(/(<=|≤|<|>=|≥|>)?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/);
      if (m) mic = (m[1] || '') + m[2].replace(/\s+/g, '');
    }
    if (!sir) {
      const sm = s.match(/\b(R|I|S)\b/i);
      if (sm) sir = E.normalizeSIR(sm[1]);
    }
    return { mic: mic, sir: sir };
  }

  E.parseAstTable = function (text, filename) {
    const parsed = E.parseDelimited(text);
    if (!parsed.headers.length) throw new Error('The phenotype file is empty.');
    const cols = E.detectAstColumns(parsed.headers);
    const fallbackId = (filename || 'Sample').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-');
    const map = {};
    function ensure(id, species) {
      id = (id || fallbackId).replace(/\s+/g, '-');
      if (!map[id]) map[id] = { id: id, species: species || '', source: '', collectionDate: '', location: '', notes: '', genes: [], phenotypes: [], images: [] };
      if (!map[id].species && species) map[id].species = species;
      return map[id];
    }
    function addPheno(isolate, drugRaw, micRaw, sirRaw, method, note, date) {
      const canonical = KB.normalizeDrug(drugRaw);
      const drugId = canonical || E.slug(drugRaw);
      const drugName = canonical ? E.drugInfo(canonical).name : String(drugRaw || '').trim();
      if (!drugId) return;
      let sir = E.normalizeSIR(sirRaw);
      let mic = micRaw == null ? null : String(micRaw).trim();
      let sirSource = sir ? 'reported' : null;
      let conf = sir ? 0.9 : 0.5;
      let interpNote = '';
      if (!sir && mic) {
        const r = E.interpretMIC(drugId, mic, isolate.species);
        if (r.sir) { sir = r.sir; sirSource = 'interpreted'; conf = r.confidence; interpNote = r.note; }
      }
      if (!sir && !mic) return;
      isolate.phenotypes.push({
        drug: drugId, drugName: drugName, rawDrug: drugRaw, mic: mic, sir: sir, sirSource: sirSource,
        method: method || '', note: [note, interpNote].filter(Boolean).join(' '), date: date || '', confidence: conf
      });
    }

    if (cols.drug && (cols.mic || cols.sir)) {
      parsed.rows.forEach(function (row) {
        const id = cols.isolate ? String(row[cols.isolate] || '').trim() : fallbackId;
        const species = cols.species ? String(row[cols.species] || '').trim() : '';
        const isolate = ensure(id, species);
        addPheno(isolate, row[cols.drug], cols.mic ? row[cols.mic] : null, cols.sir ? row[cols.sir] : null,
          cols.method ? row[cols.method] : '', cols.note ? row[cols.note] : '', cols.date ? row[cols.date] : '');
      });
    } else {
      // wide format: isolate + one column per drug
      const drugCols = parsed.headers.filter(function (h) {
        if (cols.isolate && h === cols.isolate) return false;
        if (cols.species && h === cols.species) return false;
        return !!KB.normalizeDrug(h);
      });
      if (!drugCols.length) throw new Error('Could not identify drug columns. Use a long format (isolate, drug, MIC/SIR) or name columns with drug names.');
      parsed.rows.forEach(function (row) {
        const id = cols.isolate ? String(row[cols.isolate] || '').trim() : fallbackId;
        const species = cols.species ? String(row[cols.species] || '').trim() : '';
        const isolate = ensure(id, species);
        drugCols.forEach(function (h) {
          const v = parseAstValue(row[h]);
          if (v.mic || v.sir) addPheno(isolate, h, v.mic, v.sir, cols.method ? row[cols.method] : '', '', cols.date ? row[cols.date] : '');
        });
      });
    }
    return {
      isolates: Object.keys(map).map(function (k) { return map[k]; }),
      warnings: [],
      columns: cols,
      rowCount: parsed.rows.length,
      kind: 'ast'
    };
  };

  /* ---------- narrative parsing ---------- */
  const GENE_PATTERNS = [
    /bla[A-Z0-9-]+/gi,
    /aac\([^)]+\)-[A-Za-z0-9'′]+/gi,
    /ant\([^)]+\)-[A-Za-z0-9'′]+/gi,
    /aph\([^)]+\)-[A-Za-z0-9'′]+/gi,
    /mcr-\d+(?:\.\d+)?/gi,
    /van[A-C][A-Z]?/gi,
    /mec[AC]/gi,
    /tet\([A-Z]\)/gi,
    /erm\([A-Z]\)/gi,
    /msr[A-Z]?/gi,
    /gyrA[_-][A-Z]\d+[A-Z]/gi,
    /parC[_-][A-Z]\d+[A-Z]/gi,
    /grlA[_-][A-Z]\d+[A-Z]/gi,
    /rpoB[_-][A-Z]\d+[A-Z]/gi,
    /armA|rmt[A-H]|npmA/gi,
    /sul[123]|dfr[A-Z]?\d*/gi,
    /cat[A-Z]?\d*|cmlA|floR/gi,
    /fos[A-Z]?\d*/gi,
    /qnr[A-S]\d*/gi,
    /oqxAB|qepA/gi,
    /optrA|poxtA|cfr/gi,
    /ompK35|ompK36|oprD|mexAB-oprM|adeABC/gi
  ];
  function extractGenes(text) {
    const found = [];
    GENE_PATTERNS.forEach(function (re) {
      const m = String(text).match(re);
      if (m) m.forEach(function (x) { if (found.indexOf(x) < 0) found.push(x); });
    });
    return found;
  }
  function extractPhenotypes(text) {
    const out = [];
    const lines = String(text).split(/\n|;/).map(function (l) { return l.trim(); }).filter(Boolean);
    const aliases = Object.keys(KB.DRUG_ALIASES).sort(function (a, b) { return b.length - a.length; });
    lines.forEach(function (line) {
      const lower = line.toLowerCase();
      aliases.forEach(function (alias) {
        if (alias.length < 4) return;
        const re = new RegExp('(^|[^a-z0-9])' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i');
        const idx = lower.search(re);
        if (idx < 0) return;
        const window = line.slice(idx, idx + alias.length + 70);
        const micM = window.match(/(?:mic\s*[:=]?\s*)?((?:<=|≤|<|>=|≥|>)?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/i);
        const sirM = window.match(/\b(R|I|S)\b/i);
        if (!micM && !sirM) return;
        // avoid treating the leading number of a date or isolate as MIC
        const mic = micM ? micM[1].replace(/\s+/g, '') : null;
        const sir = sirM ? E.normalizeSIR(sirM[1]) : null;
        if (!mic && !sir) return;
        out.push({ drugRaw: alias, mic: mic, sir: sir, line: line });
      });
    });
    // de-duplicate by canonical drug, prefer the entry with SIR
    const by = {};
    out.forEach(function (o) {
      const id = KB.normalizeDrug(o.drugRaw) || E.slug(o.drugRaw);
      if (!by[id] || (!by[id].sir && o.sir)) by[id] = o;
    });
    return Object.keys(by).map(function (k) { return by[k]; });
  }
  function noteMechanisms(text) {
    const t = String(text || '');
    const mechs = [];
    function add(id, reason, confidence) { mechs.push({ id: id, reason: reason, confidence: confidence }); }
    if (/(porin|ompk35|ompk36|ompc|ompf|oprd)[^.]{0,50}(loss|deficien|reduced|absent|downregulat)/i.test(t) && !/not assessed|not tested|unknown/i.test(t)) {
      add('porin-loss', 'Porin loss / reduced permeability mentioned in the narrative.', 0.62);
    }
    if (/(efflux|mexab-oprm|mexxy|adeabc|acrab)[^.]{0,50}(overexpression|overexpress|upregulat|increased|derepress)/i.test(t)) {
      add('efflux', 'Efflux pump overexpression mentioned in the narrative.', 0.6);
    }
    if (/(ampc)[^.]{0,40}(derepress|overexpress|hyperproduc|constitutive)/i.test(t)) {
      add('ampc-overexpression', 'AmpC derepression / overexpression mentioned in the narrative.', 0.7);
    }
    if (/(d-?test)[^.]{0,20}positive|inducible clindamycin/i.test(t)) {
      mechs.push({ id: 'inducible-mlsb', reason: 'D-test positive: inducible clindamycin resistance.', confidence: 0.8 });
    }
    return mechs;
  }
  E.noteMechanisms = noteMechanisms;

  E.parseNarrative = function (text, filename) {
    const raw = String(text || '').replace(/\r\n?/g, '\n');
    if (!raw.trim()) throw new Error('The narrative is empty.');
    const lines = raw.split('\n');
    const sections = [];
    let current = null;
    function start(id, rest) {
      current = { id: (id || ('Narrative-' + (sections.length + 1))).replace(/\s+/g, '-'), lines: [], header: rest || '' };
      sections.push(current);
    }
    lines.forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed) return;
      let m = trimmed.match(/^(?:isolate|sample|strain|id)\s*[:#-]\s*([A-Za-z0-9_.-]+)\s*(.*)$/i);
      if (!m) m = trimmed.match(/^([A-Z]{2,5}-\d{2,6})\b[\s:|-]*(.*)$/);
      if (m) { start(m[1], m[2]); return; }
      if (!current) start('Narrative-1', '');
      current.lines.push(trimmed);
    });
    if (!sections.length) start('Narrative-1', '');
    const isolates = sections.map(function (sec) {
      const body = sec.lines.join('\n');
      const full = (sec.header ? sec.header + '\n' : '') + body;
      const isolate = {
        id: sec.id, species: '', source: '', collectionDate: '', location: '',
        notes: full.trim(), genes: [], phenotypes: [], images: []
      };
      const sp = full.match(/\b(Escherichia coli|Klebsiella pneumoniae|Klebsiella oxytoca|Enterobacter cloacae|Pseudomonas aeruginosa|Acinetobacter baumannii|Staphylococcus aureus|Enterococcus faecium|Enterococcus faecalis|Proteus mirabilis)\b/i);
      if (sp) isolate.species = E.titleCase(sp[1]);
      const src = full.match(/\b(urine|blood|sputum|BAL|wound|skin|CSF|abscess|catheter|stool|respiratory)\b/i);
      if (src) isolate.source = E.titleCase(src[1]);
      const date = full.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
      if (date) isolate.collectionDate = date[1];
      extractGenes(full).forEach(function (sym) {
        const entry = KB.resolveGene(sym);
        isolate.genes.push({
          symbol: sym, name: entry ? entry.display : sym, class: entry ? entry.class : '',
          subclass: entry ? entry.subclass : '', mechanism: entry ? entry.mechanism : '',
          identity: null, coverage: null, contig: '', method: 'NARRATIVE', product: '', scope: 'narrative', type: 'AMR'
        });
      });
      extractPhenotypes(full).forEach(function (ph) {
        const canonical = KB.normalizeDrug(ph.drugRaw);
        const drugId = canonical || E.slug(ph.drugRaw);
        let sir = ph.sir;
        let conf = sir ? 0.7 : 0.5;
        let note = 'Parsed from narrative.';
        if (!sir && ph.mic) {
          const r = E.interpretMIC(drugId, ph.mic, isolate.species);
          if (r.sir) { sir = r.sir; conf = 0.65; note = 'MIC interpreted from narrative. ' + r.note; }
        }
        if (sir || ph.mic) {
          isolate.phenotypes.push({
            drug: drugId, drugName: canonical ? E.drugInfo(canonical).name : ph.drugRaw,
            rawDrug: ph.drugRaw, mic: ph.mic, sir: sir, sirSource: ph.sir ? 'reported' : (sir ? 'interpreted' : null),
            method: 'Narrative', note: note, date: '', confidence: conf
          });
        }
      });
      return isolate;
    });
    return {
      isolates: isolates,
      warnings: ['Narrative parsing is heuristic. Review extracted genes and phenotypes before analysis.'],
      kind: 'narrative',
      notes: noteMechanisms(raw)
    };
  };

  /* ---------- merge / normalize dataset ---------- */
  E.normalizeIsolate = function (iso) {
    iso.id = String(iso.id || 'Unnamed').trim().replace(/\s+/g, '-');
    iso.species = iso.species || 'Unspecified organism';
    iso.source = iso.source || 'Not recorded';
    iso.collectionDate = iso.collectionDate || '';
    iso.location = iso.location || '';
    iso.notes = iso.notes || '';
    iso.genes = iso.genes || [];
    iso.phenotypes = iso.phenotypes || [];
    iso.images = iso.images || [];
    iso.genes.forEach(function (g) {
      g.symbol = String(g.symbol || g.name || '').trim();
      g.identity = g.identity == null || g.identity === '' ? null : Number(g.identity);
      g.coverage = g.coverage == null || g.coverage === '' ? null : Number(g.coverage);
      if (isNaN(g.identity)) g.identity = null;
      if (isNaN(g.coverage)) g.coverage = null;
      const entry = KB.resolveGene(g.symbol, g);
      g.resolvedId = entry ? entry.id : null;
      if (!g.mechanism && entry) g.mechanism = entry.mechanism;
      if (!g.class && entry) g.class = entry.class;
      if (!g.subclass && entry) g.subclass = entry.subclass;
    });
    iso.phenotypes.forEach(function (p) {
      p.drug = p.drug || E.slug(p.drugName || p.rawDrug);
      p.drugName = p.drugName || E.drugInfo(p.drug).name;
      p.sir = E.normalizeSIR(p.sir);
      p.confidence = p.confidence == null ? (p.sir ? 0.9 : 0.5) : p.confidence;
      if (p.sir && !p.sirSource) p.sirSource = 'reported';
      if (!p.sir && p.mic) {
        const r = E.interpretMIC(p.drug, p.mic, iso.species);
        if (r.sir) { p.sir = r.sir; p.sirSource = 'interpreted'; p.confidence = r.confidence; p.note = [p.note, r.note].filter(Boolean).join(' '); }
      }
    });
    return iso;
  };

  E.mergeDataset = function (base, incoming, opts) {
    opts = opts || {};
    if (!base || opts.replace) {
      const ds = {
        id: (base && base.id) || 'ds-' + Date.now(),
        name: opts.name || (base && base.name) || (incoming.name || 'Imported dataset'),
        description: opts.description || (base && base.description) || '',
        createdAt: (base && base.createdAt) || new Date().toISOString(),
        source: opts.source || (base && base.source) || 'User import',
        images: (base && base.images) || [],
        isolates: []
      };
      // Merge duplicate isolate IDs within the incoming batch (for example an
      // AMRFinderPlus table plus an AST table that both describe the same isolate).
      return E.mergeDataset(ds, incoming, {});
    }
    const ds = JSON.parse(JSON.stringify(base));
    const index = {};
    ds.isolates.forEach(function (iso) { index[iso.id.toLowerCase()] = iso; });
    (incoming.isolates || []).forEach(function (raw) {
      const iso = E.normalizeIsolate(JSON.parse(JSON.stringify(raw)));
      const existing = index[iso.id.toLowerCase()];
      if (!existing) {
        ds.isolates.push(iso);
        index[iso.id.toLowerCase()] = iso;
        return;
      }
      if (iso.species && /unspecified|^$/i.test(existing.species || '')) existing.species = iso.species;
      if (iso.source && /not recorded|^$/i.test(existing.source || '')) existing.source = iso.source;
      if (iso.collectionDate) existing.collectionDate = iso.collectionDate;
      if (iso.location) existing.location = iso.location;
      if (iso.notes) existing.notes = [existing.notes, iso.notes].filter(Boolean).join('\n');
      const gseen = {};
      existing.genes.forEach(function (g) { gseen[(g.symbol + '|' + (g.contig || '')).toLowerCase()] = true; });
      iso.genes.forEach(function (g) {
        const k = (g.symbol + '|' + (g.contig || '')).toLowerCase();
        if (!gseen[k]) { existing.genes.push(g); gseen[k] = true; }
      });
      const pseen = {};
      existing.phenotypes.forEach(function (p) { pseen[p.drug] = true; });
      iso.phenotypes.forEach(function (p) {
        if (pseen[p.drug]) {
          const i = existing.phenotypes.findIndex(function (x) { return x.drug === p.drug; });
          if (i >= 0 && (!existing.phenotypes[i].sir || p.sir)) existing.phenotypes[i] = p;
        } else { existing.phenotypes.push(p); pseen[p.drug] = true; }
      });
      if (iso.images && iso.images.length) existing.images = (existing.images || []).concat(iso.images);
    });
    if (incoming.images && incoming.images.length) ds.images = (ds.images || []).concat(incoming.images);
    return ds;
  };

  /* ---------- image handling ---------- */
  E.fileToImage = function (file, maxSize) {
    maxSize = maxSize || 1200;
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          let w = img.width, h = img.height;
          const scale = Math.min(1, maxSize / Math.max(w, h));
          w = Math.round(w * scale); h = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.84), width: w, height: h, name: file.name, size: file.size, type: file.type });
        };
        img.onerror = function () { reject(new Error('Could not read image ' + file.name)); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('Could not read file ' + file.name)); };
      reader.readAsDataURL(file);
    });
  };

  E.autoDetect = function (text, filename) {
    const parsed = E.parseDelimited(text);
    if (E.looksLikeAmr(parsed.headers)) return 'amr';
    if (E.looksLikeAst(parsed.headers)) return 'ast';
    return 'narrative';
  };

  AMR.Engine = E;
})(window.AMR);
