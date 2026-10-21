// Aplicación: navegación, progreso, lecciones, prácticas, simulador y diario.
(function () {
  const E = window.ENG, CH = window.CH, DG = window.DG;
  const $ = (q, r = document) => r.querySelector(q);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = E.fmt;
  const PLAYLIST = 'https://www.youtube.com/playlist?list=PL4hId-DTkHg50047_yeFJOvPK1rOCrSoR';

  // ---------- Estado y guardado ----------
  const KEY = 'lab-ifvg-v1';
  const blank = () => ({ lessons: {}, xp: 0, ex: {}, sims: [], exam: null, last: 1 });
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ }
  if (S.onb == null) S.onb = S.xp > 0; // quien ya tenía progreso no ve la bienvenida
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ } renderHeader(); };
  const addXP = (n) => { S.xp += Math.round(n); };

  // ---------- Niveles ----------
  const daysDone = (a, b) => { let k = 0; for (let d = a; d <= b; d++) if (S.lessons[d]?.passed) k++; return k; };
  const exAvg = (ids) => { const v = ids.map((id) => S.ex[id]?.best ?? 0); return v.reduce((a, b) => a + b, 0) / v.length; };
  const simAvg = (n) => { const v = S.sims.slice(-n); return v.length ? v.reduce((a, b) => a + b.score, 0) / v.length : 0; };
  const ID_EX = ['fvg', 'sweep', 'ifvg'], ALL_EX = ['fvg', 'sweep', 'ifvg', 'stop', 'target', 'model', 'calc'];
  function levels() {
    return [
      { n: 1, name: 'Novato', reqs: [] },
      { n: 2, name: 'Aprendiz', reqs: [['Completar días 1–9 (Fundamentos)', daysDone(1, 9), 9]] },
      { n: 3, name: 'Analista', reqs: [['Completar días 10–20 (Smart Money)', daysDone(10, 20), 11], ['Identificación (FVG, liquidez, IFVG) ≥ 70 %', Math.round(exAvg(ID_EX)), 70, '%']] },
      { n: 4, name: 'Operador', reqs: [['Completar días 21–39', daysDone(21, 39), 19], ['Sesiones en el simulador', S.sims.length, 10], ['Disciplina media (últimas 10) ≥ 75', Math.round(simAvg(10)), 75]] },
      { n: 5, name: 'Experto', reqs: [['Completar los 50 días', daysDone(1, 50), 50], ['Examen de la estrategia ≥ 7/8', S.exam ?? 0, 7], ['Sesiones en el simulador', S.sims.length, 30], ['Disciplina media (últimas 20) ≥ 85', Math.round(simAvg(20)), 85], ['Todas las prácticas ≥ 85 %', Math.round(Math.min(...ALL_EX.map((id) => S.ex[id]?.best ?? 0))), 85, '%']] },
    ];
  }
  function currentLevel() {
    const L = levels(); let cur = L[0];
    for (const l of L.slice(1)) { if (l.reqs.every((r) => r[1] >= r[2])) cur = l; else break; }
    return { cur, next: L[cur.n] || null };
  }

  // ---------- Navegación ----------
  const VIEWS = ['inicio', 'ruta', 'estrategia', 'practica', 'simulador', 'diario', 'bienvenida'];
  let view = 'inicio', lessonDay = null;
  function go(hash) {
    const m = /^dia(\d+)$/.exec(hash);
    if (m) { view = 'ruta'; lessonDay = Math.min(50, Math.max(1, +m[1])); }
    else { view = VIEWS.includes(hash) ? hash : 'inicio'; lessonDay = null; }
    if (!S.onb && !m) view = 'bienvenida';
    if (view !== 'bienvenida') document.body.classList.remove('onb');
    document.querySelectorAll('.nav a').forEach((a) => a.setAttribute('aria-current', a.dataset.v === view ? 'page' : 'false'));
    stopAuto();
    render();
    window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  function renderHeader() {
    const { cur } = currentLevel();
    $('#hdr-level').textContent = `Nivel ${cur.n} · ${cur.name}`;
    $('#hdr-xp').textContent = `${S.xp} XP`;
  }

  function render() {
    const main = $('#main');
    main.innerHTML = '';
    ({ bienvenida: vWelcome, inicio: vHome, ruta: lessonDay ? vLesson : vPath, estrategia: vStrategy, practica: vPractice, simulador: vSim, diario: vJournal })[view](main);
    renderHeader();
  }
  const H = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // ---------- Bienvenida (primera visita) ----------
  const SLIDES = [
    { t: 'Aprende a operar con una sola estrategia', d: '50 días del Esses Bootcamp, práctica guiada y un simulador que evalúa tu disciplina.', v: 'chart' },
    { t: 'Tres pasos, siempre los mismos', d: 'Toma de liquidez, IFVG y objetivo claro. Si falta uno, no hay trade.', v: 'steps' },
    { t: 'Tu nota mide el proceso, no la suerte', d: 'Cada sesión simulada recibe una nota de disciplina sobre 100 según tu plan de trading.', v: 'score' },
  ];
  let slide = 0;
  function vWelcome(m) {
    document.body.classList.add('onb');
    const sl = SLIDES[slide], last = slide === SLIDES.length - 1;
    const el = H(`<section class="welcome">
      <div class="w-top"><button class="link" type="button" id="w-skip">Saltar ›</button></div>
      <div class="w-vis" id="w-vis"></div>
      <div class="w-txt"><h1>${sl.t}</h1><p class="lead">${sl.d}</p>
        <div class="dots" aria-label="Paso ${slide + 1} de ${SLIDES.length}">${SLIDES.map((_, i) => `<span class="${i === slide ? 'on' : ''}"></span>`).join('')}</div>
        <button class="btn pri wide" type="button" id="w-next">${last ? 'Empezar' : 'Continuar'}</button></div>
    </section>`);
    m.appendChild(el);
    const vis = $('#w-vis');
    if (sl.v === 'chart') { const c = H('<div class="float-card"><div class="fc-head"><span>NQ · 1 minuto</span><span class="tag">Modelo 1</span></div><div id="w-chart"></div><div class="fc-msg">El precio barrió el mínimo e invalidó el FVG</div></div>'); vis.appendChild(c); vis.appendChild(H('<span class="float-tag">✓ Toma de liquidez + IFVG</span>')); requestAnimationFrame(() => { const F = CH.findSession('model1', 'm1', (S2, f) => f && f.model === 1); const { ann } = CH.setupAnn(F.S.C, F.f); CH.candlesA($('#w-chart'), F.S.C.slice(22, F.f.t + 12), { ann: ann.filter((a) => a.k === 'box' || a.k === 'h').map((a) => { const y = { ...a }; for (const k of ['i', 'i0', 'i1']) if (y[k] != null) y[k] -= 22; y.t = ''; return y; }), h: 170, axis: false }); }); }
    if (sl.v === 'steps') vis.appendChild(H('<div class="w-steps"><div><i>1</i><b>Toma de liquidez</b><span>Barre un máximo o mínimo</span></div><div><i>2</i><b>IFVG</b><span>Un cierre invalida el FVG</span></div><div><i>3</i><b>Objetivo claro</b><span>Liquidez sin tomar, R:R ≥ 1</span></div></div>'));
    if (sl.v === 'score') vis.appendChild(H('<div class="w-score"><div class="ring"><b>92</b><span>de 100</span></div><ul><li>✓ Horario</li><li>✓ Toma de liquidez</li><li>✓ IFVG</li><li class="warn-i">! Stop lejos</li></ul></div>'));
    const finish = () => { S.onb = true; save(); document.body.classList.remove('onb'); location.hash = 'inicio'; go('inicio'); };
    $('#w-next').onclick = () => { if (last) finish(); else { slide++; render(); } };
    $('#w-skip').onclick = finish;
  }

  // Hora de Nueva York y estado de la ventana operativa
  function nyStatus() {
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
      const min = (+parts.hour % 24) * 60 + +parts.minute, wd = parts.weekday;
      const weekend = wd === 'Sat' || wd === 'Sun';
      if (!weekend && min >= 570 && min < 660) return { open: true, text: `Ventana abierta · quedan ${660 - min} min` };
      if (!weekend && min < 570) { const d = 570 - min; return { open: false, text: `Faltan ${Math.floor(d / 60) ? Math.floor(d / 60) + ' h ' : ''}${d % 60} min para la apertura` }; }
      return { open: false, text: weekend || wd === 'Fri' ? 'Próxima apertura: lunes 9:30 (NY)' : 'Próxima apertura: mañana 9:30 (NY)' };
    } catch (e) { return { open: false, text: 'Sesión NY AM 9:30–11:00' }; }
  }

  // ---------- Inicio ----------
  function vHome(m) {
    const { cur, next } = currentLevel();
    const done = daysDone(1, 50);
    const nextDay = (() => { for (let d = 1; d <= 50; d++) if (!S.lessons[d]?.passed) return d; return 50; })();
    const NL = window.LESSONS.find((l) => l.d === nextDay);
    const totR = S.sims.reduce((a, b) => a + (b.R || 0), 0);
    const pct = next ? Math.round(next.reqs.reduce((a, [, v, g]) => a + Math.min(1, v / g), 0) / next.reqs.length * 100) : 100;
    const pend = next ? next.reqs.find(([, v, g]) => v < g) : null;
    const ny = nyStatus();
    m.appendChild(H(`<section class="g-hero">
      <div class="g-row"><span class="pill-dark ${ny.open ? 'live' : ''}"><i></i>${ny.text}</span></div>
      <h1>Hola de nuevo,<br><b>${done ? `sigamos con el día ${nextDay}` : 'empecemos por el día 1'}</b></h1>
      <div class="lvl-card">
        <div class="lvl-top"><span><small>Tu nivel</small><b>${cur.n} · ${cur.name}</b></span><span class="xp">${S.xp.toLocaleString('es-ES')} <small>XP</small></span></div>
        <i class="gbar"><i style="width:${pct}%"></i></i>
        <small>${next ? `Para ${next.name}: ${pend ? pend[0].toLowerCase() : 'casi listo'}` : 'Nivel máximo alcanzado'}</small>
      </div>
    </section>`));
    m.appendChild(H(`<section class="card rows">
      <div><span>Disciplina media</span><b>${S.sims.length ? Math.round(simAvg(20)) + ' / 100' : '—'}</b></div>
      <div><span>Resultado simulado</span><b class="${totR >= 0 ? 'pos' : 'neg'}">${S.sims.length ? (totR >= 0 ? '+' : '') + totR.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' R' : '—'}</b></div>
      <div><span>Días completados</span><b>${done} / 50</b></div>
      <div><span>Identificación</span><b>${Math.round(exAvg(ID_EX))} %</b></div>
    </section>`));
    m.appendChild(H(`<section class="actions">
      <a href="#dia${nextDay}" class="act"><i>›</i><span><small>Seguir</small><b>Día ${nextDay}</b><em>${esc(NL.t)}</em></span></a>
      <a href="#practica" class="act acc"><i>+</i><span><small>Practicar</small><b>Ejercicios</b><em>Rondas de 5</em></span></a>
      <a href="#simulador" class="act lav"><i>▸</i><span><small>Abrir</small><b>Sesión</b><em>NY AM simulada</em></span></a>
    </section>`));
    const last = S.sims.slice(-5);
    m.appendChild(H(`<section class="card"><div class="card-head"><h2>Disciplina por sesión</h2><span class="muted small">últimas ${last.length || 5}</span></div>
      ${last.length ? `<div class="pbars">${last.map((x, i) => `<div><span>${x.score}</span><i class="${x.score >= 85 ? 'g' : x.score >= 50 ? 'y' : 'p'}" style="--h:${Math.max(6, x.score)}%;animation-delay:${i * 80}ms"></i></div>`).join('')}</div>
      <div class="legend"><span><i class="g"></i>Con el plan (≥ 85)</span><span><i class="y"></i>Mejorable</span><span><i class="p"></i>Fuera del plan</span></div>`
      : '<p class="muted">Todavía no hay sesiones. Tu primera sesión simulada aparecerá aquí con su nota de disciplina.</p><a class="btn" href="#simulador">Abrir el simulador</a>'}</section>`));
    const how = H('<section class="card"><div class="card-head"><h2>Así se ve un trade del plan</h2><span class="muted small">Modelo 1</span></div><div id="hero-chart"></div></section>');
    m.appendChild(how);
    requestAnimationFrame(() => DG.m1($('#hero-chart')));
    if (next) m.appendChild(H(`<section class="card"><div class="card-head"><h2>Para llegar a ${next.name}</h2><span class="muted small">Nivel ${next.n}</span></div><ul class="reqs">${next.reqs.map(([t, v, g, u = '']) => `<li class="${v >= g ? 'ok' : ''}"><span>${t}</span><b>${v}${u} / ${g}${u}</b></li>`).join('')}</ul></section>`));
    m.appendChild(H(`<p class="disclaimer">Material educativo no oficial, elaborado a partir de los títulos del bootcamp y de la explicación de la estrategia de Fede Esses. Los gráficos de práctica se generan por simulación; no son datos reales del mercado. Operar futuros con apalancamiento implica riesgo de pérdida. Mira los videos originales en <a href="${PLAYLIST}" target="_blank" rel="noopener">YouTube</a>.</p>`));
  }

  // ---------- Ruta ----------
  function vPath(m) {
    const nextDay = (() => { for (let d = 1; d <= 50; d++) if (!S.lessons[d]?.passed) return d; return 50; })();
    const NL = window.LESSONS.find((l) => l.d === nextDay);
    m.appendChild(H(`<header class="page-head"><h1>Mi ruta de 50 días</h1><p class="lead">Cada día tiene un resumen, un diagrama y un control de 2 preguntas.</p></header>`));
    m.appendChild(H(`<a class="g-card" href="#dia${nextDay}"><small>Continuar · Día ${nextDay}</small><b>${esc(NL.t)}</b><i>›</i></a>`));
    for (const p of window.PHASES) {
      const ls = window.LESSONS.filter((l) => l.d >= p.days[0] && l.d <= p.days[1]);
      const k = daysDone(p.days[0], p.days[1]), pc = Math.round(k / ls.length * 100);
      const st = pc === 100 ? ['Completa', 'pos'] : pc ? ['En curso', 'acc-t'] : ['Pendiente', 'muted'];
      m.appendChild(H(`<section class="card phase"><div class="card-head line"><h2>${p.name}</h2><span class="muted small">Fase ${p.id}</span></div>
        <p class="muted small">${p.goal}</p>
        <i class="gbar big"><i style="width:${pc}%"></i></i>
        <div class="stats3"><span><small>Días</small>${p.days[0]}–${p.days[1]}</span><span><small>Completados</small>${k} de ${ls.length}</span><span><small>Estado</small><b class="${st[1]}">${st[0]}</b></span></div>
        <div class="days">${ls.map((l) => `<a class="day ${S.lessons[l.d]?.passed ? 'done' : ''} ${l.d === nextDay ? 'now' : ''}" href="#dia${l.d}"><span class="dn">${l.d}</span><span class="dt">${esc(l.t)}</span></a>`).join('')}</div></section>`));
    }
  }

  function vLesson(m) {
    const L = window.LESSONS.find((l) => l.d === lessonDay);
    const P = window.PHASES.find((p) => L.d >= p.days[0] && L.d <= p.days[1]);
    S.last = L.d; save();
    const st = S.lessons[L.d] || {};
    const el = H(`<article class="lesson">
      <nav class="crumbs"><a href="#ruta">Ruta</a> / Fase ${P.id} · ${P.name}</nav>
      <header class="page-head"><p class="eyebrow">Día ${L.d} de 50</p><h1>${esc(L.t)}</h1><p class="lead">${esc(L.sum)}</p></header>
      <div class="dg" id="dg"></div>
      <section class="panel"><h2>Ideas clave</h2><ul class="keys">${L.pts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="muted small">Video original: “${esc(L.t)} | Esses Bootcamp Día ${L.d}” en la <a href="${PLAYLIST}" target="_blank" rel="noopener">playlist de YouTube</a>.</p></section>
      <section class="panel quiz" id="quiz"><h2>Control del día</h2>${st.passed ? '<p class="pill ok">Aprobado</p>' : ''}</section>
      <nav class="pager">${L.d > 1 ? `<a class="btn" href="#dia${L.d - 1}">← Día ${L.d - 1}</a>` : '<span></span>'}${L.d < 50 ? `<a class="btn" href="#dia${L.d + 1}">Día ${L.d + 1} →</a>` : '<a class="btn" href="#estrategia">Examen final →</a>'}</nav>
    </article>`);
    m.appendChild(el);
    requestAnimationFrame(() => { const f = DG[L.dg]; if (f) f($('#dg')); });
    quiz($('#quiz'), L.q, (ok, total, firstTry) => {
      const prev = S.lessons[L.d] || {};
      if (ok === total) {
        if (!prev.passed) addXP(20 + (firstTry ? 10 : 0));
        S.lessons[L.d] = { passed: true, at: Date.now() };
        save();
        return L.d < 50 ? `<p class="ok-msg">Día ${L.d} completado. <a href="#dia${L.d + 1}">Seguir con el día ${L.d + 1}</a></p>` : '<p class="ok-msg">Terminaste el bootcamp. Ahora: examen final y sesiones simuladas.</p>';
      }
      return `<p class="bad-msg">${ok}/${total}. Repasa las ideas clave y vuelve a intentarlo.</p>`;
    });
  }

  // Cuestionario reutilizable
  function quiz(host, Q, onDone) {
    let attempts = 0;
    const form = H(`<form class="qform">${Q.map((q, i) => `<fieldset><legend>${i + 1}. ${esc(q.q)}</legend>${q.o.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}" id="q${i}o${j}"><span>${esc(o)}</span></label>`).join('')}<p class="exp" hidden></p></fieldset>`).join('')}<div class="row"><button class="btn pri" type="submit">Comprobar</button></div><div class="result"></div></form>`);
    host.appendChild(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault(); attempts++;
      let ok = 0;
      Q.forEach((q, i) => {
        const fs = form.querySelectorAll('fieldset')[i];
        const v = form.querySelector(`input[name=q${i}]:checked`);
        const good = v && +v.value === q.a;
        if (good) ok++;
        fs.classList.toggle('good', !!good); fs.classList.toggle('bad', !good);
        const exp = fs.querySelector('.exp');
        exp.hidden = false;
        exp.textContent = good ? (q.e || 'Correcto.') : v ? `Incorrecto. ${q.e || ''}` : 'Elige una opción.';
      });
      form.querySelector('.result').innerHTML = onDone(ok, Q.length, attempts === 1);
    });
  }

  // ---------- Estrategia ----------
  function vStrategy(m) {
    m.appendChild(H(`<header class="page-head"><p class="eyebrow">La estrategia</p><h1>Toma de liquidez + IFVG + objetivo claro</h1><p class="lead">Basada en Smart Money Concepts. Se opera en futuros del Nasdaq (NQ) o del S&amp;P 500 (ES), en una sola ventana de 90 minutos, con un trade por sesión.</p></header>`));
    m.appendChild(H(`<section class="three">
      <div class="step"><span class="k">1</span><h3>Toma de liquidez</h3><p>El precio barre un máximo o mínimo (pre-market, interno o del día) y no logra cerrar más allá. Es la manipulación.</p></div>
      <div class="step"><span class="k">2</span><h3>IFVG</h3><p>Una vela cierra al otro lado de un FVG y lo invalida. Ese cierre es la entrada.</p></div>
      <div class="step"><span class="k">3</span><h3>Objetivo claro</h3><p>Liquidez sin tomar o un FVG sin rellenar, con R:R de al menos 1:1.</p></div></section>`));
    const sess = H('<section class="panel"><h2>Horario operativo</h2><div id="dg-sess"></div></section>'); m.appendChild(sess);
    DG.sessions($('#dg-sess'));
    const models = [
      [1, 'Manipulación', '9:30–10:00', 'El mercado abre, manipula (barre liquidez), reacciona en un punto de interés y da un IFVG. Es la variable preferida de Fede.'],
      [2, 'Continuación', '10:00–10:30 (hasta 11:00)', 'La apertura no manipuló: expandió. Esperas un retroceso a un FVG, una toma de liquidez interna y un IFVG a favor de la expansión.'],
      [3, 'Retroceso', 'Tras una expansión sin entrada', 'El precio expandió sin dar continuación. Como no equilibró compradores y vendedores, esperas la toma del extremo y un IFVG hacia los FVG sin rellenar.'],
    ];
    for (const [n, t, w, d] of models) {
      const sec = H(`<section class="panel model"><div class="model-head"><span class="k">${n}</span><div><h2>Modelo ${n} · ${t}</h2><p class="muted">${w}</p></div></div><p>${d}</p><div id="dgm${n}"></div></section>`);
      m.appendChild(sec);
      requestAnimationFrame(() => DG['m' + n]($(`#dgm${n}`)));
    }
    m.appendChild(H(`<section class="panel"><h2>Plan de trading</h2><div id="dg-plan"></div>
      <ul class="keys"><li>Si se da la variable 1, no buscas la 2: un TP y te vas, un SL y te vas.</li><li>Stop detrás del extremo de la toma de liquidez. Break even al alcanzar el primer máximo o mínimo intermedio que no es tu objetivo.</li><li>Análisis de arriba hacia abajo: 4H y 1H → 15m y 5m → 1m.</li><li>Si el día no tiene condiciones, no se opera.</li></ul></section>`));
    DG.plan($('#dg-plan'));
    const ex = H(`<section class="panel quiz"><h2>Examen de la estrategia</h2><p class="muted">8 preguntas. Necesitas 7 para el nivel Experto.${S.exam != null ? ` Mejor resultado: <b>${S.exam}/8</b>.` : ''}</p><div id="exam"></div></section>`);
    m.appendChild(ex);
    quiz($('#exam'), window.EXAM, (ok, total) => {
      const prev = S.exam ?? -1;
      if (ok > prev) { addXP((ok - Math.max(0, prev)) * 5); S.exam = ok; save(); }
      return ok >= 7 ? `<p class="ok-msg">${ok}/${total}. Aprobado.</p>` : `<p class="bad-msg">${ok}/${total}. Necesitas 7.</p>`;
    });
  }

  // ---------- Práctica ----------
  const EXS = [
    { id: 'fvg', t: 'Detecta el FVG', d: 'Toca la vela central de un Fair Value Gap.' },
    { id: 'sweep', t: 'Toma de liquidez', d: 'Encuentra la vela que barre el nivel marcado.' },
    { id: 'ifvg', t: 'Encuentra el IFVG', d: 'Toca la vela que cierra invalidando el FVG.' },
    { id: 'stop', t: 'Coloca el stop', d: 'Elige el precio lógico para el stop loss.' },
    { id: 'target', t: 'Elige el objetivo', d: 'Pon el TP en liquidez o en un FVG sin rellenar.' },
    { id: 'model', t: '¿Qué modelo es?', d: 'Clasifica el setup: modelo 1, 2 o 3.' },
    { id: 'calc', t: 'Calcula los contratos', d: 'Tamaño de posición según el plan de riesgo.' },
  ];
  let EX = null;
  function vPractice(m) {
    if (EX && EX.active) return exRun(m);
    m.appendChild(H(`<header class="page-head"><p class="eyebrow">Práctica evaluada</p><h1>Entrena el ojo</h1><p class="lead">Rondas de 5 ejercicios sobre gráficos de 1 minuto generados al azar. Cada respuesta se corrige con las reglas de la estrategia y se explica.</p></header>`));
    const g = H('<div class="excards"></div>');
    for (const x of EXS) {
      const r = S.ex[x.id];
      g.appendChild(H(`<button class="excard" data-id="${x.id}" type="button"><b>${x.t}</b><span>${x.d}</span><span class="exstat">${r ? `Mejor ${r.best} % · ${r.runs} ronda${r.runs > 1 ? 's' : ''}` : 'Sin intentos'}</span><i class="bar"><i style="width:${r?.best || 0}%"></i></i></button>`));
    }
    m.appendChild(g);
    g.addEventListener('click', (e) => { const b = e.target.closest('.excard'); if (!b) return; EX = { active: true, id: b.dataset.id, k: 0, ok: 0, round: null }; render(); });
  }

  const rand = () => Math.floor(Math.random() * 1e9);
  function makeRound(id) {
    for (let tries = 0; tries < 200; tries++) {
      const sd = rand(), Ss = E.genSession(sd), C = Ss.C, v = Ss.vol;
      if (id === 'fvg') {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const all = E.fvgs(C).filter((f) => f.dir === dir && f.top - f.bot >= v * 0.25);
        if (!all.length) continue;
        const f = all[Math.floor(Math.random() * all.length)];
        const a = Math.max(0, f.i - 30), b = Math.min(C.length, Math.max(f.formed + 6, a + 45));
        const valid = E.fvgs(C, b).filter((x) => x.dir === dir && x.i >= a && x.formed < b);
        return { C: C.slice(a, b), a, mode: 'bar', prompt: `Toca la vela central (la 2.ª) de un FVG ${dir > 0 ? 'alcista' : 'bajista'}.`,
          check: (i) => { const hit = valid.find((x) => x.i === i); return { ok: !!hit, msg: hit ? `Correcto: el ${dir > 0 ? 'mínimo de la vela 3 queda por encima del máximo de la vela 1' : 'máximo de la vela 3 queda por debajo del mínimo de la vela 1'}.` : `Esa vela no es el centro de un FVG ${dir > 0 ? 'alcista' : 'bajista'}. Busca 3 velas donde las mechas de la 1 y la 3 no se tocan.` }; },
          reveal: valid.map((x) => ({ k: 'box', i0: x.i - 1, i1: x.formed + 3, p0: x.bot, p1: x.top, c: dir > 0 ? 'bull' : 'bear', t: 'FVG' })) };
      }
      if (id === 'sweep') {
        const sw = E.sweeps(C).filter((x) => x.j >= 8 && x.j - x.level.i >= 4);
        if (!sw.length) continue;
        const s = sw[Math.floor(Math.random() * sw.length)];
        const b = Math.min(C.length, s.j + 7), a = Math.max(0, Math.min(s.level.i - 8, b - 40));
        return { C: C.slice(a, b), a, mode: 'bar', prompt: `Toca la vela que toma la liquidez del ${s.level.type === 'L' ? 'mínimo' : 'máximo'} marcado.`,
          ann: [{ k: 'h', p: s.level.p, i0: s.level.i, i1: b, c: 'acc', t: s.level.type === 'L' ? 'Mínimo' : 'Máximo', below: s.level.type === 'L' }],
          check: (i) => ({ ok: i === s.j, msg: i === s.j ? `Correcto: la vela de las ${E.hhmm(s.j)} supera el nivel y el precio vuelve a cerrar ${s.level.type === 'L' ? 'arriba' : 'abajo'}.` : `La toma es la primera vela que supera el nivel (${E.hhmm(s.j)}).` }),
          reveal: [{ k: 'mark', i: s.j, pos: s.level.type === 'L' ? 'below' : 'above', c: 'acc', t: 'Toma de liquidez' }] };
      }
      if (id === 'ifvg') {
        const iv = E.ifvgs(C).filter((x) => x.fvg.top - x.fvg.bot >= v * 0.25 && x.t - x.fvg.formed >= 2 && x.fvg.i > 8);
        if (!iv.length) continue;
        const x = iv[Math.floor(Math.random() * iv.length)];
        const b = Math.min(C.length, x.t + 6), a = Math.max(0, Math.min(x.fvg.i - 12, b - 40));
        const nm = x.fvg.dir > 0 ? 'alcista' : 'bajista';
        return { C: C.slice(a, b), a, mode: 'bar', prompt: `Este FVG ${nm} va a ser invalidado. Toca la vela que lo convierte en IFVG.`,
          ann: [{ k: 'box', i0: x.fvg.i - 1, i1: b, p0: x.fvg.bot, p1: x.fvg.top, c: x.fvg.dir > 0 ? 'bull' : 'bear', t: `FVG ${nm}` }],
          check: (i) => ({ ok: i === x.t, msg: i === x.t ? `Correcto: cierra ${x.fvg.dir > 0 ? 'por debajo' : 'por encima'} del FVG. Ahora es un IFVG ${x.dir > 0 ? 'alcista (compras)' : 'bajista (ventas)'}.` : `Cuenta el CIERRE, no la mecha. La vela que cierra al otro lado es la de las ${E.hhmm(x.t)}.` }),
          reveal: [{ k: 'mark', i: x.t, pos: x.dir > 0 ? 'above' : 'below', c: 'info', t: 'IFVG' }] };
      }
      const f = E.firstSetup(C);
      if (!f) continue;
      if (id === 'stop' || id === 'target') {
        const tg = E.targets(C, f.t, f.dir);
        const b = f.t + 1, a = Math.max(0, Math.min(f.sweep.level.i - 4, ...tg.slice(0, 3).map((x) => x.i - 4), b - 40));
        const base = [{ k: 'h', p: f.entry, i0: f.t - 2, i1: f.t + 5, c: 'ink', t: `Entrada ${f.dir > 0 ? 'long' : 'short'}`, dash: false }];
        if (id === 'stop') {
          const ext = f.dir > 0 ? Math.min(...C.slice(f.sweep.j, f.t + 1).map((x) => x.l)) : Math.max(...C.slice(f.sweep.j, f.t + 1).map((x) => x.h));
          return { C: C.slice(a, b), a, slots: b - a + 5, mode: 'price', prompt: `Entras en ${f.dir > 0 ? 'compra' : 'venta'} al cierre del IFVG. Toca el precio de tu stop loss.`, ann: base,
            check: (p) => { const beyond = f.dir > 0 ? p < ext : p > ext; const far = Math.abs(p - ext) > v * 3; const ok = beyond && !far; return { ok, msg: ok ? `Correcto: stop en ${fmt(p)}, detrás del extremo de la manipulación (${fmt(ext)}).` : !beyond ? `El stop tiene que ir ${f.dir > 0 ? 'debajo' : 'encima'} del extremo de la toma de liquidez (${fmt(ext)}). Si no, cualquier retesteo te saca.` : `Demasiado lejos (${fmt(p)}): arriesgas de más sin motivo. Ponlo justo detrás de ${fmt(ext)}.` }; },
            reveal: [{ k: 'h', p: ext, i0: f.sweep.j - a < 0 ? 0 : f.sweep.j, i1: b + 5, c: 'bear', t: 'Extremo de la manipulación', below: f.dir > 0 }] };
        }
        const valid = tg.filter((x) => Math.abs(x.p - f.entry) >= Math.abs(f.entry - f.stop));
        const risk = Math.abs(f.entry - f.stop), tol = Math.max(2, risk * 0.2);
        return { C: C.slice(a, b), a, slots: b - a + 5, mode: 'price', prompt: `Compraste/vendiste en el IFVG con el stop marcado. Toca el precio de tu take profit.`.replace('Compraste/vendiste', f.dir > 0 ? 'Compraste' : 'Vendiste'),
          ann: [...base, { k: 'h', p: f.stop, i0: f.t - 2, i1: f.t + 5, c: 'bear', t: 'SL', below: f.dir > 0 }],
          check: (p) => {
            const rr = (p - f.entry) * f.dir / risk;
            const hit = valid.find((x) => (x.p2 != null ? p >= Math.min(x.p, x.p2) - tol && p <= Math.max(x.p, x.p2) + tol : Math.abs(p - x.p) <= tol));
            if (rr < 1) return { ok: false, msg: `R:R 1:${Math.max(0, rr).toFixed(2)}. Por debajo de 1:1 no compensa. Busca un objetivo más lejos.` };
            return hit ? { ok: true, msg: `Correcto: ${hit.kind} con R:R 1:${rr.toFixed(1)}.` } : { ok: false, msg: `R:R 1:${rr.toFixed(1)}, pero no hay liquidez ni FVG en ese precio. El objetivo claro más cercano era ${valid[0] ? `${valid[0].kind} en ${fmt(valid[0].p)}` : 'ninguno'}.` };
          },
          reveal: valid.slice(0, 3).map((x) => (x.p2 != null ? { k: 'box', i0: x.i - 1, i1: b + 5, p0: x.p, p1: x.p2, c: 'acc', t: x.kind } : { k: 'h', p: x.p, i0: x.i, i1: b + 5, c: 'bull', t: x.kind })) };
      }
      if (id === 'model') {
        const { ann, res } = CH.setupAnn(C, f);
        const b = Math.min(C.length, res.i + 4), a = 14;
        const names = { 1: 'Modelo 1 · Manipulación', 2: 'Modelo 2 · Continuación', 3: 'Modelo 3 · Retroceso' };
        const why = { 1: 'La toma de liquidez ocurrió en la apertura (antes de las 9:45) y la entrada llegó enseguida.', 2: 'La apertura expandió y el trade va a favor de esa expansión, tras un retroceso.', 3: 'La apertura expandió y el trade va en contra de la expansión: es el retroceso para equilibrar.' };
        return { C: C.slice(a, b), a, mode: 'choice', ann: ann.filter((x) => x.k !== 'trade'), choices: [1, 2, 3].map((k) => names[k]), prompt: '¿Qué modelo de entrada es este setup?',
          check: (k) => ({ ok: k + 1 === f.model, msg: `${k + 1 === f.model ? 'Correcto.' : `Es el ${names[f.model]}.`} ${why[f.model]}` }), reveal: ann.filter((x) => x.k === 'trade') };
      }
      if (id === 'calc') {
        const accts = [25000, 50000, 100000, 150000], rks = [0.5, 0.6, 0.7], inst = [['MNQ', 2], ['NQ', 20], ['MES', 5], ['ES', 50]];
        const acct = accts[Math.floor(Math.random() * 4)], rk = rks[Math.floor(Math.random() * 3)];
        let [nm, pv] = inst[Math.floor(Math.random() * 4)];
        const stop = 8 + Math.floor(Math.random() * 30);
        let ans = Math.floor(acct * rk / 100 / (stop * pv));
        if (ans < 1) { nm = nm.startsWith('M') ? nm : 'M' + nm; pv = nm === 'MNQ' ? 2 : 5; ans = Math.floor(acct * rk / 100 / (stop * pv)); }
        if (ans < 1) continue;
        const riskUsd = acct * rk / 100;
        return { mode: 'number', prompt: `Cuenta de ${acct.toLocaleString('es-ES')} $, riesgo ${String(rk).replace('.', ',')} %, stop de ${stop} puntos en ${nm} (${pv} $ por punto). ¿Cuántos contratos?`,
          check: (x) => ({ ok: x === ans, msg: `${x === ans ? 'Correcto.' : `Son ${ans}.`} ${riskUsd.toLocaleString('es-ES')} $ ÷ (${stop} × ${pv} $ = ${stop * pv} $) = ${(riskUsd / (stop * pv)).toFixed(2).replace('.', ',')} → redondeado hacia abajo: ${ans}.` }) };
      }
    }
    return null;
  }

  function exRun(m) {
    const meta = EXS.find((x) => x.id === EX.id);
    if (!EX.round) EX.round = makeRound(EX.id);
    const R = EX.round;
    const el = H(`<section class="exrun"><nav class="crumbs"><a href="#practica" id="ex-back">Práctica</a> / ${meta.t}</nav>
      <div class="exbar"><b>Ejercicio ${EX.k + 1} de 5</b><span>Aciertos: ${EX.ok}</span></div>
      <h2 class="prompt">${esc(R.prompt)}</h2><div class="dg-chart" id="ex-chart"></div><div id="ex-input"></div><div id="ex-fb" class="fb" aria-live="polite"></div></section>`);
    m.appendChild(el);
    $('#ex-back').addEventListener('click', () => { EX = null; });
    let answered = false;
    const draw = (extra = []) => { if (R.C) CH.candles($('#ex-chart'), R.C, { ann: [...(R.ann || []), ...extra].map((x) => shift(x, R.a)), times: true, t0: R.a, h: 300, slots: R.slots, onPick: answered ? null : pick, cross: true, minBw: 7 }); };
    const shift = (x, a) => { const y = { ...x }; for (const k of ['i', 'i0', 'i1']) if (y[k] != null) y[k] -= a; return y; };
    const finish = (res, extra) => {
      answered = true;
      if (res.ok) EX.ok++;
      draw([...(R.reveal || []), ...(extra || [])]);
      const last = EX.k === 4;
      $('#ex-fb').innerHTML = `<div class="fb-box ${res.ok ? 'good' : 'bad'}"><b>${res.ok ? 'Bien' : 'Revisa'}</b><p>${esc(res.msg)}</p></div><button class="btn pri" id="ex-next" type="button">${last ? 'Ver resultado' : 'Siguiente'}</button>`;
      $('#ex-next').addEventListener('click', () => {
        if (last) return exEnd();
        EX.k++; EX.round = null; render();
      });
      $('#ex-next').focus();
    };
    function pick(q) {
      if (answered) return;
      if (R.mode === 'bar') { if (q.i < 0 || q.i >= R.C.length) return; finish(R.check(q.i + R.a), [{ k: 'mark', i: q.i + R.a, pos: 'above', c: 'mute', t: 'Tu respuesta' }]); }
      if (R.mode === 'price') finish(R.check(q.p), [{ k: 'h', p: q.p, c: 'info', t: `Tu respuesta ${fmt(q.p)}`, dash: false, right: true }]);
    }
    if (R.C) requestAnimationFrame(() => draw());
    else $('#ex-chart').hidden = true;
    const inp = $('#ex-input');
    if (R.mode === 'choice') {
      inp.appendChild(H(`<div class="row choices">${R.choices.map((c, k) => `<button class="btn" type="button" data-k="${k}">${c}</button>`).join('')}</div>`));
      inp.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (!b || answered) return; finish(R.check(+b.dataset.k)); });
    } else if (R.mode === 'number') {
      inp.appendChild(H('<form class="row" id="calc-f"><label for="calc-n" class="sr">Contratos</label><input id="calc-n" type="number" min="0" step="1" inputmode="numeric" placeholder="Contratos" required><button class="btn pri" type="submit">Comprobar</button></form>'));
      $('#calc-f').addEventListener('submit', (e) => { e.preventDefault(); if (answered) return; finish(R.check(Math.floor(+$('#calc-n').value))); });
    } else {
      inp.appendChild(H(`<p class="muted small">${R.mode === 'bar' ? 'Toca una vela en el gráfico.' : 'Toca el gráfico a la altura del precio elegido.'}</p>`));
    }
  }
  function exEnd() {
    const pct = Math.round(EX.ok / 5 * 100);
    const r = S.ex[EX.id] || { best: 0, runs: 0, hist: [] };
    r.runs++; r.best = Math.max(r.best, pct); r.hist = [...(r.hist || []), pct].slice(-20);
    S.ex[EX.id] = r; addXP(EX.ok * 5); save();
    const meta = EXS.find((x) => x.id === EX.id);
    const m = $('#main'); m.innerHTML = '';
    m.appendChild(H(`<section class="panel center"><p class="eyebrow">${meta.t}</p><h1 class="big">${pct} %</h1><p>${EX.ok} de 5 correctos · +${EX.ok * 5} XP</p><p class="muted">${pct >= 85 ? 'Nivel experto en este ejercicio.' : pct >= 70 ? 'Bien. Repite hasta superar 85 %.' : 'Repasa la lección correspondiente y vuelve a intentarlo.'}</p>
      <div class="row center"><button class="btn pri" id="again" type="button">Otra ronda</button><a class="btn" href="#practica" id="back2">Volver</a></div></section>`));
    const id = EX.id;
    $('#again').addEventListener('click', () => { EX = { active: true, id, k: 0, ok: 0, round: null }; render(); });
    $('#back2').addEventListener('click', () => { EX = null; });
    EX = null;
  }

  // ---------- Simulador ----------
  const INST = { MNQ: 2, NQ: 20, MES: 5, ES: 50 };
  let SIM = null, autoT = null;
  function stopAuto() { if (autoT) { clearInterval(autoT); autoT = null; } }
  function newSim(seed) {
    const sd = seed ?? rand();
    SIM = { tf: SIM?.tf || 1, htfTf: SIM?.htfTf || 60, seed: sd, S: E.genSession(sd), t: E.OPEN - 1, trades: [], open: null, order: null, done: false, assist: SIM?.assist ?? true, inst: SIM?.inst || 'MNQ', acct: SIM?.acct || 50000, risk: SIM?.risk ?? 0.5, result: null };
  }
  function vSim(m) {
    if (!SIM) newSim();
    m.appendChild(H(`<header class="page-head slim"><p class="eyebrow">Simulador · NQ · NY AM · 1m a 15m</p><h1>Sesión simulada</h1><p class="lead">Avanza vela a vela desde las 9:29. Opera solo si se cumple el checklist; si no, termina la sesión sin operar. Al final recibes tu nota de disciplina.</p></header>`));
    const wrap = H(`<section class="sim">
      <div class="sim-top">
        <div class="htf"><div class="htf-head"><p class="dg-tag">Contexto</p><div id="htf-tf"></div></div><div id="htf"></div><p class="small muted" id="htf-t"></p></div>
        <div class="sim-stats" id="sim-stats"></div>
        <div class="live" id="live" aria-live="polite"></div>
      </div>
      <div class="sim-tfrow"><span class="dg-tag">Gráfico NQ</span><div id="sim-tf"></div><span class="small muted">Las órdenes se ejecutan al cierre del minuto actual en cualquier temporalidad.</span></div>
      <div class="dg-chart sim-chart" id="sim-chart"></div>
      <div class="sim-ctrl" id="sim-ctrl"></div>
      <div id="sim-order"></div>
      <div id="sim-result"></div>
      <details class="panel settings"><summary>Cuenta y ayudas</summary>
        <div class="form-grid">
          <label for="s-acct">Cuenta ($)<input id="s-acct" type="number" step="1000" min="5000" value="${SIM.acct}"></label>
          <label for="s-inst">Contrato<select id="s-inst">${Object.keys(INST).map((k) => `<option ${k === SIM.inst ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
          <label class="chk" for="s-assist"><input id="s-assist" type="checkbox" ${SIM.assist ? 'checked' : ''}> Resaltar FVG y niveles</label>
        </div></details>
    </section>`);
    m.appendChild(wrap);
    $('#s-acct').addEventListener('change', (e) => { SIM.acct = Math.max(5000, +e.target.value || 50000); simDraw(); });
    $('#s-inst').addEventListener('change', (e) => { SIM.inst = e.target.value; simDraw(); });
    $('#s-assist').addEventListener('change', (e) => { SIM.assist = e.target.checked; simDraw(); });
    requestAnimationFrame(() => {
      const drawHTF = (tf) => {
        SIM.htfTf = tf;
        CH.candles($('#htf'), E.agg(SIM.S.htf.C, tf / 60), { h: 120, axis: false, maxBw: tf === 60 ? 8 : 16 });
        $('#htf-t').textContent = `Estructura ${SIM.S.bias > 0 ? 'alcista (HH y HL)' : 'bajista (LH y LL)'} en ${tf / 60}H.`;
      };
      CH.tfBar($('#htf-tf'), [60, 240], SIM.htfTf || 60, drawHTF, 'Temporalidad del contexto');
      drawHTF(SIM.htfTf || 60);
      CH.tfBar($('#sim-tf'), [1, 2, 3, 5, 15], SIM.tf, (tf) => { SIM.tf = tf; simDraw(); }, 'Temporalidad del gráfico');
      simDraw();
    });
  }

  function simAnn() {
    const { S: Ss, t } = SIM, C = Ss.C, ann = [];
    const pm = C.slice(0, E.OPEN), PH = Math.max(...pm.map((b) => b.h)), PL = Math.min(...pm.map((b) => b.l));
    ann.push({ k: 'v', i: E.OPEN, c: 'mute', t: '9:30' }, { k: 'v', i: E.WIN_END, c: 'mute', t: '11:00' });
    if (SIM.assist && !SIM.done) {
      ann.push({ k: 'h', p: PH, i0: 0, i1: E.BARS, c: 'acc', t: 'Máx. pre-market', noScale: true }, { k: 'h', p: PL, i0: 0, i1: E.BARS, c: 'acc', t: 'Mín. pre-market', below: true, noScale: true });
      // FVG calculados en la temporalidad visible (solo velas cerradas); se guardan en minutos para el mapeo
      const tf = SIM.tf, A = E.agg(C, tf, t), closed = Math.floor((t + 1) / tf);
      const live = E.fvgs(A, closed).filter((f) => f.formed < closed && f.i >= closed - Math.ceil(40 / tf) && f.top - f.bot >= Ss.vol * 0.2 * Math.sqrt(tf));
      const invT = new Map(E.ifvgs(A, closed).map((x) => [x.fvg.i + ':' + x.fvg.dir, x.t]));
      // Solo zonas vigentes: FVG sin rellenar o IFVG reciente; como máximo las 4 últimas
      const shown = live.filter((f) => {
        const it = invT.get(f.i + ':' + f.dir);
        if (it != null) return it >= closed - Math.ceil(10 / tf);
        for (let m = f.formed + 1; m < closed; m++) if (f.dir > 0 ? A[m].l <= f.bot : A[m].h >= f.top) return false;
        return true;
      }).slice(-4);
      const inv = new Set(invT.keys());
      for (const f of shown) {
        const isInv = inv.has(f.i + ':' + f.dir);
        ann.push({ k: 'box', i0: (f.i - 1) * tf, i1: Math.min(t + 3 * tf, E.BARS), p0: f.bot, p1: f.top, c: isInv ? 'info' : f.dir > 0 ? 'bull' : 'bear', op: isInv ? 0.15 : 0.2, noScale: true });
      }
    }
    for (const tr of SIM.trades) ann.push({ k: 'trade', i0: tr.t, i1: tr.exitI != null ? tr.exitI + 1 : t + 2, entry: tr.entry, sl: tr.slNow ?? tr.sl, tp: tr.tp });
    if (SIM.order) {
      const o = SIM.order;
      ann.push({ k: 'h', p: o.entry, i0: t - 3, i1: t + 6, c: 'ink', t: 'Entrada', dash: false });
      if (o.sl != null) ann.push({ k: 'h', p: o.sl, i0: t - 3, i1: t + 6, c: 'bear', t: 'SL', below: o.dir > 0 });
      if (o.tp != null) ann.push({ k: 'h', p: o.tp, i0: t - 3, i1: t + 6, c: 'bull', t: 'TP', below: o.dir < 0 });
    }
    return ann;
  }
  function simDraw() {
    const host = $('#sim-chart'); if (!host) return;
    const { S: Ss, t } = SIM;
    const ann = SIM.done && SIM.result?.reveal ? [...simAnn(), ...SIM.result.reveal] : simAnn();
    const tf = SIM.tf, A = E.agg(Ss.C, tf, SIM.done ? Ss.C.length - 1 : t);
    const api = CH.candles(host, A, { tf, slots: Math.ceil(E.BARS / tf), ann: CH.mapAnn(ann, tf), times: true, h: 340, minBw: 6, cross: true, onPick: SIM.order ? orderPick : null, label: `NQ ${tf} minutos` });
    host.scrollLeft = Math.max(0, api.x(A.length - 1) - host.clientWidth + 120);
    simStats(); simCtrl(); simOrder();
  }
  function simStats() {
    const { S: Ss, t } = SIM, b = Ss.C[t];
    const op = SIM.trades.find((x) => x.exitI == null);
    let pnl = '';
    if (op) { const pts = (b.c - op.entry) * op.dir; pnl = `<div><span>Posición</span><b class="${pts >= 0 ? 'pos' : 'neg'}">${op.dir > 0 ? 'Long' : 'Short'} ${op.qty} ${SIM.inst} · ${pts >= 0 ? '+' : ''}${(pts / Math.abs(op.entry - op.sl)).toFixed(2)} R</b></div>`; }
    const inWin = t >= E.OPEN && t < E.WIN_END;
    simLive();
    $('#sim-stats').innerHTML = `<div><span>Hora</span><b class="mono">${E.hhmm(t)}</b></div><div><span>Precio</span><b class="mono">${fmt(b.c)}</b></div><div><span>Ventana</span><b class="${inWin ? 'pos' : ''}">${t < E.OPEN ? 'Pre-market' : inWin ? 'Abierta' : 'Cerrada'}</b></div><div><span>Trades</span><b>${SIM.trades.length}</b></div>${pnl}`;
  }
  // Checklist en vivo: qué pasos de la estrategia se cumplen en la vela actual
  function simLive() {
    const el = $('#live'); if (!el) return;
    if (!SIM.assist) { el.innerHTML = '<h2>Checklist</h2><p class="small muted">Ayudas desactivadas. Actívalas en “Cuenta y ayudas”.</p>'; return; }
    const { S: Ss, t } = SIM, C = Ss.C, px = C[t].c;
    const inWin = t >= E.OPEN && t < E.WIN_END;
    const sw = E.sweeps(C, t + 1).filter((x) => x.j >= Math.max(E.OPEN - 2, t - 15) && x.j <= t);
    const s = sw[sw.length - 1], dir = s ? s.dir : 0;
    const iv = dir ? E.ifvgs(C, t + 1).filter((x) => x.dir === dir && x.t >= t - 3 && x.t <= t) : [];
    let tgt = null, rr = 0;
    if (dir) {
      const seg = C.slice(s.j, t + 1);
      const stop = dir > 0 ? Math.min(...seg.map((b) => b.l)) - 1 : Math.max(...seg.map((b) => b.h)) + 1;
      const risk = Math.abs(px - stop);
      tgt = E.targets(C, t, dir).find((x) => Math.abs(x.p - px) >= risk);
      if (tgt) rr = Math.abs(tgt.p - px) / risk;
    }
    const side = dir > 0 ? 'compras' : 'ventas';
    const items = [
      [inWin ? 'ok' : 'no', 'Horario operativo', t < E.OPEN ? 'Abre a las 9:30' : inWin ? 'Ventana abierta' : 'Ventana cerrada'],
      [s ? 'ok' : inWin ? 'wait' : 'no', 'Toma de liquidez', s ? `${E.hhmm(s.j)} barrió un ${s.level.type === 'L' ? 'mínimo' : 'máximo'} → ${side}` : 'Esperando la manipulación'],
      [iv.length ? 'ok' : s ? 'wait' : 'no', 'IFVG', iv.length ? `Cierre de las ${E.hhmm(iv[iv.length - 1].t)}` : s ? 'Esperando el cierre que invalide un FVG' : 'Primero la toma de liquidez'],
      [tgt ? 'ok' : s ? 'wait' : 'no', 'Objetivo claro', tgt ? `${tgt.kind} · R:R 1:${rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })}` : s ? 'Sin objetivo con R:R ≥ 1 todavía' : '—'],
      [SIM.trades.length ? 'no' : 'ok', 'Un trade por sesión', `${SIM.trades.length} de 1 usados`],
    ];
    const n = items.filter((x) => x[0] === 'ok').length;
    el.innerHTML = `<h2>Checklist <span>${n}/${items.length}</span></h2><ul>${items.map(([st, l, d]) => `<li class="${st}"><i>${st === 'ok' ? '✓' : st === 'wait' ? '…' : ''}</i><span>${l}<small>${esc(d)}</small></span></li>`).join('')}</ul>`;
  }
  function simCtrl() {
    const c = $('#sim-ctrl'); if (!c) return;
    if (SIM.done) { c.innerHTML = `<div class="row"><button class="btn pri" id="sim-new" type="button">Nueva sesión</button></div>`; $('#sim-new').onclick = () => { newSim(); render(); }; return; }
    const op = SIM.trades.find((x) => x.exitI == null);
    const canTrade = !op && !SIM.order;
    c.innerHTML = `<div class="row">
      <button class="btn" id="sim-step" type="button" ${SIM.order ? 'disabled' : ''}>+1 min</button>
      <button class="btn" id="sim-auto" type="button" ${SIM.order ? 'disabled' : ''}>${autoT ? 'Pausa' : 'Reproducir'}</button>
      <button class="btn" id="sim-5" type="button" ${SIM.order ? 'disabled' : ''}>+1 vela de ${SIM.tf}m${SIM.tf === 1 ? ' ×5' : ''}</button>
      <span class="sp"></span>
      <button class="btn buy" id="sim-buy" type="button" ${canTrade ? '' : 'disabled'}>Comprar</button>
      <button class="btn sell" id="sim-sell" type="button" ${canTrade ? '' : 'disabled'}>Vender</button>
      ${op ? `<button class="btn" id="sim-be" type="button" ${op.slNow === op.entry ? 'disabled' : ''}>Stop a break even</button><button class="btn" id="sim-close" type="button">Cerrar a mercado</button>` : ''}
      <button class="btn ghost" id="sim-end" type="button">Terminar sesión</button></div>`;
    $('#sim-step').onclick = () => simStep(1);
    $('#sim-5').onclick = () => simStep(SIM.tf === 1 ? 5 : SIM.tf - (SIM.t + 1) % SIM.tf || SIM.tf);
    $('#sim-auto').onclick = () => { if (autoT) stopAuto(); else autoT = setInterval(() => simStep(1), 450); simCtrl(); };
    $('#sim-buy').onclick = () => openOrder(1);
    $('#sim-sell').onclick = () => openOrder(-1);
    $('#sim-end').onclick = () => simFinish();
    if (op) {
      $('#sim-be').onclick = () => { op.slNow = op.entry; op.be = true; simDraw(); };
      $('#sim-close').onclick = () => { closeTrade(op, SIM.S.C[SIM.t].c, SIM.t, 'Cierre manual'); simDraw(); };
    }
  }
  function simStep(k) {
    if (SIM.done) return stopAuto();
    for (let j = 0; j < k; j++) {
      if (SIM.t >= E.BARS - 1) { stopAuto(); return simFinish(); }
      SIM.t++;
      const b = SIM.S.C[SIM.t];
      for (const tr of SIM.trades) {
        if (tr.exitI != null) continue;
        const sl = tr.slNow ?? tr.sl;
        if (tr.dir > 0 ? b.l <= sl : b.h >= sl) closeTrade(tr, sl, SIM.t, sl === tr.entry ? 'Break even' : 'Stop loss');
        else if (tr.dir > 0 ? b.h >= tr.tp : b.l <= tr.tp) closeTrade(tr, tr.tp, SIM.t, 'Take profit');
      }
      if (SIM.trades.some((x) => x.exitI === SIM.t)) { stopAuto(); break; }
    }
    simDraw();
  }
  function closeTrade(tr, px, i, reason) { tr.exit = px; tr.exitI = i; tr.reason = reason; tr.R = (px - tr.entry) * tr.dir / Math.abs(tr.entry - tr.sl); }
  function openOrder(dir) {
    stopAuto();
    if (SIM.trades.length) SIM.warn = 'Tu plan dice un trade por sesión. Si entras otra vez, se descuenta en tu nota.';
    SIM.order = { dir, entry: SIM.S.C[SIM.t].c, sl: null, tp: null, risk: SIM.risk };
    simDraw();
  }
  function orderPick(q) {
    const o = SIM.order; if (!o) return;
    if (o.sl == null) o.sl = q.p; else if (o.tp == null) o.tp = q.p; else { const dSL = Math.abs(q.p - o.sl), dTP = Math.abs(q.p - o.tp); if (dSL < dTP) o.sl = q.p; else o.tp = q.p; }
    simDraw();
  }
  function orderCalc(o) {
    const pv = INST[SIM.inst];
    const stopPts = o.sl != null ? Math.abs(o.entry - o.sl) : 0;
    const riskUsd = SIM.acct * o.risk / 100;
    const qty = stopPts ? Math.floor(riskUsd / (stopPts * pv)) : 0;
    const realPct = qty * stopPts * pv / SIM.acct * 100;
    const rr = o.tp != null && stopPts ? (o.tp - o.entry) * o.dir / stopPts : null;
    let err = '';
    if (o.sl != null && (o.sl - o.entry) * o.dir >= 0) err = `El stop debe estar ${o.dir > 0 ? 'por debajo' : 'por encima'} de la entrada.`;
    else if (o.tp != null && (o.tp - o.entry) * o.dir <= 0) err = `El TP debe estar ${o.dir > 0 ? 'por encima' : 'por debajo'} de la entrada.`;
    else if (o.sl != null && qty < 1) err = `Con ${o.risk} % y ${stopPts} puntos de stop no alcanza para 1 contrato de ${SIM.inst}. Usa un micro (MNQ o MES).`;
    return { pv, stopPts, riskUsd, qty, realPct, rr, err };
  }
  function simOrder() {
    const host = $('#sim-order'); if (!host) return;
    if (!SIM.order) { host.innerHTML = SIM.warn && !SIM.done ? `<p class="warn">${SIM.warn}</p>` : ''; return; }
    const o = SIM.order, k = orderCalc(o);
    const step = o.sl == null ? `Toca el gráfico para fijar el <b>stop loss</b>.` : o.tp == null ? 'Ahora toca el gráfico para fijar el <b>take profit</b>.' : 'Ajusta con los campos o toca cerca de una línea para moverla.';
    host.innerHTML = `<form class="panel order ${o.dir > 0 ? 'is-buy' : 'is-sell'}" id="ord">
      <div class="order-head"><b>${o.dir > 0 ? 'Compra' : 'Venta'} a mercado · ${fmt(o.entry)}</b><span class="muted small">${step}</span></div>
      <div class="form-grid">
        <label for="o-sl">Stop loss<input id="o-sl" type="number" step="0.25" value="${o.sl ?? ''}"></label>
        <label for="o-tp">Take profit<input id="o-tp" type="number" step="0.25" value="${o.tp ?? ''}"></label>
        <label for="o-risk">Riesgo %<input id="o-risk" type="number" step="0.05" min="0.05" max="5" value="${o.risk}"></label>
      </div>
      <div class="order-sum mono">
        <span>Stop: <b>${k.stopPts ? k.stopPts.toFixed(2) + ' pts' : '—'}</b></span>
        <span>R:R: <b>${k.rr != null ? '1:' + k.rr.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '—'}</b></span>
        <span>Contratos: <b>${k.qty || '—'} ${SIM.inst}</b></span>
        <span>Riesgo real: <b>${k.qty ? (k.qty * k.stopPts * k.pv).toLocaleString('es-ES') + ' $ · ' + k.realPct.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' %' : '—'}</b></span>
      </div>
      ${k.err ? `<p class="bad-msg">${k.err}</p>` : ''}
      <div class="row"><button class="btn pri" type="submit" ${!k.err && o.sl != null && o.tp != null ? '' : 'disabled'}>Confirmar orden</button><button class="btn ghost" type="button" id="o-cancel">Cancelar</button></div>
    </form>`;
    const upd = () => { o.sl = $('#o-sl').value === '' ? null : E.rt(+$('#o-sl').value); o.tp = $('#o-tp').value === '' ? null : E.rt(+$('#o-tp').value); o.risk = Math.max(0.05, +$('#o-risk').value || 0.5); SIM.risk = o.risk; simDraw(); };
    ['#o-sl', '#o-tp', '#o-risk'].forEach((q) => $(q).addEventListener('change', upd));
    $('#o-cancel').onclick = () => { SIM.order = null; simDraw(); };
    $('#ord').addEventListener('submit', (e) => {
      e.preventDefault();
      const kk = orderCalc(o); if (kk.err || o.sl == null || o.tp == null) return;
      SIM.trades.push({ t: SIM.t, dir: o.dir, entry: o.entry, sl: o.sl, tp: o.tp, qty: kk.qty, riskPct: kk.realPct, usdPerR: kk.qty * kk.stopPts * kk.pv });
      SIM.order = null; simDraw();
    });
  }
  function simFinish() {
    stopAuto();
    if (SIM.done) return;
    const C = SIM.S.C;
    for (const tr of SIM.trades) if (tr.exitI == null) {
      // la operación sigue su curso hasta SL/TP (el resto de la sesión ya está generado)
      const r = E.runTrade(C, { t: SIM.t, dir: tr.dir, entry: tr.entry, sl: tr.slNow ?? tr.sl, tp: tr.tp });
      closeTrade(tr, r.exit, r.i, r.reason);
    }
    SIM.done = true;
    const sys = E.firstSetup(C);
    let grade, outcome = 0;
    if (SIM.trades.length) {
      grade = E.gradeTrade(C, SIM.trades[0], { vol: SIM.S.vol, tradeCount: SIM.trades.length });
      outcome = SIM.trades.reduce((a, b) => a + b.R, 0);
    } else if (sys) {
      grade = { score: 40, items: [{ label: 'Sesión sin operar', pts: 40, max: 100, ok: false, msg: `Había un setup válido a las ${E.hhmm(sys.t)} (Modelo ${sys.model}, ${sys.dir > 0 ? 'compra' : 'venta'}, R:R 1:${sys.rr.toFixed(1)}). Ver la repetición en el gráfico.` }] };
    } else {
      grade = { score: 100, items: [{ label: 'Sesión sin operar', pts: 100, max: 100, ok: true, msg: 'Correcto: no hubo toma de liquidez + IFVG + objetivo claro dentro de la ventana. No operar también es cumplir el plan.' }] };
    }
    let reveal = [];
    if (sys) {
      const sa = CH.setupAnn(C, sys, { open: false });
      reveal = sa.ann.map((x) => (x.k === 'mark' && x.t === 'IFVG → entrada' ? { ...x, t: `Sistema: Modelo ${sys.model}` } : x)).filter((x) => x.k !== 'trade' || !SIM.trades.length);
    }
    SIM.result = { grade, outcome, sys, reveal };
    const rec = { at: Date.now(), seed: SIM.seed, score: grade.score, R: +outcome.toFixed(2), trades: SIM.trades.map((x) => ({ dir: x.dir, t: x.t, R: +x.R.toFixed(2), reason: x.reason, riskPct: +x.riskPct.toFixed(2) })), model: sys?.model ?? null, sysT: sys?.t ?? null, note: '' };
    S.sims.push(rec); addXP(grade.score / 5); save();
    SIM.recIdx = S.sims.length - 1;
    simDraw();
    simResult();
  }
  function simResult() {
    const host = $('#sim-result'); if (!host || !SIM.result) return;
    const { grade, outcome, sys } = SIM.result;
    const tier = grade.score >= 85 ? ['Excelente', 'good'] : grade.score >= 70 ? ['Bien', 'good'] : grade.score >= 50 ? ['Mejorable', 'mid'] : ['Fuera del plan', 'bad'];
    const tr = SIM.trades[0];
    host.innerHTML = `<section class="panel result">
      <div class="res-head"><div class="score ${tier[1]}"><b>${grade.score}</b><span>/100 disciplina</span></div>
        <div><h2>${tier[0]}</h2><p>${tr ? `${tr.dir > 0 ? 'Long' : 'Short'} a las ${E.hhmm(tr.t)} · ${tr.reason} · <b class="${outcome >= 0 ? 'pos' : 'neg'}">${outcome >= 0 ? '+' : ''}${outcome.toFixed(2)} R</b> (${(outcome * tr.usdPerR).toLocaleString('es-ES', { maximumFractionDigits: 0 })} $)` : 'Sin operaciones'}</p>
        <p class="muted small">La nota mide si seguiste el plan, no si ganaste. ${sys ? `El sistema detectó el primer setup a las ${E.hhmm(sys.t)} (Modelo ${sys.model}).` : 'El sistema no detectó setups válidos en la ventana.'}</p></div></div>
      <ul class="grade">${grade.items.map((it) => `<li class="${it.ok ? 'ok' : it.pts > 0 ? 'mid' : 'no'}"><div><b>${it.label}</b><p>${esc(it.msg)}</p></div><span class="mono">${it.pts}/${it.max}</span></li>`).join('')}</ul>
      <label for="sim-note" class="note-l">Nota para tu diario (emociones, qué mejorar)</label>
      <textarea id="sim-note" rows="2" placeholder="Ej.: entré antes del cierre de la vela por ansiedad"></textarea>
      <div class="row"><button class="btn" id="note-save" type="button">Guardar nota</button><span class="muted small" id="note-ok"></span></div>
    </section>`;
    $('#note-save').onclick = () => { S.sims[SIM.recIdx].note = $('#sim-note').value.trim(); save(); $('#note-ok').textContent = 'Nota guardada en el diario.'; };
  }

  // ---------- Diario ----------
  function vJournal(m) {
    m.appendChild(H(`<header class="page-head"><p class="eyebrow">Diario</p><h1>Tu journal</h1><p class="lead">Cada sesión del simulador queda registrada con su nota de disciplina y su resultado en R.</p></header>`));
    if (!S.sims.length) {
      m.appendChild(H('<section class="panel empty"><h2>Todavía no hay sesiones</h2><p>Opera tu primera sesión en el simulador. Se guardará aquí con tu nota de disciplina, el resultado en R y tus comentarios.</p><a class="btn pri" href="#simulador">Ir al simulador</a></section>'));
    } else {
      const tr = S.sims.filter((x) => x.trades.length);
      const wins = tr.filter((x) => x.R > 0).length;
      const totR = S.sims.reduce((a, b) => a + b.R, 0);
      m.appendChild(H(`<section class="tiles">
        <div class="tile"><span>Sesiones</span><b>${S.sims.length}</b><small class="sub">${S.sims.length - tr.length} sin operar</small></div>
        <div class="tile"><span>Acierto</span><b>${tr.length ? Math.round(wins / tr.length * 100) : 0}<small>%</small></b><small class="sub">${wins} de ${tr.length} trades</small></div>
        <div class="tile"><span>Resultado</span><b class="${totR >= 0 ? 'pos' : 'neg'}">${totR >= 0 ? '+' : ''}${totR.toFixed(1)}<small> R</small></b></div>
        <div class="tile"><span>Disciplina media</span><b>${Math.round(simAvg(S.sims.length))}<small>/100</small></b></div></section>`));
      const ch = H('<section class="panel"><h2>Curva en R y disciplina</h2><div id="j-curve"></div></section>');
      m.appendChild(ch);
      requestAnimationFrame(() => {
        let e = 0; const v = [0, ...S.sims.map((x) => (e += x.R))];
        const d = [S.sims[0].score / 10, ...S.sims.map((x, i, a) => a.slice(Math.max(0, i - 4), i + 1).reduce((q, w) => q + w.score, 0) / Math.min(5, i + 1) / 10)];
        CH.lines($('#j-curve'), [{ v, c: 'info', label: `${e.toFixed(1)} R`, area: true }, { v: d, c: 'acc', dash: true, label: 'Disciplina ÷10 (media móvil)' }], { h: 220, refs: [{ v: 0, c: 'mute' }], xlabel: 'Sesiones' });
      });
      const rows = S.sims.map((x, i) => ({ x, i })).reverse();
      m.appendChild(H(`<section class="panel"><h2>Sesiones</h2><div class="scroll-x"><table class="tbl jt"><thead><tr><th>#</th><th>Fecha</th><th>Operación</th><th class="r">Resultado</th><th class="r">Disciplina</th><th>Nota</th></tr></thead><tbody>
        ${rows.map(({ x, i }) => `<tr><td class="mono">${i + 1}</td><td>${new Date(x.at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td><td>${x.trades.length ? x.trades.map((t) => `${t.dir > 0 ? 'Long' : 'Short'} ${E.hhmm(t.t)} · ${t.reason}`).join('<br>') : 'Sin operar'}</td><td class="r mono ${x.R > 0 ? 'pos' : x.R < 0 ? 'neg' : ''}">${x.R > 0 ? '+' : ''}${x.R.toFixed(2)} R</td><td class="r"><span class="pill ${x.score >= 85 ? 'ok' : x.score >= 50 ? 'mid' : 'no'}">${x.score}</span></td><td class="note">${esc(x.note || '')}</td></tr>`).join('')}
      </tbody></table></div></section>`));
    }
    const io = H(`<details class="panel"><summary>Copia de seguridad del progreso</summary><p class="muted small">Tu progreso se guarda en este navegador. Copia este texto para llevarlo a otro dispositivo y pégalo allí.</p>
      <textarea id="bk" rows="3" class="mono small"></textarea><div class="row"><button class="btn" id="bk-copy" type="button">Copiar</button><button class="btn" id="bk-load" type="button">Cargar texto pegado</button><span class="small muted" id="bk-msg"></span></div></details>`);
    m.appendChild(io);
    $('#bk').value = JSON.stringify(S);
    $('#bk-copy').onclick = async () => { try { await navigator.clipboard.writeText($('#bk').value); $('#bk-msg').textContent = 'Copiado.'; } catch (e) { $('#bk').select(); $('#bk-msg').textContent = 'Selecciónalo y cópialo manualmente.'; } };
    $('#bk-load').onclick = () => { try { const v = JSON.parse($('#bk').value); if (!v || typeof v !== 'object' || !('lessons' in v)) throw 0; S = Object.assign(blank(), v); save(); $('#bk-msg').textContent = 'Progreso cargado.'; } catch (e) { $('#bk-msg').textContent = 'El texto no es una copia válida del progreso.'; } };
  }

  // ---------- Arranque ----------
  let rz, lastW = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(() => { if (view === 'simulador') simDraw(); else if (view !== 'practica') render(); }, 250); });
  go(location.hash.slice(1));
})();
