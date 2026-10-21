// Motor de mercado: generador de sesiones 1m, detectores SMC y evaluación de trades.
(function (G) {
  const TICK = 0.25;
  const OPEN = 30;        // índice de la vela de las 9:30 (la sesión arranca 9:00)
  const WIN_END = 120;    // 11:00, fin de la ventana operativa
  const BARS = 140;       // hasta 11:20
  const T0 = 9 * 60;      // minuto del día de la vela 0

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rt = (p) => Math.round(p / TICK) * TICK;

  // ---------- Constructor de velas ----------
  function Builder(seed, p0, vol) {
    this.R = rng(seed); this.c = []; this.p = p0; this.vol = vol;
  }
  Builder.prototype.g = function () { // gaussiana aproximada
    const R = this.R; return (R() + R() + R() + R() - 2) * 1.2;
  };
  Builder.prototype.push = function (o, h, l, c) {
    o = rt(o); c = rt(c);
    h = rt(Math.max(h, o, c)); l = rt(Math.min(l, o, c));
    this.c.push({ o, h, l, c }); this.p = c; return this;
  };
  Builder.prototype.drift = function (n, target, k = 1) {
    const p0 = this.p, v = this.vol;
    for (let i = 1; i <= n; i++) {
      const ideal = p0 + (target - p0) * i / n;
      const c = i === n ? target : ideal + this.g() * v * 0.55 * k;
      const o = this.p;
      this.push(o, Math.max(o, c) + Math.abs(this.g()) * v * 0.45 * k, Math.min(o, c) - Math.abs(this.g()) * v * 0.45 * k, c);
    }
    return this;
  };
  Builder.prototype.imp = function (n, target) {
    const p0 = this.p, v = this.vol;
    for (let i = 1; i <= n; i++) {
      const ideal = p0 + (target - p0) * i / n;
      const c = i === n ? target : ideal + this.g() * v * 0.12;
      const o = this.p;
      this.push(o, Math.max(o, c) + Math.abs(this.g()) * v * 0.12, Math.min(o, c) - Math.abs(this.g()) * v * 0.12, c);
    }
    return this;
  };
  // Vela que barre un nivel y cierra de vuelta (dir -1: barre mínimo, +1: barre máximo)
  Builder.prototype.sweep = function (level, dir, depth) {
    const v = this.vol, o = this.p;
    const ext = level + dir * (depth ?? v * (0.6 + this.R() * 0.9));
    const c = level - dir * v * (0.3 + this.R() * 0.6);
    if (dir < 0) this.push(o, Math.max(o, c) + v * 0.2, ext, c);
    else this.push(o, ext, Math.min(o, c) - v * 0.2, c);
    return this;
  };
  Builder.prototype.fill = function (n) {
    const R = this.R;
    while (this.c.length < n) this.drift(Math.min(4, n - this.c.length), this.p + (R() - 0.5) * this.vol * 5);
    this.c.length = n; return this;
  };

  function mirror(C, p0) {
    return C.map((b) => ({ o: 2 * p0 - b.o, c: 2 * p0 - b.c, h: 2 * p0 - b.l, l: 2 * p0 - b.h }));
  }

  // ---------- Generador de sesión NY AM ----------
  // kind: 'm1' | 'm2' | 'm3' | 'none'
  function genSession(seed, forceKind) {
    const R = rng(seed * 7 + 13);
    const kinds = ['m1', 'm1', 'm2', 'm2', 'm3', 'm3', 'none'];
    const kind = forceKind || kinds[Math.floor(R() * kinds.length)];
    const vol = 4 + R() * 4;
    const p0 = rt(16500 + R() * 5000);
    const flip = R() < 0.5;
    const win = R() < 0.62;
    const b = new Builder(seed, p0, vol);
    const v = vol;

    // Pre-market 9:00–9:29: rango con un máximo (H) y un mínimo (L) claros
    const up = 4 + R() * 3, dn = 3 + R() * 2;
    b.drift(5, p0 + up * 0.5 * v).drift(5, p0 + up * v).drift(5, p0 + 0.6 * v)
      .drift(5, p0 - dn * v).drift(5, p0 - dn * 0.3 * v).drift(5, p0 + 0.5 * v);
    const pm = b.c.slice(0, OPEN);
    const H = Math.max(...pm.map((x) => x.h)), L = Math.min(...pm.map((x) => x.l));

    if (kind === 'm1') {
      // Manipulación a la apertura: barre el mínimo del pre-market y se da vuelta
      b.drift(2, b.p + v);
      const S = b.p;
      b.imp(4, L + 0.6 * v);
      if (R() < 0.5) b.drift(1, L + 0.9 * v, 0.5);
      b.sweep(L, -1);
      const sl = b.c[b.c.length - 1].l;
      b.drift(1, b.p + 0.4 * v, 0.4);
      b.imp(3, S - (S - L) * 0.2);
      if (win) b.drift(4, b.p - 1.2 * v, 0.6).imp(4, H + 2 * v).drift(6, H + 1 * v);
      else b.drift(3, b.p + 0.8 * v, 0.6).imp(5, sl - 3 * v).drift(5, sl - 2 * v);
    } else if (kind === 'm2') {
      // Expansión a la apertura, retroceso y continuación
      b.drift(2, b.p + 0.5 * v);
      b.imp(5, H + 3 * v).drift(4, H + 4 * v, 0.6);
      const top = b.p + 1.5 * v;
      b.drift(3, top, 0.6);
      const hi = Math.max(...b.c.slice(OPEN).map((x) => x.h));
      b.drift(5, H + 0.5 * v, 0.7);
      const ml = b.c[b.c.length - 1].l - 0.3 * v;
      b.push(b.p, b.p + 0.3 * v, ml, b.p + 0.2 * v);
      b.drift(3, ml + 2.5 * v, 0.6).drift(2, ml + 2.2 * v, 0.4);
      b.imp(3, ml + 0.4 * v);
      b.sweep(ml, -1);
      const sl = b.c[b.c.length - 1].l;
      b.imp(3, ml + 3.2 * v);
      if (win) b.drift(3, b.p + 0.5 * v, 0.6).imp(3, hi + 2.5 * v).drift(5, hi + 1.5 * v);
      else b.drift(3, b.p - 0.5 * v, 0.6).imp(4, sl - 2.5 * v).drift(4, sl - 3 * v);
    } else if (kind === 'm3') {
      // Expansión fuerte sin continuación limpia → retroceso en contra
      b.drift(1, b.p + 0.5 * v);
      b.imp(4, H + 2 * v).drift(3, H + 3.5 * v, 0.5).imp(4, H + 9 * v);
      b.drift(4, H + 8 * v, 0.5).drift(3, H + 9.5 * v, 0.5);
      const hi = Math.max(...b.c.slice(OPEN).map((x) => x.h));
      b.drift(2, hi - 0.4 * v, 0.4);
      b.sweep(hi, +1);
      const sh = b.c[b.c.length - 1].h;
      b.imp(3, H + 5.5 * v);
      if (win) b.drift(3, b.p + 0.6 * v, 0.6).imp(5, H + 0.5 * v).drift(5, H + 1 * v);
      else b.drift(3, b.p + 1 * v, 0.6).imp(4, sh + 2.5 * v).drift(4, sh + 2 * v);
    } else {
      // Día sin condiciones: rango, sin manipulación clara
      for (let i = 0; i < 12; i++) b.drift(5, p0 + (R() - 0.5) * v * 2.5, 0.6);
    }
    b.fill(BARS);
    let C = b.c;
    if (flip) C = mirror(C, p0);
    const htf = genHTF(seed, kind === 'none' ? (R() < 0.5 ? 1 : -1) : (flip ? -1 : 1));
    return { seed, kind, vol, C, htf, bias: htf.dir, scriptedWin: win };
  }

  // Gráfico de 1H para el contexto (tendencia de temporalidad mayor)
  function genHTF(seed, dir) {
    const b = new Builder(seed * 3 + 1, 1000, 6);
    for (let i = 0; i < 6; i++) b.drift(4, b.p + dir * (14 + b.R() * 8), 1).drift(3, b.p - dir * (6 + b.R() * 6), 1);
    return { dir, C: b.c };
  }

  // ---------- Detectores ----------
  function fvgs(C, upto = C.length) {
    const out = [];
    for (let i = 1; i < Math.min(upto, C.length) - 1; i++) {
      const a = C[i - 1], z = C[i + 1];
      if (z.l > a.h) out.push({ dir: 1, i, top: z.l, bot: a.h, formed: i + 1 });
      if (z.h < a.l) out.push({ dir: -1, i, top: a.l, bot: z.h, formed: i + 1 });
    }
    return out;
  }
  // Un FVG queda "invalidado" cuando una vela cierra del otro lado → IFVG
  function ifvgs(C, upto = C.length) {
    const out = [];
    for (const f of fvgs(C, upto)) {
      for (let t = f.formed + 1; t < Math.min(upto, C.length); t++) {
        if (f.dir < 0 && C[t].c > f.top) { out.push({ dir: 1, t, fvg: f }); break; }
        if (f.dir > 0 && C[t].c < f.bot) { out.push({ dir: -1, t, fvg: f }); break; }
      }
    }
    return out;
  }
  function swings(C, upto = C.length, k = 2) {
    const out = [];
    for (let i = k; i < Math.min(upto, C.length) - k; i++) {
      let hi = true, lo = true;
      for (let j = 1; j <= k; j++) {
        if (C[i - j].h > C[i].h || C[i + j].h >= C[i].h) hi = false;
        if (C[i - j].l < C[i].l || C[i + j].l <= C[i].l) lo = false;
      }
      if (hi) out.push({ i, type: 'H', p: C[i].h, conf: i + k });
      if (lo) out.push({ i, type: 'L', p: C[i].l, conf: i + k });
    }
    return out;
  }
  // Niveles de liquidez conocidos en t: swings confirmados + máximo/mínimo del pre-market
  function levels(C, t) {
    const L = swings(C, t).filter((s) => s.conf <= t);
    if (t >= OPEN) {
      const pm = C.slice(0, OPEN);
      let hi = 0, lo = 0;
      pm.forEach((b, i) => { if (b.h > pm[hi].h) hi = i; if (b.l < pm[lo].l) lo = i; });
      L.push({ i: hi, type: 'H', p: pm[hi].h, conf: OPEN, pm: true });
      L.push({ i: lo, type: 'L', p: pm[lo].l, conf: OPEN, pm: true });
    }
    return L;
  }
  // Tomas de liquidez: una vela opera más allá de un nivel y el precio cierra de vuelta (en ≤3 velas)
  function sweeps(C, upto = C.length) {
    const out = [], seen = new Set();
    const lv = levels(C, upto);
    for (const s of lv) {
      const key = s.type + s.p;
      if (seen.has(key)) continue;
      for (let j = Math.max(s.conf, s.i + 1); j < Math.min(upto, C.length); j++) {
        const pierce = s.type === 'L' ? C[j].l < s.p : C[j].h > s.p;
        if (!pierce) continue;
        let back = -1;
        for (let m = j; m <= Math.min(j + 3, upto - 1, C.length - 1); m++) {
          if (s.type === 'L' ? C[m].c > s.p : C[m].c < s.p) { back = m; break; }
        }
        if (back >= 0) { out.push({ j, back, level: s, dir: s.type === 'L' ? 1 : -1 }); seen.add(key); }
        break;
      }
    }
    return out.sort((a, b) => a.j - b.j);
  }

  // Objetivos válidos en t para una dirección: liquidez sin tomar y FVG sin rellenar
  function targets(C, t, dir) {
    const out = [];
    const entry = C[t].c;
    for (const s of levels(C, t + 1)) {
      if ((dir > 0 && s.type !== 'H') || (dir < 0 && s.type !== 'L')) continue;
      if (dir > 0 ? s.p <= entry : s.p >= entry) continue;
      let taken = false;
      for (let m = s.i + 1; m <= t; m++) if (dir > 0 ? C[m].h > s.p : C[m].l < s.p) { taken = true; break; }
      if (!taken) out.push({ p: s.p, kind: s.pm ? (dir > 0 ? 'Máximo pre-market' : 'Mínimo pre-market') : (dir > 0 ? 'Máximo sin tomar' : 'Mínimo sin tomar'), i: s.i });
    }
    for (const f of fvgs(C, t + 1)) {
      if (f.dir === dir) continue; // buscamos FVG del lado contrario por rellenar
      if (dir > 0 ? f.bot <= entry : f.top >= entry) continue;
      let touched = false;
      for (let m = f.formed + 1; m <= t; m++) if (dir > 0 ? C[m].h >= f.bot : C[m].l <= f.top) { touched = true; break; }
      if (!touched) out.push({ p: dir > 0 ? f.bot : f.top, p2: dir > 0 ? f.top : f.bot, kind: 'FVG sin rellenar', i: f.i });
    }
    return out.sort((a, b) => Math.abs(a.p - entry) - Math.abs(b.p - entry));
  }

  // Setup completo de la estrategia en la vela t (dir 1 compra, -1 venta)
  function avgRange(C) {
    const pm = C.slice(0, OPEN);
    return pm.reduce((a, b) => a + (b.h - b.l), 0) / pm.length;
  }
  // IFVG "limpio": FVG con tamaño y vela de invalidación con desplazamiento
  function strongIfvg(C, iv, v) {
    const b = C[iv.t];
    return iv.fvg.top - iv.fvg.bot >= 0.2 * v && Math.abs(b.c - b.o) >= 0.7 * v;
  }
  function setupAt(C, t, dir) {
    const v = avgRange(C);
    const iv = ifvgs(C, t + 1).find((x) => x.t === t && x.dir === dir && strongIfvg(C, x, v));
    if (!iv) return null;
    const sw = sweeps(C, t + 1).filter((s) => s.dir === dir && s.j >= t - 15 && s.j >= OPEN - 2 && s.j <= t);
    if (!sw.length) return null;
    const s = sw[sw.length - 1];
    const ext = dir > 0 ? Math.min(...C.slice(s.j, t + 1).map((b) => b.l)) : Math.max(...C.slice(s.j, t + 1).map((b) => b.h));
    const entry = C[t].c;
    const stop = rt(ext - dir * 1);
    const risk = Math.abs(entry - stop);
    if (risk <= 0) return null;
    const tg = targets(C, t, dir).find((x) => Math.abs(x.p - entry) >= risk);
    if (!tg) return null;
    return { t, dir, entry, stop, target: tg.p, targetKind: tg.kind, rr: Math.abs(tg.p - entry) / risk, sweep: s, ifvg: iv, model: classify(C, t, dir, s) };
  }
  // 1: manipulación en la apertura · 2: continuación de la expansión · 3: retroceso contra la expansión
  function classify(C, t, dir, sw) {
    if (sw.j <= OPEN + 15 && t <= OPEN + 30) return 1;
    const leg = C.slice(OPEN, sw.j + 1), o = C[OPEN].o;
    const upEx = Math.max(...leg.map((b) => b.h)) - o, dnEx = o - Math.min(...leg.map((b) => b.l));
    const openDir = upEx >= dnEx ? 1 : -1; // hacia dónde expandió la apertura
    return dir === openDir ? 2 : 3;
  }
  function firstSetup(C, from = OPEN, to = WIN_END) {
    for (let t = from; t < Math.min(to, C.length); t++) {
      for (const d of [1, -1]) { const s = setupAt(C, t, d); if (s) return s; }
    }
    return null;
  }

  // ---------- Simulación de la operación ----------
  function runTrade(C, tr) {
    // tr: {t, dir, entry, sl, tp, be?}. Recorre desde t+1. Si SL y TP en la misma vela → SL (conservador).
    let sl = tr.sl;
    for (let i = tr.t + 1; i < C.length; i++) {
      const b = C[i];
      if (tr.beAt != null && i > tr.beAt) sl = tr.entry;
      const hitSL = tr.dir > 0 ? b.l <= sl : b.h >= sl;
      const hitTP = tr.dir > 0 ? b.h >= tr.tp : b.l <= tr.tp;
      if (hitSL) return { exit: sl, i, reason: sl === tr.entry ? 'Break even' : 'Stop loss' };
      if (hitTP) return { exit: tr.tp, i, reason: 'Take profit' };
    }
    return { exit: C[C.length - 1].c, i: C.length - 1, reason: 'Cierre de sesión' };
  }

  // ---------- Evaluación según el plan de trading ----------
  function gradeTrade(C, tr, ctx) {
    const items = [];
    const add = (key, label, pts, max, msg) => items.push({ key, label, pts, max, ok: pts >= max, msg });
    const t = tr.t, dir = tr.dir;
    // 1. Horario operativo
    add('time', 'Horario operativo (9:30–11:00)', t >= OPEN && t < WIN_END ? 15 : 0, 15,
      t >= OPEN && t < WIN_END ? 'Entraste dentro de la ventana de la sesión.' : 'Entraste fuera de la ventana operativa. Fuera de 9:30–11:00 no se opera.');
    // 2. Toma de liquidez
    const sw = sweeps(C, t + 1).filter((s) => s.dir === dir && s.j >= t - 25 && s.j <= t);
    const s = sw[sw.length - 1];
    add('sweep', 'Toma de liquidez previa', s ? 20 : 0, 20,
      s ? `Hubo toma de liquidez a las ${hhmm(s.j)} (${s.level.type === 'L' ? 'barrió un mínimo' : 'barrió un máximo'}).`
        : `No hubo toma de liquidez ${dir > 0 ? 'de un mínimo' : 'de un máximo'} antes de tu entrada. Sin manipulación no hay setup.`);
    // 3. IFVG
    const iv = ifvgs(C, t + 1).filter((x) => x.dir === dir && x.t >= t - 3 && x.t <= t);
    add('ifvg', 'Entrada en IFVG', iv.length ? 20 : 0, 20,
      iv.length ? `Entraste tras el IFVG ${dir > 0 ? 'alcista' : 'bajista'} de las ${hhmm(iv[iv.length - 1].t)}.`
        : 'No había un IFVG a favor de tu operación en las últimas 3 velas. La entrada se toma cuando una vela cierra invalidando un FVG.');
    // 4. Stop loss
    let slPts = 0, slMsg;
    const risk = Math.abs(tr.entry - tr.sl);
    if (s) {
      const ext = dir > 0 ? Math.min(...C.slice(s.j, t + 1).map((b) => b.l)) : Math.max(...C.slice(s.j, t + 1).map((b) => b.h));
      const beyond = dir > 0 ? tr.sl < ext : tr.sl > ext;
      const far = Math.abs(tr.sl - ext) > (ctx?.vol || 6) * 3;
      if (beyond && !far) { slPts = 15; slMsg = 'Stop detrás del extremo de la manipulación.'; }
      else if (beyond) { slPts = 8; slMsg = 'Stop protegido pero demasiado lejos del extremo: empeora tu R:R.'; }
      else slMsg = `El stop debe ir ${dir > 0 ? 'debajo' : 'encima'} del extremo de la toma de liquidez (${fmt(ext)}).`;
    } else {
      const seg = C.slice(Math.max(0, t - 10), t + 1);
      const ext = dir > 0 ? Math.min(...seg.map((b) => b.l)) : Math.max(...seg.map((b) => b.h));
      if (dir > 0 ? tr.sl < ext : tr.sl > ext) { slPts = 8; slMsg = 'Stop detrás de un extremo reciente, pero sin manipulación que lo justifique.'; }
      else slMsg = 'Stop dentro del ruido: cualquier vela normal te saca.';
    }
    add('sl', 'Stop loss lógico', slPts, 15, slMsg);
    // 5. Objetivo claro
    const rr = Math.abs(tr.tp - tr.entry) / (risk || 1);
    const tg = targets(C, t, dir);
    const tol = Math.max(2, risk * 0.2);
    const hit = tg.find((x) => (x.p2 != null ? (tr.tp >= Math.min(x.p, x.p2) - tol && tr.tp <= Math.max(x.p, x.p2) + tol) : Math.abs(tr.tp - x.p) <= tol));
    let tpPts = 0, tpMsg;
    if (hit && rr >= 1) { tpPts = 15; tpMsg = `TP en un objetivo claro (${hit.kind}) con R:R 1:${rr.toFixed(1)}.`; }
    else if (rr >= 1) { tpPts = 7; tpMsg = `R:R 1:${rr.toFixed(1)}, pero el TP no está en liquidez ni en un FVG sin rellenar.` + (tg[0] ? ` Objetivo más cercano: ${tg[0].kind} en ${fmt(tg[0].p)}.` : ''); }
    else tpMsg = `R:R 1:${rr.toFixed(2)}. Por debajo de 1:1 la operación no compensa el riesgo.`;
    add('tp', 'Objetivo claro y R:R ≥ 1', tpPts, 15, tpMsg);
    // 6. Riesgo
    const rp = tr.riskPct;
    add('risk', 'Riesgo 0,5–0,7 %', rp >= 0.45 && rp <= 0.75 ? 10 : rp <= 1 ? 5 : 0, 10,
      rp >= 0.45 && rp <= 0.75 ? `Arriesgaste ${rp.toLocaleString('es-ES', { maximumFractionDigits: 2 })} % de la cuenta.` : `Arriesgaste ${rp.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %. El plan dice 0,5–0,7 % por trade.`);
    // 7. Un trade
    const one = (ctx?.tradeCount || 1) <= 1;
    add('one', 'Un trade por sesión', one ? 5 : 0, 5, one ? 'Un TP o un SL y te vas.' : 'Tomaste más de un trade en la sesión. Sobreoperar rompe el plan.');
    const score = items.reduce((a, x) => a + x.pts, 0);
    return { items, score, rr };
  }

  // Agrupa velas de 1m en velas de tf minutos (hasta el índice upto incluido; la última puede estar en formación)
  function agg(C, tf, upto = C.length - 1) {
    if (tf <= 1) return C.slice(0, upto + 1);
    const out = [];
    for (let i = 0; i <= upto; i++) {
      const k = Math.floor(i / tf), b = C[i];
      if (!out[k]) out[k] = { o: b.o, h: b.h, l: b.l, c: b.c };
      else { const a = out[k]; a.h = Math.max(a.h, b.h); a.l = Math.min(a.l, b.l); a.c = b.c; }
    }
    return out;
  }

  const hhmm = (i) => { const m = T0 + i; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  const fmt = (p) => p.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const api = { agg, avgRange, rng, rt, Builder, genSession, genHTF, fvgs, ifvgs, swings, levels, sweeps, targets, setupAt, firstSetup, runTrade, gradeTrade, hhmm, fmt, mirror, OPEN, WIN_END, BARS, T0, TICK };
  if (typeof module !== 'undefined') module.exports = api; else G.ENG = api;
})(this);
