// Render de gráficos de velas y diagramas (SVG, colores por tokens CSS).
(function () {
  const E = window.ENG;
  const NS = 'http://www.w3.org/2000/svg';
  const C_ = { bull: 'var(--bull)', bear: 'var(--bear)', acc: 'var(--accent)', mute: 'var(--ink-2)', ink: 'var(--ink)', line: 'var(--line)', info: 'var(--info)' };

  function s(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) {
      if (k === 'style') el.setAttribute('style', attrs[k]);
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  }
  function niceStep(range, target) {
    const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  const fmtP = (p, dec) => p.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // Gráfico de velas. o: {n, slots, h, times, t0, ann, onPick, cross, axis, minBw, maxBw, dec}
  function candles(host, C, o = {}) {
    // medir antes de vaciar: leer el tamaño con el contenedor vacío acorta la página y mueve el scroll
    const cw0 = host.clientWidth;
    host.style.minHeight = host.offsetHeight ? host.offsetHeight + 'px' : '';
    host.innerHTML = '';
    const n = Math.min(o.n ?? C.length, C.length);
    const slots = Math.max(o.slots ?? n, n);
    const H = o.h ?? 300;
    const axisW = o.axis === false ? 6 : 60;
    const padT = 12, padB = o.times ? 24 : 10;
    const cw = cw0 || 640;
    const bw = Math.min(o.maxBw ?? 30, Math.max(o.minBw ?? 5, (cw - axisW - 8) / slots));
    const W = Math.max(Math.floor(cw), Math.ceil(slots * bw + axisW + 8));
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { lo = Math.min(lo, C[i].l); hi = Math.max(hi, C[i].h); }
    for (const a of o.ann || []) for (const k of ['p', 'p0', 'p1', 'entry', 'sl', 'tp']) if (a[k] != null && !a.noScale) { lo = Math.min(lo, a[k]); hi = Math.max(hi, a[k]); }
    for (const p of o.extraP || []) if (p != null) { lo = Math.min(lo, p); hi = Math.max(hi, p); }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    const ih = H - padT - padB;
    const y = (p) => padT + (hi - p) / (hi - lo) * ih;
    const x = (i) => 4 + i * bw + bw / 2;
    const plotR = 4 + slots * bw;
    const svg = s('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': o.label || 'Gráfico de velas' }, host);
    s('rect', { x: 0, y: 0, width: W, height: H, style: 'fill:var(--chart-bg)' }, svg);
    // rejilla y eje de precios
    const dec = o.dec ?? (hi - lo < 20 ? 2 : 0);
    if (o.axis !== false) {
      const st = niceStep(hi - lo, 5);
      for (let p = Math.ceil(lo / st) * st; p <= hi; p += st) {
        s('line', { x1: 0, x2: plotR, y1: y(p), y2: y(p), style: 'stroke:var(--grid);stroke-width:1' }, svg);
        s('text', { x: plotR + 6, y: y(p) + 3.5, class: 'axis', text: fmtP(p, dec) }, svg);
      }
    }
    if (o.times) {
      const t0 = o.t0 ?? 0;
      for (let i = 0; i < slots; i++) {
        const tf = o.tf || 1, m = E.T0 + t0 + i * tf;
        const every = tf <= 3 ? 15 : tf <= 5 ? 30 : 60;
        if (m % every === 0) {
          s('line', { x1: x(i), x2: x(i), y1: padT, y2: H - padB, style: 'stroke:var(--grid);stroke-width:1' }, svg);
          s('text', { x: x(i) < 18 ? Math.max(2, x(i) - 4) : x(i), y: H - 7, class: 'axis', 'text-anchor': x(i) < 18 ? 'start' : 'middle', text: `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` }, svg);
        }
      }
    }
    const ann = o.ann || [];
    const under = s('g', {}, svg), body = s('g', {}, svg), over = s('g', {}, svg);
    // Etiqueta que nunca se sale del área del gráfico
    const lbl = (g, tx, ty, t, c, anchor = 'start') => {
      const el = s('text', { x: tx, y: ty, class: 'lbl', 'text-anchor': anchor, style: `fill:${C_[c] || C_.ink}`, text: t }, g);
      let w = 0; try { w = el.getComputedTextLength(); } catch (e) { /* sin medida */ }
      if (w) {
        const left = anchor === 'end' ? tx - w : anchor === 'middle' ? tx - w / 2 : tx;
        const maxR = plotR - 2;
        if (left + w > maxR) { el.setAttribute('text-anchor', 'end'); el.setAttribute('x', maxR); }
        else if (left < 2) { el.setAttribute('text-anchor', 'start'); el.setAttribute('x', 2); }
      }
      return el;
    };
    for (const a of ann) {
      const c = C_[a.c] || C_.acc;
      if (a.k === 'shade') {
        s('rect', { x: x(a.i0) - bw / 2, y: padT, width: Math.max(1, (a.i1 - a.i0) * bw), height: ih, style: `fill:${c};opacity:.08` }, under);
        if (a.t) lbl(under, x(a.i0) - bw / 2 + 4, padT + 12, a.t, a.c || 'mute');
      } else if (a.k === 'box') {
        const i1 = Math.min(a.i1 ?? n, slots);
        s('rect', { x: x(a.i0) - bw / 2, y: y(Math.max(a.p0, a.p1)), width: Math.max(2, (i1 - a.i0) * bw), height: Math.max(2, Math.abs(y(a.p0) - y(a.p1))), style: `fill:${c};opacity:${a.op ?? 0.22};stroke:${c};stroke-width:1` }, under);
        if (a.t) lbl(over, x(a.i0) - bw / 2 + 3, a.lb ? y(Math.min(a.p0, a.p1)) + 12 : y(Math.max(a.p0, a.p1)) - 4, a.t, a.c);
      } else if (a.k === 'trade') {
        const i1 = Math.min(a.i1 ?? slots, slots);
        const w = Math.max(2, (i1 - a.i0) * bw);
        s('rect', { x: x(a.i0), y: y(Math.max(a.entry, a.tp)), width: w, height: Math.abs(y(a.entry) - y(a.tp)), style: 'fill:var(--bull);opacity:.14' }, under);
        s('rect', { x: x(a.i0), y: y(Math.max(a.entry, a.sl)), width: w, height: Math.abs(y(a.entry) - y(a.sl)), style: 'fill:var(--bear);opacity:.14' }, under);
        for (const [p, cc, t] of [[a.entry, 'ink', 'Entrada'], [a.sl, 'bear', 'SL'], [a.tp, 'bull', 'TP']]) {
          if (p == null) continue;
          s('line', { x1: x(a.i0), x2: x(a.i0) + w, y1: y(p), y2: y(p), style: `stroke:${C_[cc]};stroke-width:1.5` }, over);
          if (a.labels !== false) lbl(over, x(a.i0) + w + 3 > plotR - 40 ? x(a.i0) + 3 : x(a.i0) + w + 3, y(p) + (t === 'TP' ? -4 : t === 'SL' ? 11 : -4), t, cc);
        }
      }
    }
    for (let i = 0; i < n; i++) {
      const b = C[i], up = b.c >= b.o, col = up ? 'var(--c-up)' : 'var(--c-down)';
      const dim = o.dimFrom != null && i >= o.dimFrom ? ';opacity:.35' : '';
      // con o.animate cada vela aparece en secuencia (solo en diagramas, no en el simulador)
      const g = o.animate ? s('g', { class: 'cdl', style: `animation-delay:${Math.min(i * 14, 900)}ms` }, body) : body;
      s('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), style: `stroke:${col};stroke-width:1.2;stroke-linecap:round${dim}` }, g);
      const top = y(Math.max(b.o, b.c)), hgt = Math.max(1, Math.abs(y(b.o) - y(b.c)));
      s('rect', { x: x(i) - bw * 0.36, y: top, width: Math.max(1, bw * 0.72), height: hgt, rx: Math.min(2, bw * 0.12), style: `fill:${up ? 'var(--c-up-body)' : 'var(--c-down-body)'};stroke:${col};stroke-width:1.2${dim}` }, g);
    }
    for (const a of ann) {
      const c = C_[a.c] || C_.acc;
      if (a.k === 'h') {
        const i0 = a.i0 ?? 0, i1 = Math.min(a.i1 ?? slots, slots);
        s('line', { x1: x(i0) - bw / 2, x2: x(i1 - 1) + bw / 2, y1: y(a.p), y2: y(a.p), style: `stroke:${c};stroke-width:${a.w || 1.3};${a.dash !== false ? 'stroke-dasharray:5 4' : ''}` }, over);
        if (a.t) lbl(over, a.right ? x(i1 - 1) : x(i0) - bw / 2 + 2, y(a.p) + (a.below ? 13 : -5), a.t, a.c || 'acc', a.right ? 'end' : 'start');
      } else if (a.k === 'v') {
        s('line', { x1: x(a.i) - bw / 2, x2: x(a.i) - bw / 2, y1: padT, y2: H - padB, style: `stroke:${c};stroke-width:1.2;stroke-dasharray:3 3` }, over);
        if (a.t) lbl(over, x(a.i) - bw / 2 + 4, H - padB - 6, a.t, a.c || 'acc');
      } else if (a.k === 'mark') {
        const b = C[a.i], above = a.pos === 'above' || (a.pos == null && a.p != null && b && a.p >= b.h);
        const py = a.p != null ? y(a.p) : above ? y(b.h) : y(b.l);
        s('circle', { cx: x(a.i), cy: py + (above ? -7 : 7), r: 4, style: `fill:${c}` }, over);
        if (a.t) lbl(over, x(a.i) + (a.anchor === 'end' ? -8 : 8), py + (above ? -10 : 18), a.t, a.c, a.anchor || 'start');
      } else if (a.k === 'txt') {
        lbl(over, x(a.i), y(a.p), a.t, a.c || 'ink', a.anchor || 'start');
      } else if (a.k === 'num') {
        s('text', { x: x(a.i), y: y(a.p), class: 'lbl num', 'text-anchor': 'middle', style: `fill:${c}`, text: a.t }, over);
      }
    }
    host.style.minHeight = '';
    const api = { svg, x, y, bw, W, H, hi, lo, n, slots, padT, ih };
    if (o.onPick || o.cross) {
      const ch = s('line', { x1: 0, x2: plotR, y1: -10, y2: -10, style: 'stroke:var(--ink-2);stroke-width:1;stroke-dasharray:2 3;pointer-events:none' }, svg);
      const cv = s('line', { x1: -10, x2: -10, y1: padT, y2: H - padB, style: 'stroke:var(--ink-2);stroke-width:1;stroke-dasharray:2 3;pointer-events:none;opacity:.6' }, svg);
      const tagR = s('rect', { x: plotR + 1, y: -30, width: axisW - 4, height: 16, rx: 2, style: 'fill:var(--ink);pointer-events:none' }, svg);
      const tagT = s('text', { x: plotR + 5, y: -30, class: 'axis', style: 'fill:var(--bg);pointer-events:none' }, svg);
      const pos = (e) => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height);
        const i = Math.floor((px - 4) / bw);
        const p = E.rt(hi - (py - padT) / ih * (hi - lo));
        return { i, p, px, py };
      };
      svg.addEventListener('pointermove', (e) => {
        const q = pos(e);
        ch.setAttribute('y1', q.py); ch.setAttribute('y2', q.py);
        cv.setAttribute('x1', x(q.i)); cv.setAttribute('x2', x(q.i));
        tagR.setAttribute('y', q.py - 8); tagT.setAttribute('y', q.py + 4); tagT.textContent = fmtP(q.p, 2);
      });
      svg.addEventListener('pointerleave', () => { ch.setAttribute('y1', -10); ch.setAttribute('y2', -10); tagR.setAttribute('y', -30); tagT.setAttribute('y', -30); cv.setAttribute('x1', -10); cv.setAttribute('x2', -10); });
      if (o.onPick) { svg.style.cursor = 'crosshair'; svg.addEventListener('click', (e) => o.onPick(pos(e))); }
    }
    return api;
  }

  // Gráfico de líneas (curvas de capital, etc.)
  function lines(host, series, o = {}) {
    const cw0 = host.clientWidth;
    host.innerHTML = '';
    const H = o.h ?? 220, cw = cw0 || 600, W = Math.max(280, cw);
    const padL = 8, padR = 64, padT = 14, padB = o.xlabel ? 26 : 12;
    let lo = Infinity, hi = -Infinity, len = 0;
    for (const se of series) { se.v.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); len = Math.max(len, se.v.length); }
    for (const r of o.refs || []) { lo = Math.min(lo, r.v); hi = Math.max(hi, r.v); }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    const x = (i) => padL + i / Math.max(1, len - 1) * (W - padL - padR);
    const y = (v) => padT + (hi - v) / (hi - lo) * (H - padT - padB);
    const svg = s('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': o.label || 'Gráfico' }, host);
    s('rect', { x: 0, y: 0, width: W, height: H, style: 'fill:var(--chart-bg)' }, svg);
    const st = niceStep(hi - lo, 4);
    for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
      s('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), style: 'stroke:var(--grid)' }, svg);
      s('text', { x: W - padR + 6, y: y(v) + 3.5, class: 'axis', text: (o.fmt || ((z) => z.toFixed(st < 1 ? 1 : 0)))(v) }, svg);
    }
    for (const r of o.refs || []) {
      s('line', { x1: padL, x2: W - padR, y1: y(r.v), y2: y(r.v), style: `stroke:${C_[r.c] || C_.mute};stroke-dasharray:5 4` }, svg);
      if (r.t) s('text', { x: padL + 4, y: y(r.v) - 5, class: 'lbl', style: `fill:${C_[r.c] || C_.mute}`, text: r.t }, svg);
    }
    for (const se of series) {
      const c = C_[se.c] || se.c;
      const d = se.v.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      if (se.area) s('path', { d: `${d}L${x(se.v.length - 1)},${y(lo)}L${x(0)},${y(lo)}Z`, style: `fill:${c};opacity:.08` }, svg);
      s('path', se.dash ? { d, style: `fill:none;stroke:${c};stroke-width:${se.w || 2};stroke-dasharray:6 4` } : { d, pathLength: 1, class: 'ln', style: `fill:none;stroke:${c};stroke-width:${se.w || 2};stroke-linecap:round;stroke-linejoin:round` }, svg);
      const li = se.v.length - 1;
      s('circle', { cx: x(li), cy: y(se.v[li]), r: 3.5, style: `fill:${c}` }, svg);
      if (se.label) s('text', { x: x(li) - 4, y: y(se.v[li]) - 8, class: 'lbl', 'text-anchor': 'end', style: `fill:${c}`, text: se.label }, svg);
    }
    if (o.xlabel) s('text', { x: padL, y: H - 8, class: 'axis', text: o.xlabel }, svg);
    return svg;
  }

  // ---------- Escenarios guionados para diagramas ----------
  function script(seed, p0, vol, steps) {
    const b = new E.Builder(seed, p0, vol), marks = [];
    for (const st of steps) {
      const [k, n, tg, extra, label] = st;
      const from = b.p;
      if (k === 'd') b.drift(n, tg, extra ?? 0.5);
      else if (k === 'i') b.imp(n, tg);
      else if (k === 's') b.sweep(tg, n, extra);
      else if (k === 'bar') b.push(...tg);
      const i = b.c.length - 1;
      if (label) marks.push({ i, up: (k === 's' ? n > 0 : tg > from), label });
    }
    const C = b.c;
    const ann = marks.map((m) => ({ k: 'mark', i: m.i, pos: m.up ? 'above' : 'below', c: 'ink', t: m.label }));
    return { C, ann };
  }

  // Busca una sesión generada que cumpla una condición (para ejemplos reales del generador)
  const cache = {};
  function findSession(key, kind, pred, start = 1) {
    if (cache[key]) return cache[key];
    for (let sd = start; sd < start + 3000; sd++) {
      const S = E.genSession(sd, kind);
      const f = E.firstSetup(S.C);
      if (pred(S, f)) { cache[key] = { S, f }; return cache[key]; }
    }
    return null;
  }

  function setupAnn(C, f, o = {}) {
    const r = E.runTrade(C, { t: f.t, dir: f.dir, entry: f.entry, sl: f.stop, tp: f.target });
    const lv = f.sweep.level, fz = f.ifvg.fvg;
    const a = [
      { k: 'h', p: lv.p, i0: lv.i, i1: f.sweep.j + 4, c: 'acc', t: o.lvLabel || (lv.pm ? (lv.type === 'H' ? 'Máximo pre-market' : 'Mínimo pre-market') : 'Liquidez'), below: lv.type === 'L' },
      { k: 'mark', i: f.sweep.j, pos: f.dir > 0 ? 'below' : 'above', c: 'acc', t: 'Toma de liquidez' },
      { k: 'box', i0: fz.i - 1, i1: f.t + 1, p0: fz.bot, p1: fz.top, c: f.dir > 0 ? 'bear' : 'bull', t: 'FVG', lb: f.dir > 0 },
      { k: 'mark', i: f.t, pos: f.dir > 0 ? 'above' : 'below', c: 'info', t: 'IFVG', anchor: 'end' },
      { k: 'trade', i0: f.t, i1: Math.min(r.i + 1, C.length), entry: f.entry, sl: f.stop, tp: f.target },
    ];
    if (o.open !== false) a.push({ k: 'v', i: E.OPEN, c: 'mute', t: '9:30' });
    return { ann: a, res: r };
  }

  // Pasa anotaciones con índices de 1m a índices de la temporalidad tf
  function mapAnn(ann, tf) {
    if (tf <= 1) return ann;
    return ann.map((a) => {
      const y = { ...a };
      if (y.i != null) y.i = Math.floor(y.i / tf);
      if (y.i0 != null) y.i0 = Math.floor(y.i0 / tf);
      if (y.i1 != null) y.i1 = Math.max(y.i0 != null ? y.i0 + 1 : 0, Math.ceil(y.i1 / tf));
      return y;
    });
  }

  // Selector de temporalidad reutilizable
  function tfBar(host, list, cur, onPick, label = 'Temporalidad') {
    const bar = document.createElement('div');
    bar.className = 'tfbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', label);
    bar.innerHTML = list.map((t) => `<button type="button" data-tf="${t}" aria-pressed="${t === cur}">${t >= 60 ? t / 60 + 'H' : t + 'm'}</button>`).join('');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tf]'); if (!b) return;
      bar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      onPick(+b.dataset.tf);
    });
    host.appendChild(bar);
    return bar;
  }

  const candlesA = (host, C, o = {}) => candles(host, C, { animate: true, ...o });
  window.CH = { candlesA, mapAnn, tfBar, candles, lines, script, findSession, setupAnn, s };
})();
