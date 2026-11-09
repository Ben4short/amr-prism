/* =========================================================================
   AMR Prism — minimal, dependency-free PDF writer
   Generates real PDF files with text, vector tables, and embedded JPEG charts.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const A4 = { width: 595.28, height: 841.89 };
  let measureCanvas = null;
  function measure(text, size, bold) {
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    ctx.font = (bold ? '700 ' : '400 ') + size + 'px Helvetica, Arial, sans-serif';
    return ctx.measureText(String(text || '')).width;
  }
  function safe(text) {
    return String(text == null ? '' : text)
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/→/g, '->').replace(/←/g, '<-').replace(/↔/g, '<->')
      .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≈/g, '~').replace(/±/g, '+/-')
      .replace(/[–—]/g, '-').replace(/[’‘′]/g, "'").replace(/[“”″]/g, '"')
      .replace(/•/g, '-').replace(/·/g, '-').replace(/×/g, 'x').replace(/°/g, ' deg').replace(/µ/g, 'u')
      .replace(/−/g, '-').replace(/…/g, '...').replace(/\u00a0/g, ' ')
      .replace(/β/g, 'beta').replace(/α/g, 'alpha').replace(/γ/g, 'gamma').replace(/δ/g, 'delta')
      .replace(/Δ/g, 'delta').replace(/Ω/g, 'ohm').replace(/™|®/g, '')
      .replace(/[^\x20-\x7E]/g, '?');
  }
  function pdfString(text) {
    return safe(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  function wrapText(text, maxWidth, size, bold) {
    const words = safe(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    words.forEach(function (w) {
      const test = cur ? cur + ' ' + w : w;
      if (measure(test, size, bold) <= maxWidth || !cur) cur = test;
      else { lines.push(cur); cur = w; }
      while (measure(cur, size, bold) > maxWidth && cur.length > 1) {
        // hard-break extremely long tokens
        let cut = cur.length - 1;
        while (cut > 1 && measure(cur.slice(0, cut), size, bold) > maxWidth) cut--;
        lines.push(cur.slice(0, cut));
        cur = cur.slice(cut);
      }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }
  function rgb(color) {
    if (Array.isArray(color)) return color.map(function (v) { return (v / 255).toFixed(3); }).join(' ');
    const c = String(color || '#000000').replace('#', '');
    const n = c.length === 3 ? c.split('').map(function (x) { return x + x; }).join('') : c;
    return [parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255].map(function (v) { return v.toFixed(3); }).join(' ');
  }
  function hexToRgb(color) {
    const c = String(color || '#000000').replace('#', '');
    const n = c.length === 3 ? c.split('').map(function (x) { return x + x; }).join('') : c;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }

  class PDFDoc {
    constructor(opts) {
      opts = opts || {};
      this.width = opts.width || A4.width;
      this.height = opts.height || A4.height;
      this.pages = [];
      this.images = [];
      this.chrome = null;
      this.current = null;
      this.addPage();
    }
    addPage(opts) {
      opts = opts || {};
      this.current = { content: [], chrome: opts.chrome !== false };
      this.pages.push(this.current);
      return this.pages.length;
    }
    get page() { return this.current; }
    _add(s) { this.current.content.push(s); }
    _y(yTop) { return this.height - yTop; }

    setChrome(chrome) { this.chrome = chrome; return this; }

    text(text, x, yTop, opts) {
      opts = opts || {};
      const size = opts.size || 10;
      const bold = !!opts.bold;
      const font = bold ? 'F2' : 'F1';
      const color = opts.color || '#173042';
      let xx = x;
      if (opts.align === 'center') xx = x - measure(text, size, bold) / 2;
      else if (opts.align === 'right') xx = x - measure(text, size, bold);
      const baseline = this._y(yTop) - size * 0.8;
      this._add('BT /' + font + ' ' + size + ' Tf ' + rgb(color) + ' rg 1 0 0 1 ' + xx.toFixed(2) + ' ' + baseline.toFixed(2) + ' Tm (' + pdfString(text) + ') Tj ET');
      return yTop + size * 1.18;
    }
    textBlock(text, x, yTop, maxWidth, opts) {
      opts = opts || {};
      const size = opts.size || 10;
      const lh = opts.lineHeight || size * 1.35;
      const lines = wrapText(text, maxWidth, size, !!opts.bold);
      lines.forEach(function (ln, i) {
        this.text(ln, x, yTop + i * lh, opts);
      }, this);
      return yTop + lines.length * lh;
    }
    measure(text, size, bold) { return measure(text, size, bold); }
    wrap(text, maxWidth, size, bold) { return wrapText(text, maxWidth, size, bold); }

    rect(x, yTop, w, h, opts) {
      opts = opts || {};
      const y = this._y(yTop) - h;
      if (opts.fill) {
        this._add(rgb(opts.fill) + ' rg');
        if (opts.rx) this._roundPath(x, y, w, h, opts.rx);
        else this._add(x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re');
        this._add('f');
      }
      if (opts.stroke) {
        this._add(rgb(opts.stroke) + ' RG ' + (opts.sw || 1) + ' w');
        if (opts.rx) this._roundPath(x, y, w, h, opts.rx);
        else this._add(x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re');
        this._add('S');
      }
      return yTop + h;
    }
    _roundPath(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      const k = 0.5522847498 * r;
      this._add((x + r).toFixed(2) + ' ' + y.toFixed(2) + ' m');
      this._add((x + w - r).toFixed(2) + ' ' + y.toFixed(2) + ' l');
      this._add((x + w - r + k).toFixed(2) + ' ' + y.toFixed(2) + ' ' + (x + w).toFixed(2) + ' ' + (y + r - k).toFixed(2) + ' ' + (x + w).toFixed(2) + ' ' + (y + r).toFixed(2) + ' c');
      this._add((x + w).toFixed(2) + ' ' + (y + h - r).toFixed(2) + ' l');
      this._add((x + w).toFixed(2) + ' ' + (y + h - r + k).toFixed(2) + ' ' + (x + w - r + k).toFixed(2) + ' ' + (y + h).toFixed(2) + ' ' + (x + w - r).toFixed(2) + ' ' + (y + h).toFixed(2) + ' c');
      this._add((x + r).toFixed(2) + ' ' + (y + h).toFixed(2) + ' l');
      this._add((x + r - k).toFixed(2) + ' ' + (y + h).toFixed(2) + ' ' + x.toFixed(2) + ' ' + (y + h - r + k).toFixed(2) + ' ' + x.toFixed(2) + ' ' + (y + h - r).toFixed(2) + ' c');
      this._add(x.toFixed(2) + ' ' + (y + r).toFixed(2) + ' l');
      this._add(x.toFixed(2) + ' ' + (y + r - k).toFixed(2) + ' ' + (x + r - k).toFixed(2) + ' ' + y.toFixed(2) + ' ' + (x + r).toFixed(2) + ' ' + y.toFixed(2) + ' c');
    }
    line(x1, y1, x2, y2, opts) {
      opts = opts || {};
      this._add(rgb(opts.color || '#d8e4ec') + ' RG ' + (opts.sw || 1) + ' w');
      if (opts.dash) this._add('[' + opts.dash + '] 0 d');
      this._add(x1.toFixed(2) + ' ' + (this._y(y1)).toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + (this._y(y2)).toFixed(2) + ' l S');
      if (opts.dash) this._add('[] 0 d');
    }
    circle(cx, cyTop, r, opts) {
      opts = opts || {};
      const cy = this._y(cyTop);
      const k = 0.5522847498 * r;
      this._add(rgb(opts.fill || '#39e0c4') + ' rg');
      this._add((cx + r).toFixed(2) + ' ' + cy.toFixed(2) + ' m');
      this._add((cx + r).toFixed(2) + ' ' + (cy + k).toFixed(2) + ' ' + (cx + k).toFixed(2) + ' ' + (cy + r).toFixed(2) + ' ' + cx.toFixed(2) + ' ' + (cy + r).toFixed(2) + ' c');
      this._add((cx - k).toFixed(2) + ' ' + (cy + r).toFixed(2) + ' ' + (cx - r).toFixed(2) + ' ' + (cy + k).toFixed(2) + ' ' + (cx - r).toFixed(2) + ' ' + cy.toFixed(2) + ' c');
      this._add((cx - r).toFixed(2) + ' ' + (cy - k).toFixed(2) + ' ' + (cx - k).toFixed(2) + ' ' + (cy - r).toFixed(2) + ' ' + cx.toFixed(2) + ' ' + (cy - r).toFixed(2) + ' c');
      this._add((cx + k).toFixed(2) + ' ' + (cy - r).toFixed(2) + ' ' + (cx + r).toFixed(2) + ' ' + (cy - k).toFixed(2) + ' ' + (cx + r).toFixed(2) + ' ' + cy.toFixed(2) + ' c f');
      return cyTop + r * 2;
    }
    image(dataUrl, x, yTop, w, h, pixelW, pixelH) {
      if (!dataUrl || dataUrl.indexOf('data:image/jpeg') !== 0) return yTop;
      const name = 'Im' + (this.images.length + 1);
      this.images.push({ name: name, dataUrl: dataUrl, width: pixelW || 1000, height: pixelH || 1000 });
      const y = this._y(yTop) - h;
      this._add('q ' + w.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /' + name + ' Do Q');
      return yTop + h;
    }
    table(opts) {
      const columns = opts.columns;
      const rows = opts.rows;
      const x = opts.x == null ? 40 : opts.x;
      let y = opts.y == null ? 80 : opts.y;
      const width = opts.width || (this.width - 80);
      const fontSize = opts.fontSize || 8;
      const headerSize = opts.headerSize || 7.5;
      const pad = opts.pad || 5;
      const bottom = opts.bottom || 56;
      const headerFill = opts.headerFill || '#eef5f9';
      const headerColor = opts.headerColor || '#33566b';
      const borderColor = opts.borderColor || '#d8e4ec';
      const zebra = opts.zebra == null ? '#f8fbfd' : opts.zebra;
      const colWidths = columns.map(function (c) { return c.width || (width / columns.length); });
      const scale = width / colWidths.reduce(function (a, b) { return a + b; }, 0);
      const widths = colWidths.map(function (w) { return w * scale; });
      let headerRows = 0;

      function drawHeader() {
        const hh = Math.max.apply(null, columns.map(function (c) { return wrapText(c.label, widths[columns.indexOf(c)] - pad * 2, headerSize, true).length * (headerSize * 1.25) + pad * 2; }));
        this.rect(x, y, width, hh, { fill: headerFill });
        let cx = x;
        columns.forEach(function (c, i) {
          this.text(c.label, cx + pad, y + pad + headerSize, { size: headerSize, bold: true, color: headerColor });
          cx += widths[i];
        }, this);
        y += hh;
        headerRows++;
      }

      function ensure(h) {
        if (y + h > this.height - bottom) {
          this.addPage();
          y = 62;
          drawHeader.call(this);
        }
      }

      drawHeader.call(this);
      rows.forEach(function (row, ri) {
        const cells = columns.map(function (c, i) {
          const raw = c.format ? c.format(row[c.key], row) : row[c.key];
          return wrapText(raw == null ? '' : raw, widths[i] - pad * 2, fontSize, !!c.bold);
        });
        const rh = Math.max.apply(null, cells.map(function (lines) { return lines.length * (fontSize * 1.3) + pad * 2; }));
        ensure.call(this, rh);
        if (zebra && ri % 2 === 1) this.rect(x, y, width, rh, { fill: zebra });
        let cx = x;
        cells.forEach(function (lines, i) {
          const c = columns[i];
          lines.forEach(function (ln, li) {
            const tx = c.align === 'right' ? cx + widths[i] - pad : (c.align === 'center' ? cx + widths[i] / 2 : cx + pad);
            this.text(ln, tx, y + pad + fontSize + li * fontSize * 1.3, { size: fontSize, bold: !!c.bold, color: c.color || '#274456', align: c.align === 'right' ? 'right' : (c.align === 'center' ? 'center' : 'left') });
          }, this);
          cx += widths[i];
        }, this);
        y += rh;
        this.line(x, y, x + width, y, { color: borderColor, sw: 0.5 });
      }, this);
      return y;
    }

    addChrome() {
      if (!this.chrome) return;
      this.pages.forEach(function (page, i) {
        if (!page.chrome) return;
        const c = page.content;
        c.push('BT /F1 7 Tf ' + rgb('#7b94a6') + ' rg 1 0 0 1 40 ' + (this.height - 28).toFixed(2) + ' Tm (' + pdfString(this.chrome.title || 'AMR Prism') + ') Tj ET');
        c.push('BT /F1 7 Tf ' + rgb('#7b94a6') + ' rg 1 0 0 1 ' + (this.width - 40 - measure('Page ' + (i + 1) + ' of ' + this.pages.length, 7, false)).toFixed(2) + ' ' + (this.height - 28).toFixed(2) + ' Tm (' + pdfString('Page ' + (i + 1) + ' of ' + this.pages.length) + ') Tj ET');
        c.push(rgb('#e2eaf1') + ' RG 0.5 w 40 ' + (this.height - 36).toFixed(2) + ' m ' + (this.width - 40).toFixed(2) + ' ' + (this.height - 36).toFixed(2) + ' l S');
        c.push('BT /F1 7 Tf ' + rgb('#7b94a6') + ' rg 1 0 0 1 40 28 Tm (' + pdfString(this.chrome.footer || 'Research use only. Verify breakpoints locally.') + ') Tj ET');
        c.push('BT /F1 7 Tf ' + rgb('#7b94a6') + ' rg 1 0 0 1 ' + (this.width - 40 - measure(this.chrome.right || '', 7, false)).toFixed(2) + ' 28 Tm (' + pdfString(this.chrome.right || '') + ') Tj ET');
      }, this);
    }

    save() {
      this.addChrome();
      const objects = [];
      objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      objects[2] = null;
      objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      const imageRefs = [];
      this.images.forEach(function (img) {
        const base64 = img.dataUrl.split(',')[1] || '';
        const bin = atob(base64);
        const oid = objects.length;
        objects.push('<< /Type /XObject /Subtype /Image /Width ' + img.width + ' /Height ' + img.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bin.length + ' >>\nstream\n' + bin + '\nendstream');
        imageRefs.push('/' + img.name + ' ' + oid + ' 0 R');
      });
      const pageIds = [];
      const xobjects = imageRefs.length ? ' /XObject << ' + imageRefs.join(' ') + ' >>' : '';
      this.pages.forEach((page) => {
        const content = page.content.join('\n');
        const cid = objects.length;
        objects.push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
        const pid = objects.length;
        objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + this.width.toFixed(2) + ' ' + this.height.toFixed(2) + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>' + xobjects + ' >> /Contents ' + cid + ' 0 R >>');
        pageIds.push(pid);
      });
      objects[2] = '<< /Type /Pages /Kids [' + pageIds.map(function (id) { return id + ' 0 R'; }).join(' ') + '] /Count ' + pageIds.length + ' >>';

      let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
      const offsets = [];
      for (let i = 1; i < objects.length; i++) {
        offsets[i] = pdf.length;
        pdf += i + ' 0 obj\n' + objects[i] + '\nendobj\n';
      }
      const xref = pdf.length;
      pdf += 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
      for (let i = 1; i < objects.length; i++) {
        pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
      }
      pdf += 'trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
      const bytes = new Uint8Array(pdf.length);
      for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
      return new Blob([bytes], { type: 'application/pdf' });
    }
    download(filename) {
      const blob = this.save();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'AMR-Prism-report.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return blob;
    }
  }

  function svgToJpeg(svg, width, height, scale) {
    scale = scale || 2;
    return new Promise(function (resolve, reject) {
      try {
        let s = String(svg);
        if (s.indexOf('xmlns=') < 0) s = s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        if (s.indexOf('width=') < 0) s = s.replace('<svg ', '<svg width="' + width + '" height="' + height + '" ');
        const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.93), width: canvas.width, height: canvas.height });
        };
        img.onerror = function () { reject(new Error('Could not rasterize SVG chart.')); };
        img.src = encoded;
      } catch (e) { reject(e); }
    });
  }

  AMR.PDFDoc = PDFDoc;
  AMR.PDF = { PDFDoc: PDFDoc, svgToJpeg: svgToJpeg, A4: A4, safe: safe, rgb: rgb, hexToRgb: hexToRgb, measure: measure };
})(window.AMR);
