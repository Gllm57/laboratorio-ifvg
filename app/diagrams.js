// Diagramas de cada lección. Cada función recibe el contenedor y lo rellena.
(function () {
  const E = window.ENG, CH = window.CH;
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
  const box = (host, cls = 'dg-chart') => { const d = document.createElement('div'); d.className = cls; host.appendChild(d); return d; };
  const cap = (host, t) => host.appendChild(h(`<p class="dg-cap">${t}</p>`));

  function crop(C, a, b) { return C.slice(a, b); }
  function shiftAnn(ann, a) {
    return ann.map((x) => {
      const y = { ...x };
      for (const k of ['i', 'i0', 'i1']) if (y[k] != null) y[k] -= a;
      return y;
    });
  }

  function sessionModel(host, model, opts = {}) {
    const key = 'model' + model + (opts.alt || '');
    const kind = { 1: 'm1', 2: 'm2', 3: 'm3' }[model];
    const F = CH.findSession(key, kind, (S, f) => f && f.model === model && E.runTrade(S.C, { t: f.t, dir: f.dir, entry: f.entry, sl: f.stop, tp: f.target }).reason === 'Take profit' && f.rr >= 1.1 && (opts.dir == null || f.dir === opts.dir), opts.start || 1);
    if (!F) return;
    const { S, f } = F;
    const { ann, res } = CH.setupAnn(S.C, f);
    const end = Math.min(S.C.length, res.i + 8);
    const a = opts.from ?? 18;
    const head = document.createElement('div'); head.className = 'dg-tools'; host.appendChild(head);
    const c = box(host);
    const draw = (tf) => {
      const A = E.agg(S.C, tf, end - 1), a0 = Math.floor(a / tf);
      CH.candles(c, A.slice(a0), { ann: shiftAnn(CH.mapAnn(ann, tf), a0), times: true, t0: a0 * tf, tf, h: opts.h || 300, label: `Ejemplo del modelo ${model} en ${tf} minutos` });
    };
    CH.tfBar(head, [1, 3, 5, 15], 1, draw);
    draw(1);
    return { S, f, res };
  }

  const DG = {};

  DG.m1 = (host) => { sessionModel(host, 1); cap(host, 'Modelo 1 · Manipulación: en la apertura el precio barre la liquidez del pre-market, reacciona e invalida un FVG (IFVG). Entrada al cierre, stop detrás del barrido y TP en la liquidez del lado contrario.'); };
  DG.m2 = (host) => { sessionModel(host, 2); cap(host, 'Modelo 2 · Continuación: la apertura expande, retrocede, barre liquidez interna y da IFVG a favor de la expansión.'); };
  DG.m3 = (host) => { sessionModel(host, 3); cap(host, 'Modelo 3 · Retroceso: la apertura expande sin dar entrada de continuación. El precio barre el extremo y vuelve a equilibrar hacia los FVG sin rellenar.'); };
  DG.models = (host) => {
    const g = box(host, 'dg-grid3');
    [1, 2, 3].forEach((m) => {
      const cell = document.createElement('div'); g.appendChild(cell);
      cell.appendChild(h(`<p class="dg-tag">Modelo ${m} · ${['Manipulación', 'Continuación', 'Retroceso'][m - 1]}</p>`));
      sessionModel(cell, m, { h: 220, from: 24 });
    });
    cap(host, 'Si no se da la variable 1, aparece la 2; si no, la 3. Las tres se componen de toma de liquidez + IFVG + objetivo claro.');
  };
  DG.sltp = (host) => { sessionModel(host, 1, { alt: 'b', start: 200, dir: -1 }); cap(host, 'Stop detrás del extremo de la manipulación. TP en la liquidez sin tomar o en un FVG sin rellenar. R:R mínimo 1:1.'); };
  DG.repeat = (host) => { sessionModel(host, 1, { alt: 'c', start: 600 }); cap(host, 'Otro día, el mismo patrón: liquidez → manipulación → IFVG → objetivo.'); };
  DG.smartmoney = DG.repeat;
  DG.patience = (host) => {
    const F = CH.findSession('pat', 'm2', (S, f) => f && f.model === 2 && f.t > E.OPEN + 22);
    if (!F) return;
    const { S, f } = F; const { ann } = CH.setupAnn(S.C, f);
    ann.push({ k: 'shade', i0: E.OPEN, i1: f.t, c: 'mute', t: 'Esperar…' });
    const a = 15, c = box(host);
    CH.candles(c, crop(S.C, a, Math.min(S.C.length, f.t + 18)), { ann: shiftAnn(ann, a), times: true, t0: a, h: 280 });
    cap(host, `Desde las 9:30 hasta las ${E.hhmm(f.t)} no había entrada. La paciencia es esperar que se cumplan los 3 pasos.`);
  };
  DG.notrade = (host) => {
    const F = CH.findSession('none', 'none', (S, f) => !f);
    if (!F) return;
    const { S } = F; const c = box(host);
    CH.candles(c, S.C.slice(0, E.WIN_END + 2), { ann: [{ k: 'v', i: E.OPEN, c: 'mute', t: '9:30' }, { k: 'shade', i0: E.OPEN, i1: E.WIN_END, c: 'mute', t: 'Sin toma de liquidez ni desplazamiento: no se opera' }], times: true, h: 260 });
    cap(host, 'Día sin condiciones. Cerrar los gráficos sin operar también es cumplir el plan.');
  };
  DG.premarket = (host) => {
    const F = CH.findSession('model1', 'm1', (S, f) => f && f.model === 1);
    const { S } = F; const pm = S.C.slice(0, E.OPEN);
    const H = Math.max(...pm.map((b) => b.h)), L = Math.min(...pm.map((b) => b.l));
    const fv = E.fvgs(S.C, E.OPEN).filter((x) => x.top - x.bot > S.vol * 0.25).slice(-2);
    const ann = [
      { k: 'shade', i0: 0, i1: E.OPEN, c: 'mute', t: 'Pre-market' },
      { k: 'h', p: H, i0: 0, i1: E.OPEN + 6, c: 'acc', t: 'Máximo pre-market' },
      { k: 'h', p: L, i0: 0, i1: E.OPEN + 6, c: 'acc', t: 'Mínimo pre-market', below: true },
      { k: 'v', i: 15, c: 'info', t: '9:15 análisis' },
      { k: 'v', i: E.OPEN, c: 'mute', t: '9:30' },
      ...fv.map((x) => ({ k: 'box', i0: x.i - 1, i1: E.OPEN + 6, p0: x.bot, p1: x.top, c: x.dir > 0 ? 'bull' : 'bear', t: 'FVG' })),
    ];
    const c = box(host);
    CH.candles(c, S.C, { n: E.OPEN, slots: E.OPEN + 6, ann, times: true, h: 260 });
    cap(host, 'Antes de la apertura: liquidez del pre-market, FVG relevantes, sesgo y calendario.');
  };
  DG.quarters = (host) => {
    const F = CH.findSession('model1', 'm1', (S, f) => f && f.model === 1);
    const { S } = F; const q = 22;
    const ann = [0, 1, 2, 3].map((k) => ({ k: 'shade', i0: E.OPEN + k * q, i1: E.OPEN + (k + 1) * q - 1, c: ['mute', 'acc', 'info', 'mute'][k], t: ['Q1 acumulación', 'Q2 manipulación', 'Q3 distribución', 'Q4 cont./reversión'][k] }));
    const c = box(host);
    CH.candles(c, S.C.slice(E.OPEN - 2, E.WIN_END), { ann: shiftAnn(ann, E.OPEN - 2), times: true, t0: E.OPEN - 2, h: 260 });
    cap(host, 'Esquema didáctico: la ventana de 90 minutos dividida en cuartos.');
  };
  DG.topdown = (host) => {
    const g = box(host, 'dg-grid3');
    const S = E.genSession(77, 'm1');
    const tf = [['1H · dirección', E.genHTF(5, S.bias).C], ['15m · puntos de interés', E.genHTF(9, S.bias).C.slice(10)], ['1m · toma de liquidez + IFVG', S.C.slice(20, 60)]];
    tf.forEach(([t, C]) => { const cell = document.createElement('div'); g.appendChild(cell); cell.appendChild(h(`<p class="dg-tag">${t}</p>`)); const c = box(cell); CH.candles(c, C, { h: 180, axis: false }); });
    cap(host, 'De lo grande a lo pequeño: la temporalidad mayor da la dirección y la de 1m da la entrada.');
  };

  // --- Conceptos con escenarios guionados ---
  DG.trend = (host) => {
    const { C, ann } = CH.script(3, 100, 1.4, [['d', 4, 106, 0.3], ['d', 3, 103, 0.3, 'HL'], ['d', 4, 110, 0.3, 'HH'], ['d', 3, 106.5, 0.3, 'HL'], ['d', 4, 114, 0.3, 'HH'], ['d', 3, 110, 0.3, 'HL'], ['d', 4, 118, 0.3, 'HH'], ['d', 3, 112, 0.3, 'LH ?'], ['d', 4, 106, 0.3, 'LL'], ['d', 3, 109, 0.3, 'LH'], ['d', 4, 102, 0.3, 'LL']]);
    CH.candles(box(host), C, { ann, h: 260, dec: 0 });
    cap(host, 'Alcista: HH y HL. Bajista: LH y LL. El cambio aparece cuando se pierde el último HL.');
  };
  DG.bos = (host) => {
    const { C, ann } = CH.script(8, 100, 1.4, [['d', 4, 107, 0.3], ['d', 3, 103, 0.3, 'HL'], ['d', 4, 112, 0.3, 'HH'], ['d', 3, 107, 0.3, 'Último HL'], ['d', 4, 113.5, 0.3, 'LH'], ['i', 3, 101], ['d', 4, 103, 0.3]]);
    const hl = Math.min(...C.slice(12, 16).map((b) => b.l));
    ann.push({ k: 'h', p: hl, i0: 13, i1: C.length, c: 'bear', t: 'Cierre por debajo = quiebre (BOS)', below: true });
    CH.candles(box(host), C, { ann, h: 260, dec: 0 });
    cap(host, 'El quiebre se confirma con el CIERRE de la vela, no con la mecha.');
  };
  DG.liquidity = (host) => {
    const { C, ann } = CH.script(12, 100, 1.2, [['d', 4, 109.5, 0.3], ['d', 3, 104, 0.3], ['d', 4, 109.6, 0.3], ['d', 3, 103.5, 0.3], ['d', 4, 109.4, 0.3], ['d', 3, 103.8, 0.3], ['d', 3, 106, 0.3]]);
    const hi = Math.max(...C.map((b) => b.h)), lo = Math.min(...C.map((b) => b.l));
    ann.push({ k: 'h', p: hi + 0.3, c: 'bear', t: 'Buy-side: stops de los vendedores' }, { k: 'h', p: lo - 0.3, c: 'bull', t: 'Sell-side: stops de los compradores', below: true });
    CH.candles(box(host), C, { ann, h: 240, dec: 0 });
    cap(host, 'Máximos y mínimos iguales acumulan órdenes. El precio los busca.');
  };
  DG.sweep = (host) => {
    const { C } = CH.script(21, 100, 1.4, [['d', 4, 104, 0.3], ['d', 3, 98, 0.3], ['d', 3, 102.5, 0.3], ['d', 3, 99.2, 0.3], ['s', -1, 98, 1.8], ['i', 3, 105], ['d', 3, 106, 0.3]]);
    const low = Math.min(...C.slice(5, 9).map((b) => b.l));
    const j = 13;
    const ann = [{ k: 'h', p: low, i0: 5, i1: C.length, c: 'acc', t: 'Mínimo (liquidez)', below: true }, { k: 'mark', i: j, pos: 'below', c: 'acc', t: 'Barre y cierra arriba' }];
    CH.candles(box(host), C, { ann, h: 250, dec: 0 });
    cap(host, 'Falla de desplazamiento: supera el mínimo, activa los stops y no logra cerrar por debajo.');
  };
  DG.fvg = (host) => {
    const { C } = CH.script(31, 100, 1.2, [['d', 5, 101, 0.4], ['i', 4, 110], ['d', 4, 111, 0.4]]);
    const f = E.fvgs(C).find((x) => x.dir > 0);
    const ann = f ? [
      { k: 'box', i0: f.i - 1, i1: C.length, p0: f.bot, p1: f.top, c: 'bull', t: 'FVG alcista (vacío)' },
      { k: 'num', i: f.i - 1, p: C[f.i - 1].l - 0.9, t: '1', c: 'ink' }, { k: 'num', i: f.i, p: C[f.i].l - 0.9, t: '2', c: 'ink' }, { k: 'num', i: f.i + 1, p: C[f.i + 1].l - 0.9, t: '3', c: 'ink' },
    ] : [];
    CH.candles(box(host), C, { ann, h: 250, dec: 0 });
    cap(host, 'El mínimo de la vela 3 no toca el máximo de la vela 1: ese hueco es el Fair Value Gap.');
  };
  DG.ifvg = (host) => {
    const { C } = CH.script(41, 100, 1.2, [['d', 3, 104, 0.4], ['i', 4, 95], ['d', 2, 95.6, 0.3], ['s', -1, 94.6, 1.2], ['i', 3, 103], ['d', 4, 105, 0.4]]);
    const iv = E.ifvgs(C).find((x) => x.dir > 0);
    const ann = iv ? [
      { k: 'box', i0: iv.fvg.i - 1, i1: C.length, p0: iv.fvg.bot, p1: iv.fvg.top, c: 'bear', t: 'FVG bajista' },
      { k: 'mark', i: iv.t, pos: 'above', c: 'info', t: 'Cierra arriba = IFVG alcista', anchor: 'end' },
    ] : [];
    CH.candles(box(host), C, { ann, h: 260, dec: 0 });
    cap(host, 'El mercado no respeta el FVG bajista y una vela cierra por encima. Ese cierre es la entrada en compras.');
  };
  DG.ob = (host) => {
    const { C } = CH.script(51, 100, 1.2, [['d', 4, 102, 0.4], ['d', 2, 100, 0.2], ['bar', 0, [100, 100.4, 98.2, 98.6]], ['i', 4, 108], ['d', 4, 109, 0.4]]);
    const k = 6, b = C[k];
    CH.candles(box(host), C, { ann: [{ k: 'box', i0: k, i1: C.length, p0: b.l, p1: b.h, c: 'bull', t: 'Order block alcista' }], h: 240, dec: 0 });
    cap(host, 'Última vela bajista antes del desplazamiento alcista.');
  };
  DG.equilibrium = (host) => {
    const { C } = CH.script(61, 100, 1.3, [['d', 3, 101, 0.4], ['i', 5, 118], ['d', 3, 120, 0.4], ['d', 6, 111, 0.5]]);
    const hi = Math.max(...C.map((b) => b.h)), lo = Math.min(...C.map((b) => b.l)), mid = (hi + lo) / 2;
    CH.candles(box(host), C, { ann: [
      { k: 'box', i0: 0, i1: C.length, p0: mid, p1: hi, c: 'bear', op: 0.08, t: 'Premium (vender)' },
      { k: 'box', i0: 0, i1: C.length, p0: lo, p1: mid, c: 'bull', op: 0.08, t: 'Descuento (comprar)' },
      { k: 'h', p: mid, c: 'acc', t: 'Equilibrio 50 %', dash: true },
    ], h: 260, dec: 0 });
    cap(host, 'El precio no va todo para arriba ni todo para abajo: vuelve al equilibrio.');
  };
  DG.cisd = (host) => {
    const { C } = CH.script(71, 100, 1.2, [['d', 3, 101, 0.4], ['bar', 0, [101, 101.3, 99.6, 99.8]], ['bar', 0, [99.8, 100, 98.4, 98.6]], ['bar', 0, [98.6, 98.8, 97.1, 97.4]], ['bar', 0, [97.4, 97.6, 95.8, 96.6]], ['bar', 0, [96.6, 98.2, 96.4, 98]], ['i', 2, 102.5], ['d', 3, 103.5, 0.4]]);
    CH.candles(box(host), C, { ann: [{ k: 'h', p: 101, i0: 3, i1: C.length, c: 'info', t: 'Apertura de la serie bajista' }, { k: 'mark', i: 9, pos: 'above', c: 'info', t: 'CISD: cierra por encima' }], h: 240, dec: 1 });
    cap(host, 'Cambio en la entrega del precio: el cierre supera la apertura de las velas que hicieron la manipulación.');
  };
  DG.structure = (host) => {
    const { C, ann } = CH.script(81, 100, 1.1, [['d', 3, 104, 0.3], ['d', 2, 102.5, 0.3, 'int'], ['d', 3, 108, 0.3], ['d', 3, 101, 0.3, 'Mínimo externo'], ['d', 3, 105, 0.3], ['d', 2, 103.5, 0.3, 'int'], ['d', 3, 109, 0.3], ['d', 2, 107.5, 0.3, 'int'], ['d', 3, 114, 0.3, 'Máximo externo'], ['d', 3, 110, 0.3, 'int']]);
    CH.candles(box(host), C, { ann, h: 250, dec: 0 });
    cap(host, 'Externa: los giros principales. Interna (int): los pequeños giros dentro de cada tramo.');
  };
  DG.dailybias = (host) => {
    const { C } = CH.script(91, 100, 3, [['d', 3, 110, 0.6], ['d', 2, 104, 0.6], ['d', 3, 118, 0.6], ['d', 2, 113, 0.6], ['d', 2, 121, 0.6]]);
    const prev = C[C.length - 2];
    CH.candles(box(host), C, { slots: C.length + 3, ann: [{ k: 'h', p: prev.h, i0: C.length - 2, i1: C.length + 3, c: 'bull', t: 'PDH' }, { k: 'h', p: prev.l, i0: C.length - 2, i1: C.length + 3, c: 'bear', t: 'PDL', below: true }], h: 240, dec: 0 });
    cap(host, 'Velas diarias con tendencia alcista: sesgo alcista y objetivo en la liquidez del máximo previo (PDH).');
  };
  DG.news = (host) => {
    const { C } = CH.script(101, 100, 0.8, [['d', 6, 101, 0.4], ['bar', 0, [101, 106.5, 100.6, 104]], ['bar', 0, [104, 104.5, 96.2, 97]], ['d', 4, 99.5, 0.6], ['d', 4, 100.5, 0.5]]);
    CH.candles(box(host), C, { ann: [{ k: 'v', i: 6, c: 'bear', t: '8:30 dato alto impacto' }], h: 240, dec: 0 });
    cap(host, 'Las noticias de alto impacto barren liquidez de ambos lados en segundos.');
  };
  DG.smt = (host) => {
    const g = box(host, 'dg-grid2');
    const a = CH.script(111, 100, 1.1, [['d', 4, 104, 0.3], ['d', 3, 99, 0.3], ['d', 3, 102, 0.3], ['i', 2, 97.5], ['i', 3, 103], ['d', 2, 104, 0.3]]);
    const b = CH.script(112, 100, 1.1, [['d', 4, 104, 0.3], ['d', 3, 99, 0.3], ['d', 3, 102, 0.3], ['d', 2, 100.2, 0.3], ['i', 3, 104], ['d', 2, 105, 0.3]]);
    [['NQ: mínimo más bajo', a.C, 'bear'], ['ES: mínimo más alto', b.C, 'bull']].forEach(([t, C, c]) => {
      const cell = document.createElement('div'); g.appendChild(cell);
      cell.appendChild(h(`<p class="dg-tag">${t}</p>`));
      const lo7 = Math.min(...C.slice(5, 8).map((x) => x.l));
      CH.candles(box(cell), C, { ann: [{ k: 'h', p: lo7, i0: 5, i1: C.length, c, below: true }], h: 200, dec: 0 });
    });
    cap(host, 'NQ barre el mínimo y ES no lo confirma: SMT alcista.');
  };
  DG.bidask = (host) => {
    const { C } = CH.script(121, 100, 1, [['d', 4, 101, 0.4], ['d', 6, 108, 0.5], ['d', 6, 100, 0.5], ['d', 2, 101, 0.4]]);
    CH.candles(box(host), C, { ann: [{ k: 'trade', i0: 3, i1: 10, entry: 100.8, sl: 98.8, tp: 106.8, labels: false }, { k: 'txt', i: 4, p: 107.6, t: 'Long: ganas si sube', c: 'bull' }, { k: 'trade', i0: 10, i1: 17, entry: 107, sl: 109, tp: 101, labels: false }, { k: 'txt', i: 11, p: 110, t: 'Short: ganas si baja', c: 'bear' }], h: 240, dec: 0 });
  };

  // --- Curvas ---
  function seq(seed, n, wr, rr) { const R = E.rng(seed); return Array.from({ length: n }, () => (R() < wr ? rr : -1)); }
  DG.risk = (host) => {
    const t = seq(5, 60, 0.52, 1.3); for (let i = 18; i < 26; i++) t[i] = -1;
    const eq = (r) => { let e = 100; return [100, ...t.map((x) => (e *= 1 + x * r / 100))]; };
    CH.lines(box(host), [{ v: eq(0.5), c: 'bull', label: '0,5 % por trade', area: true }, { v: eq(5), c: 'bear', label: '5 % por trade' }], { h: 230, refs: [{ v: 100, t: 'Cuenta inicial', c: 'mute' }], xlabel: '60 trades, misma secuencia (incluye 8 pérdidas seguidas)' });
    cap(host, 'Mismos trades, distinto riesgo. Con 0,5 % sobrevives a la racha; con 5 % la cuenta queda destruida.');
  };
  DG.backtest = (host) => {
    const t = seq(17, 80, 0.55, 1.3); let e = 0; const v = [0, ...t.map((x) => (e += x))];
    CH.lines(box(host), [{ v, c: 'info', label: `${e.toFixed(1)} R`, area: true }], { h: 220, refs: [{ v: 0, c: 'mute' }], xlabel: '80 trades simulados · 55 % acierto · R:R 1:1,3', fmt: (z) => z.toFixed(0) + ' R' });
    cap(host, 'Una ventaja pequeña repetida muchas veces. Hay rachas malas incluso con una estrategia positiva.');
  };
  DG.funded = (host) => {
    const t = seq(23, 40, 0.55, 1.2); let e = 50000, peak = 50000; const v = [e], dd = [e - 2500];
    t.forEach((x) => { e += x * 250; peak = Math.max(peak, e); v.push(e); dd.push(Math.min(peak - 2500, 50000 + 100)); });
    CH.lines(box(host), [{ v, c: 'bull', label: 'Saldo', area: true }, { v: dd, c: 'bear', dash: true, label: 'Límite de pérdida' }], { h: 220, fmt: (z) => (z / 1000).toFixed(1) + 'k', xlabel: 'Cuenta de 50.000 $ · riesgo 250 $ por trade' });
    cap(host, 'El límite de pérdida (trailing) sube con tu saldo. Con riesgo bajo te mantienes lejos de él.');
  };
  DG.overconfidence = (host) => {
    const t = [1.3, 1.3, -1, 1.3, 1.3, 1.3, 1.3, -1, -1, -1, 1.3, -1, -1, 1.3, -1, 1.3, 1.3, -1];
    let a = 100, b = 100; const va = [100], vb = [100];
    t.forEach((x, i) => { a *= 1 + x * 0.5 / 100; b *= 1 + x * (i >= 7 ? 3 : 0.5) / 100; va.push(a); vb.push(b); });
    CH.lines(box(host), [{ v: va, c: 'bull', label: 'Plan' }, { v: vb, c: 'bear', label: 'Sube riesgo tras racha' }], { h: 210, refs: [{ v: 100, c: 'mute' }] });
    cap(host, 'Después de 6 de 7 ganadores, subir el riesgo convierte una racha normal de pérdidas en un agujero.');
  };
  DG.loss = (host) => {
    const t = seq(31, 30, 0.55, 1.3); let e = 0; const v = [0, ...t.map((x) => (e += x))];
    CH.lines(box(host), [{ v, c: 'info', label: `${e.toFixed(1)} R` }], { h: 200, refs: [{ v: 0, c: 'mute' }], fmt: (z) => z.toFixed(0) + ' R', xlabel: 'Cada caída es una pérdida con el plan cumplido' });
    cap(host, 'Las pérdidas son escalones dentro de una curva que sube.');
  };
  DG.motivation = (host) => {
    const R = E.rng(9); let e = 0; const v = [0]; for (let i = 0; i < 60; i++) { e += (R() - 0.42) * 2; v.push(e); }
    CH.lines(box(host), [{ v, c: 'acc', label: 'Progreso real', area: true }, { v: v.map((_, i) => i * (e / 60)), c: 'mute', dash: true, label: 'Lo que esperas' }], { h: 200 });
    cap(host, 'El progreso real tiene semanas planas y retrocesos.');
  };

  // --- Tarjetas e infografías ---
  const card = (host, html) => host.appendChild(h(`<div class="dg-card">${html}</div>`));
  DG.roadmap = (host) => card(host, `<ol class="road">${window.PHASES.map((p) => `<li><b>Fase ${p.id} · ${p.name}</b><span>Días ${p.days[0]}–${p.days[1]}</span><small>${p.goal}</small></li>`).join('')}</ol>`);
  DG.platforms = (host) => card(host, `<table class="tbl"><thead><tr><th>Contrato</th><th>Índice</th><th class="r">$ por punto</th><th class="r">Tick (0,25)</th></tr></thead><tbody>
    <tr><td>NQ</td><td>Nasdaq 100</td><td class="r">20 $</td><td class="r">5 $</td></tr>
    <tr><td>MNQ</td><td>Nasdaq 100 micro</td><td class="r">2 $</td><td class="r">0,50 $</td></tr>
    <tr><td>ES</td><td>S&amp;P 500</td><td class="r">50 $</td><td class="r">12,50 $</td></tr>
    <tr><td>MES</td><td>S&amp;P 500 micro</td><td class="r">5 $</td><td class="r">1,25 $</td></tr></tbody></table>`);
  DG.candle = (host) => card(host, `<svg viewBox="0 0 360 200" class="anat" role="img" aria-label="Anatomía de una vela">
    <line x1="90" y1="20" x2="90" y2="180" style="stroke:var(--bull);stroke-width:2"/><rect x="70" y="60" width="40" height="80" style="fill:var(--bull-body);stroke:var(--bull);stroke-width:2"/>
    <line x1="250" y1="20" x2="250" y2="180" style="stroke:var(--bear);stroke-width:2"/><rect x="230" y="50" width="40" height="70" style="fill:var(--bear)"/>
    <g class="lbl" style="fill:var(--ink)"><text x="118" y="24">Máximo</text><text x="118" y="64">Cierre</text><text x="118" y="140">Apertura</text><text x="118" y="182">Mínimo</text>
    <text x="278" y="54">Apertura</text><text x="278" y="122">Cierre</text><text x="278" y="24">Mecha</text><text x="278" y="182">Mecha</text></g>
    <text x="90" y="198" text-anchor="middle" class="lbl" style="fill:var(--bull)">Alcista</text><text x="250" y="198" text-anchor="middle" class="lbl" style="fill:var(--bear)">Bajista</text></svg>`);
  DG.sessions = (host) => {
    const W = 720, x = (hr) => 20 + (hr / 24) * (W - 40);
    const seg = (a, b, c, t, row) => `<rect x="${x(a)}" y="${30 + row * 34}" width="${x(b) - x(a)}" height="26" rx="3" style="fill:var(--${c});opacity:.85"/><text x="${x(a) + 6}" y="${47 + row * 34}" class="lbl" style="fill:var(--on-${c})">${t}</text>`;
    let ticks = ''; for (let i = 0; i <= 24; i += 3) ticks += `<text x="${x(i)}" y="18" text-anchor="middle" class="axis">${i}:00</text><line x1="${x(i)}" x2="${x(i)}" y1="22" y2="128" style="stroke:var(--grid)"/>`;
    card(host, `<div class="scroll-x"><svg viewBox="0 0 ${W} 140" class="timeline" role="img" aria-label="Sesiones del mercado en hora de Nueva York">${ticks}
      ${seg(18, 24, 'mute-c', 'Asia', 0)}${seg(2, 5, 'mute-c', 'Londres', 0)}${seg(8, 16, 'mute-c', 'Nueva York', 0)}
      ${seg(20, 21.5, 'accent', '20:00–21:30', 1)}${seg(9.5, 11, 'accent', '9:30–11:00', 1)}
      ${seg(9.25, 9.5, 'info', 'Análisis', 2)}${seg(19.75, 20, 'info', '', 2)}</svg></div><p class="dg-cap">Hora de Nueva York. En ámbar, las dos ventanas operativas; en azul, los 15 minutos de análisis previo.</p>`);
  };
  DG.calc = (host) => card(host, `<div class="formula"><span>Contratos</span> = <span>Cuenta × Riesgo %</span> ÷ (<span>Puntos de stop</span> × <span>$ por punto</span>)</div>
    <p class="mono">50.000 × 0,5 % = 250 $ · stop 25 pts · MNQ 2 $ → 250 ÷ 50 = <b>5 contratos</b></p><p class="dg-cap">Practica este cálculo en Práctica → Calcula los contratos.</p>`);
  const list = (items, cls = 'checks') => `<ul class="${cls}">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  DG.checklist = (host) => card(host, list(['Estoy dentro de la ventana (9:30–11:00 o 20:00–21:30)', 'Hubo toma de liquidez (manipulación)', 'Una vela cerró invalidando un FVG (IFVG)', 'Hay un objetivo claro con R:R ≥ 1', 'Riesgo calculado: 0,5–0,7 %', 'Es mi único trade de la sesión']));
  DG.plan = (host) => card(host, `<div class="plan"><div><b>0,5–0,7 %</b><span>riesgo por trade</span></div><div><b>1</b><span>trade por sesión</span></div><div><b>1:1+</b><span>R:R mínimo</span></div><div><b>90 min</b><span>de ventana operativa</span></div></div>`);
  DG.journal = (host) => card(host, `<div class="scroll-x"><table class="tbl"><thead><tr><th>Fecha</th><th>Modelo</th><th>Dir.</th><th class="r">R:R</th><th class="r">Resultado</th><th class="r">Disciplina</th><th>Emoción</th></tr></thead><tbody>
    <tr><td>Lun</td><td>1</td><td>Long</td><td class="r">1:1,3</td><td class="r pos">+1,3 R</td><td class="r">100</td><td>Tranquilo</td></tr>
    <tr><td>Mar</td><td>2</td><td>Short</td><td class="r">1:1,1</td><td class="r neg">−1 R</td><td class="r">95</td><td>Ansioso</td></tr>
    <tr><td>Mié</td><td>—</td><td>—</td><td class="r">—</td><td class="r">0 R</td><td class="r">100</td><td>Sin setup</td></tr></tbody></table></div><p class="dg-cap">Ejemplo de formato. Tu diario real está en la pestaña Diario.</p>`);
  DG.simple = (host) => card(host, `<ol class="steps3"><li><b>Toma de liquidez</b><span>Manipulación de un máximo o mínimo</span></li><li><b>IFVG</b><span>Cierre que invalida un FVG</span></li><li><b>Objetivo claro</b><span>Liquidez o FVG sin tomar, R:R ≥ 1</span></li></ol>`);
  DG.posttrade = (host) => card(host, list(['Captura del gráfico con entrada, SL y TP', 'Registro en el diario (resultado en R)', 'Puntuación de disciplina', 'Emoción dominante', 'Cerrar los gráficos'], 'steps'));
  DG.fear = (host) => card(host, `<div class="vs"><div><b>Emoción</b>${list(['Mover el stop', 'Cerrar antes del TP', 'Entrar al revés tras perder', 'No entrar por miedo'], 'x')}</div><div><b>Regla</b>${list(['El stop no se toca', 'TP o SL deciden', 'Un SL y te vas', 'Checklist en verde = entro'], 'ok')}</div></div>`);
  DG.discipline = (host) => card(host, `<div class="vs"><div><b>Sin plan</b>${list(['3–5 trades por día', 'Riesgo variable', 'Opera fuera de horario'], 'x')}</div><div><b>Con plan</b>${list(['1 trade por sesión', '0,5–0,7 % siempre', 'Solo 9:30–11:00'], 'ok')}</div></div>`);
  DG.goals = (host) => card(host, `<div class="vs"><div><b>Meta de resultado</b>${list(['Ganar 5.000 $', 'Pasar el fondeo esta semana'], 'x')}</div><div><b>Meta de proceso</b>${list(['20 sesiones con disciplina ≥ 85', 'Diario de cada trade', '100 trades de backtesting'], 'ok')}</div></div>`);
  DG.scale = (host) => card(host, `<ol class="road"><li><b>Simulado</b><span>Disciplina ≥ 85 sostenida</span></li><li><b>1 cuenta de fondeo</b><span>Mismo plan, riesgo 0,5 %</span></li><li><b>Primeros retiros</b><span>Parte para nuevas cuentas</span></li><li><b>Cuentas replicadas</b><span>Una cuenta líder copia al resto</span></li></ol>`);
  DG.business = (host) => card(host, list(['Separa el dinero del negocio del personal', 'Registra costos: evaluaciones, datos, plataformas', 'Consulta a un contador de tu país antes de abrir una sociedad', 'Guarda comprobantes de cada retiro'], 'steps'));
  DG.profits = (host) => card(host, `<div class="split"><div style="flex:4" class="s1">Vida 40 %</div><div style="flex:4" class="s2">Reinversión 40 %</div><div style="flex:2" class="s3">Ahorro 20 %</div></div><p class="dg-cap">Ejemplo de reparto; define tus porcentajes antes del primer retiro.</p>`);

  window.DG = DG;
})();
