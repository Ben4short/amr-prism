/* =========================================================================
   AMR Prism — dependency-free SVG chart library
   All charts are inline SVG so they render in the app, chat, and PDF.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';
  const C = {};
  let uid = 0;
  function id(prefix) { uid++; return (prefix || 'c') + uid; }

  const THEMES = {
    dark: { text: '#dcebf5', muted: '#8aa4ba', faint: '#647f96', grid: '#1e3448', panel: '#0c1a28', panel2: '#102233', bg: 'transparent', line: '#1b3449' },
    light: { text: '#173042', muted: '#607b8f', faint: '#7b94a6', grid: '#e2eaf1', panel: '#ffffff', panel2: '#f5f9fc', bg: '#ffffff', line: '#d8e4ec' }
  };
  const STATUS = {
    'concordant-r': '#ff6b78', 'concordant-s': '#4ade80', partial: '#f5b84b', silent: '#a78bfa',
    unexplained: '#fb7185', untested: '#647f96', 'no-call': '#647f96',
    R: '#ff6b78', I: '#f5b84b', S: '#4ade80', NT: '#647f96'
  };
  function th(opts) { return THEMES[(opts && opts.theme) || 'dark']; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function svg(w, h, content, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"' + (cls ? ' class="' + cls + '"' : '') + ' role="img">' + content + '</svg>';
  }
  function txt(x, y, s, opts) {
    opts = opts || {};
    return '<text x="' + x + '" y="' + y + '" fill="' + (opts.fill || '#dcebf5') + '" font-size="' + (opts.size || 11) + '" font-family="Segoe UI, Arial, sans-serif" font-weight="' + (opts.weight || 400) + '" text-anchor="' + (opts.anchor || 'start') + '"' + (opts.opacity != null ? ' opacity="' + opts.opacity + '"' : '') + '>' + esc(s) + '</text>';
  }
  function rect(x, y, w, h, opts) {
    opts = opts || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w) + '" height="' + Math.max(0, h) + '" rx="' + (opts.rx || 0) + '" fill="' + (opts.fill || 'none') + '"' + (opts.stroke ? ' stroke="' + opts.stroke + '" stroke-width="' + (opts.sw || 1) + '"' : '') + (opts.opacity != null ? ' opacity="' + opts.opacity + '"' : '') + '>' + (opts.title ? '<title>' + esc(opts.title) + '</title>' : '') + '</rect>';
  }
  function line(x1, y1, x2, y2, opts) {
    opts = opts || {};
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (opts.stroke || '#1e3448') + '" stroke-width="' + (opts.sw || 1) + '"' + (opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : '') + ' />';
  }
  function path(d, opts) {
    opts = opts || {};
    return '<path d="' + d + '" fill="' + (opts.fill || 'none') + '"' + (opts.stroke ? ' stroke="' + opts.stroke + '" stroke-width="' + (opts.sw || 1) + '"' : '') + (opts.opacity != null ? ' opacity="' + opts.opacity + '"' : '') + (opts.linecap ? ' stroke-linecap="' + opts.linecap + '"' : '') + ' />';
  }
  function arc(cx, cy, r, start, end) {
    const s = polar(cx, cy, r, start), e = polar(cx, cy, r, end);
    const large = (end - start) % 360 > 180 ? 1 : 0;
    return 'M ' + cx + ' ' + cy + ' L ' + s.x + ' ' + s.y + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + e.x + ' ' + e.y + ' Z';
  }
  function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function wrapLabel(s, max) {
    s = String(s || '');
    if (s.length <= max) return [s];
    const words = s.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  C.THEMES = THEMES;
  C.STATUS = STATUS;
  C.esc = esc;
  C.th = th;

  /* ---------- donut ---------- */
  C.donut = function (segments, opts) {
    opts = opts || {};
    const t = th(opts);
    const total = segments.reduce(function (a, s) { return a + (Number(s.value) || 0); }, 0) || 1;
    const size = opts.size || 190;
    const cx = size / 2, cy = size / 2, r = size * 0.38, thickness = opts.thickness || size * 0.13;
    const w = opts.legend === false ? size : size + 205;
    const h = Math.max(size, 40 + segments.length * 23);
    let out = '';
    let angle = 0;
    const rOuter = r + thickness / 2, rInner = r - thickness / 2;
    segments.forEach(function (s) {
      const val = Number(s.value) || 0;
      if (!val) return;
      const sweep = (val / total) * 360;
      const a0 = angle, a1 = angle + Math.min(359.999, sweep);
      const p0 = polar(cx, cy, rOuter, a0), p1 = polar(cx, cy, rOuter, a1);
      const p2 = polar(cx, cy, rInner, a1), p3 = polar(cx, cy, rInner, a0);
      const large = sweep > 180 ? 1 : 0;
      const d = 'M ' + p0.x + ' ' + p0.y + ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + p1.x + ' ' + p1.y + ' L ' + p2.x + ' ' + p2.y + ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + p3.x + ' ' + p3.y + ' Z';
      out += '<path d="' + d + '" fill="' + (s.color || '#39e0c4') + '" opacity="' + (s.opacity == null ? 1 : s.opacity) + '"><title>' + esc(s.label + ': ' + val) + '</title></path>';
      angle += sweep;
    });
    out += txt(cx, cy - 3, opts.centerValue != null ? opts.centerValue : total, { fill: t.text, size: opts.centerSize || 26, weight: 700, anchor: 'middle' });
    out += txt(cx, cy + 16, opts.centerLabel || 'total', { fill: t.muted, size: 9, weight: 600, anchor: 'middle' });
    if (opts.legend !== false) {
      const lx = size + 6;
      segments.forEach(function (s, i) {
        const y = 18 + i * 23;
        out += rect(lx, y - 8, 9, 9, { fill: s.color || '#39e0c4', rx: 2 });
        out += txt(lx + 16, y, s.label, { fill: t.text, size: 10.5 });
        out += txt(w - 4, y, (s.value != null ? s.value : ''), { fill: t.muted, size: 10.5, anchor: 'end', weight: 600 });
      });
    }
    return svg(w, h, out);
  };

  /* ---------- horizontal bars ---------- */
  C.bars = function (data, opts) {
    opts = opts || {};
    const t = th(opts);
    const w = opts.width || 460;
    const rowH = opts.rowH || 27;
    const labelW = opts.labelW || 150;
    const pad = 10;
    const h = Math.max(60, data.length * rowH + 18);
    const max = opts.max != null ? opts.max : Math.max.apply(null, data.map(function (d) { return Number(d.value) || 0; }).concat([1]));
    let out = '';
    if (opts.grid !== false) {
      for (let i = 0; i <= 4; i++) {
        const x = labelW + (w - labelW - 48) * (i / 4);
        out += line(x, 8, x, h - 18, { stroke: t.grid, sw: 1, dash: '2 4' });
        if (opts.showScale !== false) out += txt(x, h - 5, Math.round(max * i / 4), { fill: t.faint, size: 8, anchor: 'middle' });
      }
    }
    data.forEach(function (d, i) {
      const y = 12 + i * rowH;
      const barMax = w - labelW - 48;
      const val = Number(d.value) || 0;
      const bw = max ? (val / max) * barMax : 0;
      const label = String(d.label || '');
      const lines = wrapLabel(label, opts.labelChars || 24);
      lines.forEach(function (ln, li) {
        out += txt(labelW - 8, y + 11 + li * 10, ln, { fill: t.text, size: 9.5, anchor: 'end' });
      });
      out += rect(labelW, y + 2, barMax, 14, { fill: t.panel2, rx: 3 });
      out += rect(labelW, y + 2, bw, 14, { fill: d.color || opts.color || '#39e0c4', rx: 3, title: label + ': ' + (opts.valueFormat ? opts.valueFormat(val) : val) });
      out += txt(labelW + bw + 6, y + 13, opts.valueFormat ? opts.valueFormat(val) : val, { fill: t.muted, size: 9.5, weight: 600 });
    });
    return svg(w, h, out);
  };

  /* ---------- stacked bars by isolate ---------- */
  C.stackedBars = function (rows, opts) {
    opts = opts || {};
    const t = th(opts);
    const w = opts.width || 560;
    const rowH = opts.rowH || 30;
    const labelW = opts.labelW || 90;
    const h = rows.length * rowH + 28;
    const keys = opts.keys || [];
    const colors = opts.colors || {};
    const max = opts.max || Math.max.apply(null, rows.map(function (r) { return r.segments.reduce(function (a, s) { return a + (s.value || 0); }, 0); }).concat([1]));
    let out = '';
    keys.forEach(function (k, i) {
      const x = labelW + i * 110;
      out += rect(x, 2, 8, 8, { fill: colors[k] || '#39e0c4', rx: 2 });
      out += txt(x + 12, 9, k, { fill: t.muted, size: 8.5 });
    });
    rows.forEach(function (r, i) {
      const y = 20 + i * rowH;
      const total = r.segments.reduce(function (a, s) { return a + (s.value || 0); }, 0);
      const barW = w - labelW - 40;
      let x = labelW;
      out += txt(labelW - 8, y + 14, r.label, { fill: t.text, size: 9.5, anchor: 'end', weight: 600 });
      out += rect(labelW, y + 4, barW, 14, { fill: t.panel2, rx: 3 });
      r.segments.forEach(function (s) {
        const sw = total ? (s.value / max) * barW : 0;
        if (sw > 0) {
          out += rect(x, y + 4, Math.max(1, sw), 14, { fill: s.color || colors[s.key] || '#39e0c4', rx: 0, title: r.label + ' · ' + s.key + ': ' + s.value });
          x += sw;
        }
      });
      out += txt(w - 4, y + 14, total, { fill: t.muted, size: 9, anchor: 'end' });
    });
    return svg(w, h, out);
  };

  /* ---------- heatmap ---------- */
  C.heatmap = function (rows, cols, opts) {
    opts = opts || {};
    const t = th(opts);
    const cell = opts.cell || 27;
    const labelW = opts.labelW || 110;
    const top = opts.top || 78;
    const w = labelW + cols.length * cell + 8;
    const h = top + rows.length * cell + (opts.legend === false ? 8 : 44);
    let out = '';
    // column labels
    cols.forEach(function (c, j) {
      const x = labelW + j * cell + cell / 2;
      const label = String(c.label || c);
      const maxChars = opts.colChars || 12;
      const lines = wrapLabel(label, maxChars);
      lines.forEach(function (ln, li) {
        out += '<text x="' + x + '" y="' + (top - 10 - (lines.length - 1 - li) * 10) + '" fill="' + t.muted + '" font-size="8.5" font-family="Segoe UI, Arial, sans-serif" text-anchor="end" transform="rotate(-45 ' + x + ' ' + (top - 10 - (lines.length - 1 - li) * 10) + ')">' + esc(ln) + '</text>';
      });
    });
    rows.forEach(function (r, i) {
      const y = top + i * cell;
      out += txt(labelW - 8, y + cell / 2 + 3, String(r.label || r).slice(0, opts.rowChars || 22), { fill: t.text, size: 9.5, anchor: 'end' });
      cols.forEach(function (c, j) {
        const val = opts.get(r, c, i, j);
        const color = opts.color ? opts.color(val, r, c) : (val ? '#39e0c4' : 'rgba(255,255,255,.03)');
        const text = opts.text ? opts.text(val, r, c) : (val ? String(val) : '');
        const x = labelW + j * cell;
        out += '<g class="matrix-cell"><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cell - 2) + '" height="' + (cell - 2) + '" rx="3" fill="' + color + '" opacity="' + (opts.opacity ? opts.opacity(val) : 1) + '"><title>' + esc(String(r.label || r) + ' · ' + String(c.label || c) + ': ' + String(text || (val ? 'present' : 'absent'))) + '</title></rect>' +
          (text ? txt(x + cell / 2, y + cell / 2 + 3, text, { fill: opts.textFill ? opts.textFill(val) : '#06121c', size: opts.textSize || 9, weight: 700, anchor: 'middle' }) : '') + '</g>';
      });
    });
    if (opts.legend !== false && opts.legendItems) {
      let x = labelW;
      const y = h - 16;
      opts.legendItems.forEach(function (it) {
        out += rect(x, y - 8, 9, 9, { fill: it.color, rx: 2 });
        out += txt(x + 13, y, it.label, { fill: t.muted, size: 8.5 });
        x += 13 + String(it.label).length * 5.2 + 14;
      });
    }
    return svg(w, h, out);
  };

  /* ---------- radar ---------- */
  C.radar = function (labels, series, opts) {
    opts = opts || {};
    const t = th(opts);
    const size = opts.size || 300;
    const cx = size / 2, cy = size / 2 + 2, r = size * 0.32;
    const n = labels.length || 1;
    const w = size, h = size + 26;
    let out = '';
    for (let ring = 1; ring <= 4; ring++) {
      const rr = r * ring / 4;
      let d = '';
      for (let i = 0; i < n; i++) {
        const p = polar(cx, cy, rr, i * 360 / n);
        d += (i === 0 ? 'M ' : 'L ') + p.x + ' ' + p.y + ' ';
      }
      d += 'Z';
      out += path(d, { stroke: t.grid, sw: 1 });
    }
    labels.forEach(function (l, i) {
      const p = polar(cx, cy, r, i * 360 / n);
      out += line(cx, cy, p.x, p.y, { stroke: t.grid, sw: 1 });
      const lp = polar(cx, cy, r + 20, i * 360 / n);
      out += txt(lp.x, lp.y + 3, l, { fill: t.muted, size: 8.5, anchor: Math.abs(lp.x - cx) < 8 ? 'middle' : (lp.x > cx ? 'start' : 'end') });
    });
    series.forEach(function (s) {
      let d = '';
      s.values.forEach(function (v, i) {
        const p = polar(cx, cy, r * Math.max(0, Math.min(1, v)), i * 360 / n);
        d += (i === 0 ? 'M ' : 'L ') + p.x + ' ' + p.y + ' ';
      });
      d += 'Z';
      out += path(d, { fill: s.color || '#39e0c4', stroke: s.color || '#39e0c4', sw: 1.5, opacity: s.fillOpacity == null ? 0.16 : s.fillOpacity });
      s.values.forEach(function (v, i) {
        const p = polar(cx, cy, r * Math.max(0, Math.min(1, v)), i * 360 / n);
        out += '<circle cx="' + p.x + '" cy="' + p.y + '" r="2.2" fill="' + (s.color || '#39e0c4') + '"><title>' + esc(labels[i] + ': ' + Math.round(v * 100) + '%') + '</title></circle>';
      });
    });
    return svg(w, h, out);
  };

  /* ---------- annotated mechanism flow ---------- */
  C.flow = function (groups, opts) {
    opts = opts || {};
    const t = th(opts);
    const w = opts.width || 760;
    const rowH = opts.rowH || 82;
    const h = Math.max(80, groups.length * rowH + 34);
    const colGene = 18, colMech = 236, colDrug = 476, colStatus = 690;
    const geneW = 196, mechW = 216, drugW = 194;
    let out = '';
    out += txt(colGene, 13, 'DETECTED / INFERRED', { fill: t.faint, size: 8, weight: 700 });
    out += txt(colMech, 13, 'MECHANISM', { fill: t.faint, size: 8, weight: 700 });
    out += txt(colDrug, 13, 'DRUG CLASS / EFFECT', { fill: t.faint, size: 8, weight: 700 });
    out += txt(colStatus, 13, 'PHENOTYPE', { fill: t.faint, size: 8, weight: 700 });
    groups.forEach(function (g, i) {
      const y = 26 + i * rowH;
      const statusColor = STATUS[g.status] || (g.status === 'R' ? STATUS.R : g.status === 'S' ? STATUS.S : '#7dd3fc');
      const geneLines = wrapLabel(g.gene, 24);
      const mechLines = wrapLabel(g.mechanism, 30);
      out += rect(colGene, y, geneW, 54, { fill: t.panel2, stroke: statusColor, sw: 1, rx: 7, opacity: 0.95 });
      geneLines.forEach(function (ln, li) { out += txt(colGene + 10, y + 18 + li * 12, ln, { fill: t.text, size: 10.5, weight: 650 }); });
      out += txt(colGene + 10, y + 46, (g.geneSub || '').slice(0, 28), { fill: t.faint, size: 8 });
      // arrow 1
      const midY = y + 27;
      out += path('M ' + (colGene + geneW + 3) + ' ' + midY + ' C ' + (colGene + geneW + 18) + ' ' + midY + ', ' + (colMech - 18) + ' ' + midY + ', ' + (colMech - 3) + ' ' + midY, { stroke: statusColor, sw: 1.5, opacity: 0.8 });
      out += '<polygon points="' + (colMech - 3) + ',' + midY + ' ' + (colMech - 10) + ',' + (midY - 4) + ' ' + (colMech - 10) + ',' + (midY + 4) + '" fill="' + statusColor + '"/>';
      out += rect(colMech, y, mechW, 54, { fill: t.panel2, stroke: t.line, sw: 1, rx: 7 });
      mechLines.forEach(function (ln, li) { out += txt(colMech + 10, y + 18 + li * 12, ln, { fill: t.text, size: 10, weight: 600 }); });
      out += txt(colMech + 10, y + 46, (g.mechanismSub || g.action || '').slice(0, 36), { fill: t.faint, size: 8 });
      // arrow 2
      out += path('M ' + (colMech + mechW + 3) + ' ' + midY + ' C ' + (colMech + mechW + 18) + ' ' + midY + ', ' + (colDrug - 18) + ' ' + midY + ', ' + (colDrug - 3) + ' ' + midY, { stroke: statusColor, sw: 1.5, opacity: 0.8 });
      out += '<polygon points="' + (colDrug - 3) + ',' + midY + ' ' + (colDrug - 10) + ',' + (midY - 4) + ' ' + (colDrug - 10) + ',' + (midY + 4) + '" fill="' + statusColor + '"/>';
      out += rect(colDrug, y, drugW, 54, { fill: t.panel2, stroke: t.line, sw: 1, rx: 7 });
      const targetLines = wrapLabel(g.target || g.drug || '', 26);
      targetLines.forEach(function (ln, li) { out += txt(colDrug + 10, y + 18 + li * 12, ln, { fill: t.text, size: 10, weight: 600 }); });
      out += txt(colDrug + 10, y + 46, (g.effectLabel || g.predicted || '').slice(0, 34), { fill: statusColor, size: 8.5, weight: 700 });
      // status pill
      out += rect(colStatus, y + 12, 56, 30, { fill: statusColor, rx: 6, opacity: 0.16 });
      out += txt(colStatus + 28, y + 31, g.statusLabel || g.status || '—', { fill: statusColor, size: 10, weight: 700, anchor: 'middle' });
      if (g.confidence != null) out += txt(colStatus + 28, y + 51, Math.round(g.confidence * 100) + '% conf.', { fill: t.faint, size: 7.5, anchor: 'middle' });
    });
    return svg(w, h, out);
  };

  /* ---------- compact evidence chain for one finding ---------- */
  C.evidenceChain = function (finding, opts) {
    opts = opts || {};
    const t = th(opts);
    const w = 760, h = 158;
    const color = STATUS[finding.status] || '#7dd3fc';
    let out = '';
    const boxes = [
      { x: 14, label: 'GENE', value: finding.supports.length ? finding.supports[0].display : 'No detected determinant', sub: finding.supports.length ? (finding.supports[0].mechanism || '') : 'database-limited', color: finding.supports.length ? '#7dd3fc' : t.faint },
      { x: 202, label: 'MECHANISM', value: finding.supports.length ? (finding.supports[0].mechanism || '') : 'unknown / unmeasured', sub: finding.supports.length ? (finding.supports[0].action || '').slice(0, 46) : 'target mutation, porin, efflux, or uncharacterized', color: '#a78bfa' },
      { x: 390, label: 'DRUG', value: finding.drugName, sub: finding.drugClassLabel, color: '#39e0c4' },
      { x: 578, label: 'OBSERVED', value: finding.observed || 'not tested', sub: finding.observedMic ? 'MIC ' + finding.observedMic + ' mg/L' : 'no MIC', color: finding.observed ? STATUS[finding.observed] : t.faint }
    ];
    boxes.forEach(function (b, i) {
      out += rect(b.x, 26, 168, 78, { fill: t.panel2, stroke: b.color, sw: 1.2, rx: 8 });
      out += txt(b.x + 10, 42, b.label, { fill: t.faint, size: 7.5, weight: 700 });
      wrapLabel(b.value, 22).forEach(function (ln, li) { out += txt(b.x + 10, 58 + li * 12, ln, { fill: t.text, size: 9.5, weight: 650 }); });
      out += txt(b.x + 10, 94, String(b.sub || '').slice(0, 32), { fill: t.muted, size: 7.5 });
      if (i < boxes.length - 1) {
        const ax = b.x + 170, ay = 65;
        out += path('M ' + ax + ' ' + ay + ' L ' + (ax + 15) + ' ' + ay, { stroke: color, sw: 1.5, opacity: 0.8 });
        out += '<polygon points="' + (ax + 17) + ',' + ay + ' ' + (ax + 10) + ',' + (ay - 4) + ' ' + (ax + 10) + ',' + (ay + 4) + '" fill="' + color + '"/>';
      }
    });
    out += rect(14, 118, 732, 26, { fill: color, rx: 5, opacity: 0.12 });
    out += txt(26, 135, finding.statusLabel + ' · ' + finding.confidenceLabel + ' confidence (' + Math.round(finding.confidence * 100) + '%) · predicted ' + finding.predictedLabel, { fill: color, size: 9.5, weight: 650 });
    out += txt(742, 135, 'AMR Prism', { fill: t.faint, size: 7.5, anchor: 'end' });
    return svg(w, h, out);
  };

  /* ---------- mini horizontal bar for KPI / report ---------- */
  C.progress = function (value, opts) {
    opts = opts || {};
    const t = th(opts);
    const w = opts.width || 120, h = 7;
    const v = Math.max(0, Math.min(1, value || 0));
    return svg(w, h, rect(0, 0, w, h, { fill: t.panel2, rx: 4 }) + rect(0, 0, w * v, h, { fill: opts.color || '#39e0c4', rx: 4 }));
  };

  /* ---------- species distribution (compact) ---------- */
  C.speciesBars = function (data, opts) {
    return C.bars(data.map(function (d) { return { label: d.label, value: d.count, color: '#7dd3fc' }; }), Object.assign({ valueFormat: function (v) { return v; } }, opts || {}));
  };

  AMR.Charts = C;
})(window.AMR);
