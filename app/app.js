// Aplicación: navegación, progreso, lecciones, prácticas, simulador y diario.
(function () {
  const E = window.ENG, CH = window.CH, DG = window.DG;
  const $ = (q, r = document) => r.querySelector(q);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = E.fmt;
  const PLAYLIST = 'https://www.youtube.com/playlist?list=PL4hId-DTkHg50047_yeFJOvPK1rOCrSoR';

  // ---------- Estado y guardado ----------
  const KEY = 'lab-ifvg-v1';
  const blank = () => ({ lessons: {}, xp: 0, ex: {}, sims: [], exam: null, last: 1, act: {}, rev: {}, checkin: {}, real: [], realIdx: 0, simcfg: { sess: 'ny', mkt: 'NQ', real: false }, lastBackup: 0 });
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ }
  if (S.onb == null) S.onb = S.xp > 0; // quien ya tenía progreso no ve la bienvenida
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ } renderHeader(); };
  const addXP = (n) => { S.xp += Math.round(n); };
  // Actividad por día (lección, práctica, sesión, repaso) para el plan de Hoy y la racha
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const mark = (k) => { const d = today(); S.act[d] = { ...(S.act[d] || {}), [k]: true }; };
  const doneToday = (k) => !!(S.act[today()] || {})[k];
  function streak() {
    let n = 0; const d = new Date();
    if (!S.act[today(d)]) d.setDate(d.getDate() - 1); // hoy todavía cuenta si aún no hiciste nada
    while (S.act[today(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // Repaso espaciado: cada día aprobado vuelve a preguntarse a los 1, 2, 4, 8… días
  const DAY = 864e5;
  const schedule = (d, ok) => { const r = S.rev[d] || { iv: 1 }; const iv = ok ? Math.min(30, (r.iv || 1) * 2) : 1; S.rev[d] = { iv, due: Date.now() + iv * DAY }; };
  const dueReviews = () => Object.entries(S.rev).filter(([, r]) => r.due <= Date.now()).map(([d]) => +d);

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
  const VIEWS = ['inicio', 'ruta', 'estrategia', 'glosario', 'practica', 'simulador', 'diario', 'bienvenida'];
  // Cada vista pertenece a una de las 4 pestañas: Hoy, Aprender, Practicar, Progreso
  const TAB = { inicio: 'inicio', ruta: 'ruta', estrategia: 'ruta', glosario: 'ruta', practica: 'practica', simulador: 'practica', diario: 'diario', bienvenida: '' };
  let view = 'inicio', lessonDay = null;
  // Posición de scroll por pantalla: al volver de una lección a la ruta, sigues donde estabas
  const scrollMem = {};
  let curKey = null, booted = false, swapT = null;
  const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  function moveInd(instant) {
    const nav = $('.nav'), ind = $('.nav-ind'), a = nav && nav.querySelector('a[aria-current="page"]');
    if (!ind) return;
    if (!a) { ind.style.width = '0px'; return; }
    nav.classList.toggle('instant', !!instant);
    ind.style.width = a.offsetWidth + 'px'; ind.style.height = a.offsetHeight + 'px';
    ind.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
    if (instant) requestAnimationFrame(() => nav.classList.remove('instant'));
  }
  function go(hash) {
    const m = /^dia(\d+)$/.exec(hash);
    if (m) { view = 'ruta'; lessonDay = Math.min(50, Math.max(1, +m[1])); }
    else { view = VIEWS.includes(hash) ? hash : 'inicio'; lessonDay = null; }
    if (!S.onb && !m) view = 'bienvenida';
    if (view !== 'bienvenida') document.body.classList.remove('onb');
    document.querySelectorAll('.nav a').forEach((a) => a.setAttribute('aria-current', a.dataset.v === TAB[view] ? 'page' : 'false'));
    E.setSession(view === 'simulador' && SIM ? SIM.S.sess : 'ny');
    moveInd(!booted);
    stopAuto();
    if (curKey) scrollMem[curKey] = window.scrollY;
    const key = lessonDay ? 'dia' + lessonDay : view;
    const back = key === 'ruta' && curKey && curKey.startsWith('dia');
    curKey = key;
    const swap = () => { render(); window.scrollTo({ top: back ? scrollMem.ruta || 0 : 0 }); $('#main').classList.remove('out'); };
    clearTimeout(swapT);
    if (!booted || reduceMotion()) { booted = true; swap(); return; }
    // salida breve antes de dibujar la pantalla nueva
    $('#main').classList.add('out');
    swapT = setTimeout(swap, 140);
  }
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  // Tocar la pestaña de la sección actual vuelve a su inicio (p. ej. salir de un ejercicio o de una lección)
  document.querySelector('.nav').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-v]'); if (!a || a.dataset.v !== TAB[view]) return;
    e.preventDefault();
    if (view === 'practica') EX = null;
    if (lessonDay || view !== a.dataset.v) { location.hash = a.dataset.v; return; }
    if (location.hash.slice(1) !== view) { location.hash = view; return; }
    if (window.scrollY > 10) window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); else go(view);
  });

  function renderHeader() {
    const { cur } = currentLevel();
    $('#hdr-level').textContent = `Nivel ${cur.n} · ${cur.name}`;
    $('#hdr-xp').textContent = `${S.xp} XP`;
    const st = streak(); $('#hdr-streak').textContent = st ? `Racha ${st} ${st === 1 ? 'día' : 'días'}` : 'Racha 0'; $('#hdr-streak').classList.toggle('on', st > 0);
  }

  function render() {
    const main = $('#main');
    main.innerHTML = '';
    const wasSim = document.body.classList.contains('in-sim');
    document.body.classList.toggle('in-sim', view === 'simulador');
    if (view !== 'simulador') document.body.classList.remove('sx-live');
    if (wasSim && view !== 'simulador') moveInd(true); // la barra estaba oculta: recolocar el indicador
    ({ bienvenida: vWelcome, inicio: vHome, ruta: lessonDay ? vLesson : vPath, estrategia: vStrategy, glosario: vGlossary, practica: vPractice, simulador: vSim, diario: vJournal })[view](main);
    renderHeader();
  }
  const H = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // ---------- Bienvenida (primera visita) ----------
  const SLIDES = [
    { t: 'Aprende a operar con una sola estrategia', d: '50 días del bootcamp, práctica guiada y un simulador que evalúa tu disciplina.', v: 'chart' },
    { t: 'Tres pasos, siempre los mismos', d: 'Toma de liquidez, IFVG y objetivo claro. Si falta uno, no hay trade.', v: 'steps' },
    { t: 'Tu nota mide el proceso, no la suerte', d: 'Cada sesión simulada recibe una nota de disciplina sobre 100 según tu plan de trading.', v: 'score' },
  ];
  let slide = 0;
  function vWelcome(m) {
    document.body.classList.add('onb');
    const sl = SLIDES[slide], last = slide === SLIDES.length - 1;
    const el = H(`<section class="welcome">
      <div class="w-top"><span class="w-brand"><svg viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="lgw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#45d0c0"/><stop offset=".35" stop-color="#4fd8c8"/><stop offset=".7" stop-color="#8db3ff"/><stop offset="1" stop-color="#5fc6e0"/></linearGradient></defs><rect width="512" height="512" rx="130" fill="url(#lgw)"/><rect x="104" y="236" width="304" height="52" rx="14" fill="#06121c" opacity=".14"/><line x1="182" y1="118" x2="182" y2="392" stroke="#06121c" stroke-width="22" stroke-linecap="round"/><rect x="146" y="150" width="72" height="196" rx="20" fill="url(#lgw)" stroke="#06121c" stroke-width="22"/><line x1="330" y1="92" x2="330" y2="368" stroke="#06121c" stroke-width="22" stroke-linecap="round"/><rect x="294" y="118" width="72" height="210" rx="20" fill="#06121c"/></svg>Laboratorio IFVG</span><button class="link" type="button" id="w-skip">Saltar ›</button></div>
      <div class="w-vis" id="w-vis"></div>
      <div class="w-txt"><h1>${sl.t}</h1><p class="lead">${sl.d}</p>
        <div class="dots" aria-label="Paso ${slide + 1} de ${SLIDES.length}">${SLIDES.map((_, i) => `<span class="${i === slide ? 'on' : ''}"></span>`).join('')}</div>
        <button class="btn pri wide" type="button" id="w-next">${last ? 'Empezar' : 'Continuar'}</button></div>
    </section>`);
    m.appendChild(el);
    const vis = $('#w-vis');
    if (sl.v === 'chart') { const c = H('<div class="float-card"><div class="fc-head"><span>NQ · 1 minuto</span><span class="tag">Modelo 1</span></div><div id="w-chart"></div><div class="fc-msg">El precio barrió el mínimo e invalidó el FVG</div></div>'); vis.appendChild(c); vis.appendChild(H('<span class="float-tag">✓ Toma de liquidez + IFVG</span>')); requestAnimationFrame(() => { if (!$('#w-chart')) return; const F = CH.findSession('model1', 'm1', (S2, f) => f && f.model === 1); const { ann } = CH.setupAnn(F.S.C, F.f); CH.candlesA($('#w-chart'), F.S.C.slice(22, F.f.t + 12), { ann: ann.filter((a) => a.k === 'box' || a.k === 'h').map((a) => { const y = { ...a }; for (const k of ['i', 'i0', 'i1']) if (y[k] != null) y[k] -= 22; y.t = ''; return y; }), h: 170, axis: false }); }); }
    if (sl.v === 'steps') vis.appendChild(H('<div class="w-steps"><div><i>1</i><b>Toma de liquidez</b><span>Barre un máximo o mínimo</span></div><div><i>2</i><b>IFVG</b><span>Un cierre invalida el FVG</span></div><div><i>3</i><b>Objetivo claro</b><span>Liquidez sin tomar, R:R ≥ 1</span></div></div>'));
    if (sl.v === 'score') vis.appendChild(H('<div class="w-score"><div class="ring"><b>92</b><span>de 100</span></div><ul><li>✓ Horario</li><li>✓ Toma de liquidez</li><li>✓ IFVG</li><li class="warn-i">! Stop lejos</li></ul></div>'));
    const finish = () => { S.onb = true; save(); document.body.classList.remove('onb'); if (location.hash === '#inicio') go('inicio'); else location.hash = 'inicio'; };
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

  // ---------- Hoy ----------
  const nextLessonDay = () => { for (let d = 1; d <= 50; d++) if (!S.lessons[d]?.passed) return d; return 50; };
  // Ejercicio recomendado: el de peor resultado reciente (o uno sin hacer)
  function recommendedEx() {
    const score = (id) => { const h = S.ex[id]?.hist || []; return h.length ? h.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, h.length) : -1; };
    return [...ALL_EX].sort((a, b) => score(a) - score(b))[0];
  }
  const CHECKQ = ['¿Dormiste bien y estás descansado?', '¿Estás tranquilo, sin enojo ni euforia?', '¿Revisaste el calendario de noticias de hoy?'];
  function vHome(m) {
    const { cur, next } = currentLevel();
    const nd = nextLessonDay(), NL = window.LESSONS.find((l) => l.d === nd);
    const rx = recommendedEx(), RX = EXS.find((x) => x.id === rx);
    const pct = next ? Math.round(next.reqs.reduce((a, [, v, g]) => a + Math.min(1, v / g), 0) / next.reqs.length * 100) : 100;
    const pend = next ? next.reqs.find(([, v, g]) => v < g) : null;
    const ny = nyStatus(), due = dueReviews();
    const plan = [
      { k: 'lesson', n: 1, small: 'Lección', title: `Día ${nd} · ${NL.t}`, href: `#dia${nd}`, cta: 'Abrir la lección' },
      { k: 'ex', n: 2, small: 'Práctica recomendada', title: RX.t, why: S.ex[rx] ? `Tu punto más débil ahora (${Math.round((S.ex[rx].hist || []).slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, (S.ex[rx].hist || [1]).length))} % reciente)` : 'Todavía no lo practicaste', ex: rx, cta: 'Hacer una ronda' },
      { k: 'sim', n: 3, small: 'Sesión simulada', title: S.simcfg.sess === 'asia' ? 'Sesión Asia 20:00–21:30' : 'Sesión NY AM 9:30–11:00', href: '#simulador', cta: SIM && !SIM.done ? 'Continuar la sesión' : 'Empezar la sesión' },
    ];
    const doneN = plan.filter((x) => doneToday(x.k)).length;
    m.appendChild(H(`<section class="g-hero">
      <div class="g-row"><span class="pill-dark ${ny.open ? 'live' : ''}"><i></i>${ny.text}</span></div>
      <h1>Hola de nuevo,<br><b>${doneN === 3 ? 'plan de hoy completo' : `te quedan ${3 - doneN} de 3 pasos`}</b></h1>
      <div class="lvl-card">
        <div class="lvl-top"><span><small>Tu nivel</small><b>${cur.n} · ${cur.name}</b></span><span class="xp">${S.xp.toLocaleString('es-ES')} <small>XP</small></span></div>
        <i class="gbar"><i style="width:${pct}%"></i></i>
        <small>${next ? `Para ${next.name}: ${pend ? pend[0].toLowerCase() : 'casi listo'}` : 'Nivel máximo alcanzado'}</small>
      </div>
    </section>`));
    const pl = H(`<section class="card"><div class="card-head"><h2>Plan de hoy</h2><span class="pill ${doneN === 3 ? 'ok' : ''}">${doneN} de 3</span></div><div class="plan-list">${plan.map((x) => `
      <${x.href ? `a href="${x.href}"` : `button type="button" data-ex="${x.ex}"`} class="plan-item ${doneToday(x.k) ? 'done' : ''}">
        <span class="pn">${doneToday(x.k) ? '✓' : x.n}</span>
        <span class="pt"><small>${x.small}</small><b>${esc(x.title)}</b>${x.why ? `<em>${esc(x.why)}</em>` : ''}</span>
        <span class="pc">${doneToday(x.k) ? 'Hecho' : x.cta} ›</span>
      </${x.href ? 'a' : 'button'}>`).join('')}</div></section>`);
    m.appendChild(pl);
    pl.querySelector('[data-ex]').onclick = (e) => { EX = { active: true, id: e.currentTarget.dataset.ex, k: 0, ok: 0, round: null }; location.hash = 'practica'; };
    // Antes de operar: estado emocional
    const ci = S.checkin[today()];
    const ckCard = H(`<section class="card" id="checkin"><div class="card-head"><h2>Antes de operar</h2><span class="muted small">30 segundos</span></div><div id="ck-body"></div></section>`);
    m.appendChild(ckCard);
    const drawCheck = () => {
      const c = S.checkin[today()];
      const body = $('#ck-body');
      if (c && c.a.every((x) => x != null)) {
        const bad = c.a.filter((x) => !x).length;
        body.innerHTML = bad ? `<p class="warn-box"><b>Hoy mejor solo simulado.</b> El plan dice que no se opera con dinero real si no estás descansado, tranquilo e informado. Practica en el simulador y cuida la cabeza.</p>`
          : '<p class="ok-box"><b>Listo para la sesión.</b> Sigue el checklist y recuerda: un trade, 0,5–0,7 % de riesgo.</p>';
        body.appendChild(H('<button class="link small" type="button" id="ck-redo">Responder de nuevo</button>'));
        $('#ck-redo').onclick = () => { delete S.checkin[today()]; save(); drawCheck(); };
        return;
      }
      const a = c?.a || [null, null, null];
      body.innerHTML = CHECKQ.map((q, i) => `<div class="ck-q"><span>${q}</span><div class="yn"><button type="button" data-i="${i}" data-v="1" class="${a[i] === true ? 'on' : ''}">Sí</button><button type="button" data-i="${i}" data-v="0" class="${a[i] === false ? 'on no' : ''}">No</button></div></div>`).join('');
      body.querySelectorAll('.yn button').forEach((b) => b.onclick = () => { a[+b.dataset.i] = b.dataset.v === '1'; S.checkin[today()] = { a }; save(); drawCheck(); });
    };
    drawCheck();
    // Repaso de 2 minutos (repaso espaciado de días ya aprobados)
    if (due.length) {
      const pick = due.sort(() => Math.random() - 0.5).slice(0, 3);
      const Q = pick.map((d) => { const L = window.LESSONS.find((l) => l.d === d); const q = L.q[Math.floor(Math.random() * L.q.length)]; return { ...q, q: `Día ${d} · ${q.q}` }; });
      const rv = H(`<section class="card"><div class="card-head"><h2>Repaso de 2 minutos</h2><span class="pill mid">${due.length} pendiente${due.length > 1 ? 's' : ''}</span></div><p class="muted small">Preguntas de días que ya aprobaste. Repasar justo antes de olvidar fija lo aprendido.</p><div id="rev"></div></section>`);
      m.appendChild(rv);
      quiz($('#rev'), Q, (ok, total) => {
        $('#rev').querySelectorAll('fieldset').forEach((fs, i) => schedule(pick[i], fs.classList.contains('good')));
        mark('review'); addXP(ok * 3); save();
        return `<p class="${ok === total ? 'ok-msg' : 'bad-msg'}">${ok}/${total}. ${ok === total ? 'Volverán a aparecer más adelante.' : 'Las falladas vuelven mañana.'}</p>`;
      });
    }
    // Recordatorio de copia de seguridad
    const hasData = S.xp > 0 || S.sims.length;
    if (hasData && Date.now() - (S.lastBackup || 0) > 7 * DAY) {
      m.appendChild(H(`<section class="card backup-nag"><div><b>Guarda una copia de tu progreso</b><p class="muted small">Se guarda solo en este teléfono. Si se borran los datos del navegador, se pierde.</p></div><a class="btn" href="#diario">Hacer copia</a></section>`));
    }
    m.appendChild(H(`<p class="disclaimer">Material educativo no oficial, elaborado a partir de los títulos y de la explicación de la estrategia del bootcamp. Los gráficos de práctica se generan por simulación salvo que importes datos reales. Operar futuros con apalancamiento implica riesgo de pérdida. Videos originales en <a href="${PLAYLIST}" target="_blank" rel="noopener">YouTube</a>.</p>`));
  }

  // ---------- Aprender ----------
  function vPath(m) {
    const nd = nextLessonDay(), NL = window.LESSONS.find((l) => l.d === nd);
    m.appendChild(H(`<header class="page-head"><h1>Aprender</h1><p class="lead">La ruta de 50 días, la ficha de la estrategia y el glosario.</p></header>`));
    m.appendChild(H(`<a class="g-card" href="#dia${nd}"><small>Continuar · Día ${nd}</small><b>${esc(NL.t)}</b><i>›</i></a>`));
    m.appendChild(H(`<section class="quick2"><a class="act" href="#estrategia"><i>★</i><span><small>Consulta rápida</small><b>Ficha de la estrategia</b><em>Modelos, plan y examen</em></span></a><a class="act lav" href="#glosario"><i>?</i><span><small>${window.GLOSSARY.length} términos</small><b>Glosario</b><em>FVG, IFVG, PDH…</em></span></a></section>`));
    for (const p of window.PHASES) {
      const ls = window.LESSONS.filter((l) => l.d >= p.days[0] && l.d <= p.days[1]);
      const k = daysDone(p.days[0], p.days[1]), pc = Math.round(k / ls.length * 100);
      const stt = pc === 100 ? ['Completa', 'pos'] : pc ? ['En curso', 'acc-t'] : ['Pendiente', 'muted'];
      m.appendChild(H(`<section class="card phase"><div class="card-head line"><h2>${p.name}</h2><span class="muted small">Fase ${p.id}</span></div>
        <p class="muted small">${p.goal}</p>
        <i class="gbar big"><i style="width:${pc}%"></i></i>
        <div class="stats3"><span><small>Días</small>${p.days[0]}–${p.days[1]}</span><span><small>Completados</small>${k} de ${ls.length}</span><span><small>Estado</small><b class="${stt[1]}">${stt[0]}</b></span></div>
        <div class="days">${ls.map((l) => `<a class="day ${S.lessons[l.d]?.passed ? 'done' : ''} ${l.d === nd ? 'now' : ''}" href="#dia${l.d}"><span class="dn">${l.d}</span><span class="dt">${esc(l.t)}</span></a>`).join('')}</div></section>`));
    }
  }

  function vGlossary(m) {
    m.appendChild(H(`<header class="page-head"><nav class="crumbs"><a href="#ruta">Aprender</a> / Glosario</nav><h1>Glosario</h1><p class="lead">Los términos de la estrategia en una frase, con el día donde se explican.</p></header>`));
    const box = H(`<section class="card"><label for="g-q" class="sr">Buscar término</label><input id="g-q" class="search" type="search" placeholder="Buscar: FVG, stop, liquidez…" autocomplete="off"><div id="g-list" class="glist"></div></section>`);
    m.appendChild(box);
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const draw = () => {
      const q = norm($('#g-q').value.trim());
      const items = window.GLOSSARY.filter((g) => !q || norm(g.t + ' ' + g.d).includes(q));
      $('#g-list').innerHTML = items.length ? items.map((g) => `<div class="gitem"><b>${esc(g.t)}</b><p>${esc(g.d)}</p><a href="#dia${g.day}">Ver día ${g.day} ›</a></div>`).join('') : '<p class="muted">No hay términos con esa búsqueda.</p>';
    };
    $('#g-q').addEventListener('input', draw); draw();
  }

  // Dibuja un diagrama cuando su contenedor se acerca a la pantalla (ahorra trabajo en teléfonos)
  let io = null;
  function lazyDG(el, key) {
    const f = DG[key]; if (!f) return;
    const run = () => { if (el.dataset.done) return; el.dataset.done = '1'; f(el); };
    if (!('IntersectionObserver' in window)) return requestAnimationFrame(run);
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); e.target._run(); } }), { rootMargin: '400px 0px' });
    el._run = run; io.observe(el);
  }

  function vLesson(m) {
    const L = window.LESSONS.find((l) => l.d === lessonDay);
    const P = window.PHASES.find((p) => L.d >= p.days[0] && L.d <= p.days[1]);
    const T = (window.THEORY || {})[L.d] || { secs: [], err: [], ej: '' };
    if (S.last !== L.d) { S.last = L.d; save(); }
    const st = S.lessons[L.d] || {};
    const words = (L.sum + T.secs.map((x) => x.p).join(' ') + (T.ej || '')).split(/\s+/).length;
    const mins = Math.max(2, Math.round(words / 180));
    const usedInSecs = new Set(T.secs.map((x) => x.dg).filter(Boolean));
    const el = H(`<article class="lesson">
      <nav class="crumbs"><a href="#ruta">Ruta</a> / Fase ${P.id} · ${P.name}</nav>
      <i class="gbar lesson-bar" aria-label="Día ${L.d} de 50"><i style="width:${L.d * 2}%"></i></i>
      <header class="page-head"><p class="eyebrow">Día ${L.d} de 50 · ${mins} min de lectura${st.passed ? ' · completado' : ''}</p><h1>${esc(L.t)}</h1><p class="lead">${esc(L.sum)}</p></header>
      ${usedInSecs.has(L.dg) ? '' : '<div class="dg" id="dg"></div>'}
      ${T.secs.map((x, i) => `<section class="card th"><h2><span class="th-n">${i + 1}</span>${esc(x.h)}</h2><p>${esc(x.p)}</p>${x.dg ? `<div class="dg" data-dg="${x.dg}"></div>` : ''}</section>`).join('')}
      <section class="card"><h2>Ideas clave</h2><ul class="keys">${L.pts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      ${T.err.length ? `<section class="card"><h2>Errores comunes</h2><ul class="x">${T.err.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${T.ej ? `<section class="card example"><h2>Ejemplo</h2><p>${esc(T.ej)}</p></section>` : ''}
      <p class="muted small">Video original: “${esc(L.t)} | Día ${L.d}”. <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(L.t + ' bootcamp día ' + L.d)}" target="_blank" rel="noopener">Buscarlo en YouTube</a> · <a href="${PLAYLIST}" target="_blank" rel="noopener">Lista completa</a></p>
      <section class="card quiz" id="quiz"><h2>Control del día</h2>${st.passed ? '<p class="pill ok">Aprobado</p>' : ''}</section>
      <nav class="pager">${L.d > 1 ? `<a class="btn" href="#dia${L.d - 1}">← Día ${L.d - 1}</a>` : '<span></span>'}${L.d < 50 ? `<a class="btn" href="#dia${L.d + 1}">Día ${L.d + 1} →</a>` : '<a class="btn" href="#estrategia">Examen final →</a>'}</nav>
    </article>`);
    m.appendChild(el);
    if ($('#dg')) lazyDG($('#dg'), L.dg);
    el.querySelectorAll('[data-dg]').forEach((d) => lazyDG(d, d.dataset.dg));
    quiz($('#quiz'), L.q, (ok, total, firstTry) => {
      const prev = S.lessons[L.d] || {};
      if (ok === total) {
        if (!prev.passed) { addXP(20 + (firstTry ? 10 : 0)); S.rev[L.d] = { iv: 1, due: Date.now() + DAY }; }
        S.lessons[L.d] = { passed: true, at: Date.now() };
        mark('lesson'); save();
        return L.d < 50 ? `<p class="ok-msg">Día ${L.d} completado. <a href="#dia${L.d + 1}">Seguir con el día ${L.d + 1}</a></p>` : '<p class="ok-msg">Terminaste el bootcamp. Ahora: examen final y sesiones simuladas.</p>';
      }
      return `<p class="bad-msg">${ok}/${total}. Repasa la teoría y vuelve a intentarlo.</p>`;
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
      [1, 'Manipulación', '9:30–10:00', 'El mercado abre, manipula (barre liquidez), reacciona en un punto de interés y da un IFVG. Es la variable preferida del mentor.'],
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
    const cfg = S.simcfg, inProg = SIM && !SIM.done;
    const realN = (S.real || []).filter((d) => d.sess === cfg.sess && d.mkt === cfg.mkt).length;
    m.appendChild(H(`<header class="page-head"><h1>Practicar</h1><p class="lead">Ejercicios de 5 preguntas y sesiones simuladas, corregidos con las reglas de la estrategia.</p></header>`));
    const sc = H(`<section class="card sim-card">
      <div class="card-head"><h2>Sesión simulada</h2>${inProg ? `<span class="pill mid">En curso · ${E.hhmm(SIM.t)}</span>` : ''}</div>
      <div class="seg-row"><span>Sesión</span><div class="seg" data-k="sess"><button type="button" data-v="ny" class="${cfg.sess === 'ny' ? 'on' : ''}">NY AM 9:30</button><button type="button" data-v="asia" class="${cfg.sess === 'asia' ? 'on' : ''}">Asia 20:00</button></div></div>
      <div class="seg-row"><span>Mercado</span><div class="seg" data-k="mkt"><button type="button" data-v="NQ" class="${cfg.mkt === 'NQ' ? 'on' : ''}">Nasdaq NQ</button><button type="button" data-v="ES" class="${cfg.mkt === 'ES' ? 'on' : ''}">S&amp;P ES</button></div></div>
      <div class="seg-row"><span>Datos</span><div class="seg" data-k="real"><button type="button" data-v="0" class="${!cfg.real ? 'on' : ''}">Simulados</button><button type="button" data-v="1" class="${cfg.real ? 'on' : ''}" ${realN ? '' : 'disabled'}>Reales (${realN})</button></div></div>
      <div class="row">${inProg ? '<a class="btn pri" href="#simulador">Continuar la sesión</a><button class="btn" type="button" id="sim-fresh">Empezar otra</button>' : '<button class="btn pri wide" type="button" id="sim-fresh">Empezar sesión</button>'}</div>
    </section>`);
    m.appendChild(sc);
    sc.querySelectorAll('.seg').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const k = g.dataset.k; cfg[k] = k === 'real' ? b.dataset.v === '1' : b.dataset.v;
      if (k !== 'real' && !(S.real || []).some((d) => d.sess === cfg.sess && d.mkt === cfg.mkt)) cfg.real = false;
      save(); render();
    }));
    $('#sim-fresh').onclick = () => { SIM = null; newSim(); location.hash = 'simulador'; };
    // Importar velas reales
    const imp = H(`<details class="card"><summary><b>Practicar con datos reales</b><span class="muted small">${(S.real || []).length} sesiones guardadas</span></summary>
      <p class="small">En TradingView abre el gráfico de <b>NQ1!</b> o <b>ES1!</b> en <b>1 minuto</b>, usa “Exportar datos del gráfico” y elige aquí el archivo CSV. Se guardan las sesiones NY AM y Asia completas que contenga.</p>
      <div class="row"><div class="seg" id="imp-mkt"><button type="button" data-v="NQ" class="on">NQ</button><button type="button" data-v="ES">ES</button></div><label class="btn" for="imp-file">Elegir archivo CSV</label><input id="imp-file" type="file" accept=".csv,text/csv" hidden></div>
      <p class="small muted" id="imp-msg"></p>
      ${(S.real || []).length ? '<button class="link small" type="button" id="imp-clear">Borrar los datos reales guardados</button>' : ''}
    </details>`);
    m.appendChild(imp);
    let impMkt = 'NQ';
    $('#imp-mkt').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; impMkt = b.dataset.v; $('#imp-mkt').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); });
    $('#imp-file').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const days = E.parseCSV(String(rd.result), impMkt);
        if (!days.length) { $('#imp-msg').textContent = 'No encontré sesiones completas. Revisa que sea un CSV de 1 minuto con columnas time, open, high, low, close y que incluya 9:00–11:20 o 19:30–21:50 (hora de Nueva York).'; return; }
        const key = (d) => d.date + d.sess + d.mkt;
        const have = new Set((S.real || []).map(key));
        const add = days.filter((d) => !have.has(key(d)));
        S.real = [...(S.real || []), ...add].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
        save(); $('#imp-msg').textContent = `Importadas ${add.length} sesiones nuevas (${days.length} en el archivo).`;
        setTimeout(render, 1200);
      };
      rd.readAsText(f);
    });
    if ($('#imp-clear')) $('#imp-clear').onclick = () => { S.real = []; S.simcfg.real = false; save(); render(); };
    // Ejercicios
    const rx = recommendedEx();
    m.appendChild(H('<h2 class="sec-t">Ejercicios</h2>'));
    const g = H('<div class="excards"></div>');
    for (const x of EXS) {
      const r = S.ex[x.id];
      const recent = r?.hist?.length ? Math.round(r.hist.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, r.hist.length)) : null;
      g.appendChild(H(`<button class="excard ${x.id === rx ? 'rec' : ''}" data-id="${x.id}" type="button">${x.id === rx ? '<span class="rec-tag">Recomendado para ti</span>' : ''}<b>${x.t}</b><span>${x.d}</span><span class="exstat">${r ? `Reciente ${recent} % · mejor ${r.best} % · ${r.runs} ronda${r.runs > 1 ? 's' : ''}` : 'Sin intentos'}</span><i class="bar"><i style="width:${recent ?? 0}%"></i></i></button>`));
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
            if (rr < 1) return { ok: false, msg: `R:R 1:${Math.max(0, rr).toLocaleString('es-ES', { maximumFractionDigits: 2 })}. Por debajo de 1:1 no compensa. Busca un objetivo más lejos.` };
            return hit ? { ok: true, msg: `Correcto: ${hit.kind} con R:R 1:${rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })}.` } : { ok: false, msg: `R:R 1:${rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })}, pero no hay liquidez ni FVG en ese precio. El objetivo claro más cercano era ${valid[0] ? `${valid[0].kind} en ${fmt(valid[0].p)}` : 'ninguno'}.` };
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
    for (let k = 0; k < 3 && !EX.round; k++) EX.round = makeRound(EX.id);
    if (!EX.round) { m.appendChild(H('<section class="card"><p>No se pudo generar este ejercicio. Vuelve a intentarlo.</p><a class="btn" href="#practica">Volver</a></section>')); EX = null; return; }
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
      try { navigator.vibrate?.(res.ok ? 15 : [30, 40, 30]); } catch (e) { /* sin vibración */ }
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
    if (R.C) requestAnimationFrame(() => { if ($('#ex-chart')) draw(); });
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
    S.ex[EX.id] = r; addXP(EX.ok * 5); mark('ex'); save();
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
  // Diseño: pantalla completa en el celular (gráfico grande, reproductor y botones abajo),
  // panel lateral con checklist y contexto en escritorio, que en el celular es una hoja inferior.
  const INST = { MNQ: 2, NQ: 20, MES: 5, ES: 50 };
  let SIM = null, autoT = null, chartApi = null;
  function stopAuto() { if (autoT) { clearInterval(autoT); autoT = null; } }
  function newSim(seed) {
    const sd = seed ?? rand(), cfg = S.simcfg || { sess: 'ny', mkt: 'NQ', real: false };
    E.setSession(cfg.sess);
    let Ss = null;
    if (cfg.real) {
      // datos reales: recorre las sesiones importadas en orden, con hasta 5 días previos para el contexto
      const pool = (S.real || []).filter((d) => d.sess === cfg.sess && d.mkt === cfg.mkt);
      if (pool.length) { const day = pool[(S.realIdx || 0) % pool.length]; S.realIdx = (S.realIdx || 0) + 1; Ss = E.realSession(day, pool.filter((d) => d.date < day.date).slice(-5)); }
    }
    if (!Ss) Ss = E.genSession(sd, null, { mkt: cfg.mkt, sess: cfg.sess });
    const inst = Ss.mkt === 'ES' ? (SIM?.inst === 'ES' ? 'ES' : 'MES') : (SIM?.inst === 'NQ' ? 'NQ' : 'MNQ');
    SIM = { speed: SIM?.speed || 1, tf: SIM?.tf || 1, htfTf: SIM?.htfTf || 60, seed: sd, S: Ss, t: E.OPEN - 1, trades: [], order: null, done: false, assist: SIM?.assist ?? true, inst, acct: SIM?.acct || 50000, risk: SIM?.risk ?? 0.5, result: null, side: false, replay: null };
  }
  const buzz = (p) => { try { navigator.vibrate?.(p); } catch (e) { /* sin vibración */ } };
  const live = () => !SIM.done; // modo pantalla completa mientras la sesión sigue
  function vSim(m) {
    if (!SIM) newSim();
    document.body.classList.toggle('sx-live', live());
    const pm = SIM.S.C.slice(0, E.OPEN);
    const PH = Math.max(...pm.map((b) => b.h)), PL = Math.min(...pm.map((b) => b.l));
    m.appendChild(H(`<section class="sx" id="sx">
      <header class="sx-top">
        <button class="sx-x" id="sx-exit" type="button" aria-label="Salir del simulador"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
        <div class="sx-clock"><b id="sx-clock" class="mono">9:29</b><span id="sx-win"><i></i>Pre-market</span></div>
        <button class="sx-ring" id="sx-ring" type="button" aria-label="Abrir checklist y contexto"><i></i><span>0/5</span></button>
      </header>
      <div class="sx-bar">
        <span class="sx-price"><small>${SIM.S.mkt} · ${SIM.S.real ? 'real ' + SIM.S.date : 'simulado'}${SIM.S.sess === 'asia' ? ' · Asia' : ''}</small><b id="sx-price" class="mono"></b></span>
        <div id="sim-tf"></div>
      </div>
      <div class="sx-chartwrap" id="sx-wrap"><div class="sim-chart" id="sim-chart"></div><div class="sx-over" id="sx-over"></div></div>
      <div class="sx-prog" aria-label="Progreso de la sesión"><div class="track"><i class="win"></i><i class="fill" id="sx-fill"></i><i class="knob" id="sx-knob"></i></div><div class="lbls"><span class="a">${E.hhmm(0)}</span><span class="b">${E.hhmm(E.OPEN)}</span><span class="c">${E.hhmm(E.WIN_END)}</span></div></div>
      <div class="sx-dock" id="sim-ctrl"></div>
      <div id="sim-result"></div>
      <div class="sx-scrim" id="sx-scrim"></div>
      <aside class="sx-side" id="sx-side" aria-label="Checklist y contexto">
        <button class="sheet-grip" id="sx-grip" type="button" aria-label="Cerrar"></button>
        <div class="live" id="live" aria-live="polite"></div>
        <div class="htf"><div class="htf-head"><h2>Contexto</h2><div id="htf-tf"></div></div><div id="htf"></div><p class="small muted" id="htf-t"></p></div>
        <div class="levels"><span><small>Máx. pre-market</small><b class="mono">${fmt(PH)}</b></span><span><small>Mín. pre-market</small><b class="mono">${fmt(PL)}</b></span></div>
        <details class="settings"><summary>Cuenta y ayudas</summary>
          <div class="form-grid">
            <label for="s-acct">Cuenta ($)<input id="s-acct" type="number" step="1000" min="5000" value="${SIM.acct}"></label>
            <label for="s-inst">Contrato<select id="s-inst">${Object.keys(INST).map((k) => `<option ${k === SIM.inst ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
            <label class="chk" for="s-assist"><input id="s-assist" type="checkbox" ${SIM.assist ? 'checked' : ''}> Ayudas: niveles, FVG, checklist y plan sugerido</label>
          </div></details>
      </aside>
    </section>`));
    $('#s-acct').addEventListener('change', (e) => { SIM.acct = Math.max(5000, +e.target.value || 50000); simDraw(); });
    $('#s-inst').addEventListener('change', (e) => { SIM.inst = e.target.value; simDraw(); });
    $('#s-assist').addEventListener('change', (e) => { SIM.assist = e.target.checked; simDraw(); });
    const side = (on) => { SIM.side = on; $('#sx').classList.toggle('side-open', on); };
    $('#sx-ring').onclick = () => side(!SIM.side);
    $('#sx-scrim').onclick = () => side(false);
    $('#sx-grip').onclick = () => side(false);
    $('#sx-exit').onclick = () => { stopAuto(); location.hash = 'inicio'; };
    requestAnimationFrame(() => {
      if (!$('#htf')) return; // se cambió de pantalla antes de dibujar
      const drawHTF = (tf) => {
        SIM.htfTf = tf;
        CH.candles($('#htf'), E.agg(SIM.S.htf.C, tf / 60), { h: 110, axis: false, maxBw: tf === 60 ? 8 : 16 });
        $('#htf-t').textContent = `Estructura ${SIM.S.bias > 0 ? 'alcista (HH y HL): buscas compras tras barrer un mínimo' : 'bajista (LH y LL): buscas ventas tras barrer un máximo'}.`;
      };
      CH.tfBar($('#htf-tf'), [60, 240], SIM.htfTf || 60, drawHTF, 'Temporalidad del contexto');
      drawHTF(SIM.htfTf || 60);
      CH.tfBar($('#sim-tf'), [1, 2, 5, 15], SIM.tf, (tf) => { SIM.tf = tf; simDraw(); }, 'Temporalidad del gráfico');
      simDraw();
    });
  }

  function simAnn() {
    const { S: Ss, t } = SIM, C = Ss.C, ann = [];
    const pm = C.slice(0, E.OPEN), PH = Math.max(...pm.map((b) => b.h)), PL = Math.min(...pm.map((b) => b.l));
    ann.push({ k: 'v', i: E.OPEN, c: 'mute', t: '9:30' }, { k: 'v', i: E.WIN_END, c: 'mute', t: '11:00' });
    if (SIM.assist && !SIM.done) {
      ann.push({ k: 'h', p: PH, i0: 0, i1: E.BARS, c: 'acc', t: 'Máx. pre-market', noScale: true }, { k: 'h', p: PL, i0: 0, i1: E.BARS, c: 'acc', t: 'Mín. pre-market', below: true, noScale: true });
      // FVG de la temporalidad visible (solo velas cerradas); índices en minutos para el mapeo
      const tf = SIM.tf, A = E.agg(C, tf, t), closed = Math.floor((t + 1) / tf);
      const lv = E.fvgs(A, closed).filter((f) => f.formed < closed && f.i >= closed - Math.ceil(40 / tf) && f.top - f.bot >= Ss.vol * 0.2 * Math.sqrt(tf));
      const invT = new Map(E.ifvgs(A, closed).map((x) => [x.fvg.i + ':' + x.fvg.dir, x.t]));
      const shown = lv.filter((f) => {
        const it = invT.get(f.i + ':' + f.dir);
        if (it != null) return it >= closed - Math.ceil(10 / tf);
        for (let m = f.formed + 1; m < closed; m++) if (f.dir > 0 ? A[m].l <= f.bot : A[m].h >= f.top) return false;
        return true;
      }).slice(-4);
      for (const f of shown) {
        const isInv = invT.has(f.i + ':' + f.dir);
        ann.push({ k: 'box', i0: (f.i - 1) * tf, i1: Math.min(t + 3 * tf, E.BARS), p0: f.bot, p1: f.top, c: isInv ? 'info' : f.dir > 0 ? 'bull' : 'bear', op: isInv ? 0.15 : 0.2, noScale: true });
      }
    }
    for (const tr of SIM.trades) ann.push({ k: 'trade', i0: tr.t, i1: tr.exitI != null ? tr.exitI + 1 : t + 2, entry: tr.entry, sl: tr.slNow ?? tr.sl, tp: tr.tp, labels: tr.exitI != null });
    return ann;
  }

  function simDraw() {
    const host = $('#sim-chart'); if (!host || !SIM) return;
    document.body.classList.toggle('sx-live', live());
    const { S: Ss, t } = SIM;
    // primero el panel inferior: su altura decide cuánto espacio queda para el gráfico
    simHead(); simLive(); simCtrl();
    let ann = SIM.done && SIM.result?.reveal ? [...simAnn(), ...SIM.result.reveal] : simAnn();
    let upto = SIM.done ? Ss.C.length - 1 : t;
    const rp = SIM.done && SIM.replay != null ? replaySteps()[SIM.replay] : null;
    if (rp) { ann = [...simAnn().filter((x) => x.k === 'v'), ...rp.ann]; upto = Math.min(Ss.C.length - 1, rp.upto); }
    const tf = SIM.tf, A = E.agg(Ss.C, tf, upto);
    const total = Math.ceil(E.BARS / tf), cw = host.clientWidth || 640;
    const fit = Math.floor((cw - 68) / 7);
    let s0 = 0, slots = total;
    if (!SIM.done && fit < total) { slots = fit; s0 = Math.max(0, A.length - (fit - 8)); }
    const mapped = CH.mapAnn(ann, tf).filter((x) => (x.i1 == null || x.i1 > s0 || x.k === 'h') && (x.i == null || x.i >= s0))
      .map((x) => { const y = { ...x }; for (const k of ['i', 'i0', 'i1']) if (y[k] != null) y[k] = Math.max(0, y[k] - s0); return y; });
    const wrap = $('#sx-wrap');
    const h = live() && wrap && wrap.clientHeight > 180 ? wrap.clientHeight : (cw < 500 ? 300 : 400);
    chartApi = CH.candles(host, A.slice(s0), { tf, t0: s0 * tf, slots: rp ? total : slots, ann: mapped, times: true, h, extraP: SIM.order ? [SIM.order.entry, SIM.order.sl, SIM.order.tp] : [], minBw: 6, cross: !SIM.order, onPick: SIM.order ? orderPick : null, label: `${Ss.mkt} ${tf} minutos` });
    host.scrollLeft = Math.max(0, chartApi.x(A.length - 1 - s0) - host.clientWidth + 120);
    simOver();
    // en el primer pintado el hueco del gráfico aún no tiene su alto final: volver a medir una vez
    // el hueco del gráfico puede cambiar de alto después (primer pintado, giro, barra de Safari): redibujar al cambiar
    SIM.drawnH = h;
    if (wrap && !wrap.__ro && window.ResizeObserver) {
      let rt; wrap.__ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (SIM && live() && document.contains(wrap) && wrap.clientHeight > 180 && Math.abs(wrap.clientHeight - SIM.drawnH) > 4) simDraw(); }, 60); });
      wrap.__ro.observe(wrap);
    }
    if (SIM.done) simResult();
  }

  function simHead() {
    const { t } = SIM, b = SIM.S.C[t];
    const inWin = t >= E.OPEN && t < E.WIN_END;
    $('#sx-clock').textContent = E.hhmm(t);
    const w = $('#sx-win');
    w.className = inWin ? 'on' : '';
    w.innerHTML = `<i></i>${t < E.OPEN ? 'Pre-market · abre 9:30' : inWin ? `Ventana abierta · quedan ${E.WIN_END - t} min` : 'Ventana cerrada'}`;
    $('#sx-price').textContent = fmt(b.c);
    const pct = (t / (E.BARS - 1) * 100).toFixed(2);
    $('#sx-fill').style.width = pct + '%'; $('#sx-knob').style.left = pct + '%';
  }

  // Checklist en vivo: qué pasos de la estrategia se cumplen en la vela actual
  function checklist() {
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
    return [
      [inWin ? 'ok' : 'no', 'Horario operativo', t < E.OPEN ? 'La ventana abre a las 9:30.' : inWin ? `Ventana abierta: quedan ${E.WIN_END - t} minutos.` : 'Ventana cerrada: ya no se opera.'],
      [s ? 'ok' : inWin ? 'wait' : 'no', 'Toma de liquidez', s ? `${E.hhmm(s.j)} barrió un ${s.level.type === 'L' ? 'mínimo' : 'máximo'}: buscas ${side}.` : 'Esperando que el precio barra un máximo o un mínimo.'],
      [iv.length ? 'ok' : s ? 'wait' : 'no', 'IFVG', iv.length ? `Una vela cerró invalidando el FVG a las ${E.hhmm(iv[iv.length - 1].t)}.` : s ? 'Espera el cierre que invalide un FVG.' : 'Primero tiene que haber toma de liquidez.'],
      [tgt ? 'ok' : s ? 'wait' : 'no', 'Objetivo claro', tgt ? `${tgt.kind} · R:R 1:${rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })}.` : s ? 'Todavía no hay objetivo con R:R 1:1 o más.' : 'Se define después de la toma de liquidez.'],
      [SIM.trades.length ? 'no' : 'ok', 'Un trade por sesión', SIM.trades.length ? 'Ya usaste tu trade de hoy.' : 'Todavía no operaste hoy.'],
    ];
  }
  function simLive() {
    const el = $('#live'), ring = $('#sx-ring'); if (!el) return;
    if (!SIM.assist) {
      el.innerHTML = '<h2>Checklist</h2><p class="small muted">Ayudas desactivadas. Actívalas en “Cuenta y ayudas”.</p>';
      ring.querySelector('span').textContent = '—'; ring.querySelector('i').style.setProperty('--p', '0%'); return;
    }
    const items = checklist(), n = items.filter((x) => x[0] === 'ok').length;
    ring.querySelector('span').textContent = `${n}/5`;
    ring.querySelector('i').style.setProperty('--p', `${n * 20}%`);
    ring.classList.toggle('full', n === 5);
    el.innerHTML = `<h2>Checklist de la estrategia <span>${n} de 5</span></h2><ul>${items.map(([st, l, d]) => `<li class="${st}"><i>${st === 'ok' ? '✓' : st === 'wait' ? '…' : ''}</i><span><b>${l}</b><small>${esc(d)}</small></span></li>`).join('')}</ul>`;
  }

  // Panel inferior: reproductor + compra/venta, o la orden, o la posición abierta
  // Repetición guiada: la sesión paso a paso con el setup del plan y tu operación
  function replaySteps() {
    const C = SIM.S.C, R = SIM.result, sys = R.sys, tr = SIM.trades[0];
    const pm = C.slice(0, E.OPEN), PH = Math.max(...pm.map((b) => b.h)), PL = Math.min(...pm.map((b) => b.l));
    const lv = [{ k: 'h', p: PH, i0: 0, i1: E.BARS, c: 'acc', t: 'Máx. pre-market' }, { k: 'h', p: PL, i0: 0, i1: E.BARS, c: 'acc', t: 'Mín. pre-market', below: true }];
    const steps = [{ upto: E.OPEN - 1, h: 'Contexto', p: `Antes de la apertura la estructura de 1H es ${SIM.S.bias > 0 ? 'alcista: lo más probable es buscar compras tras barrer un mínimo' : 'bajista: lo más probable es buscar ventas tras barrer un máximo'}. El máximo y el mínimo del pre-market son la liquidez de la apertura.`, ann: lv }];
    if (sys) {
      const sa = CH.setupAnn(C, sys, { open: false }).ann, r = E.runTrade(C, { t: sys.t, dir: sys.dir, entry: sys.entry, sl: sys.stop, tp: sys.target });
      const swA = sa.filter((x) => x.t === 'Toma de liquidez' || x.k === 'h');
      const fvA = sa.filter((x) => x.k === 'box' || x.k === 'mark');
      const side = sys.dir > 0 ? 'compras' : 'ventas';
      steps.push({ upto: sys.sweep.j + 1, h: 'Toma de liquidez', p: `A las ${E.hhmm(sys.sweep.j)} el precio barrió ${sys.sweep.level.type === 'L' ? 'un mínimo' : 'un máximo'} y volvió a cerrar dentro: es la manipulación. Desde aquí se buscan ${side}.`, ann: [...lv, ...swA] });
      steps.push({ upto: sys.t, h: 'IFVG: la entrada', p: `A las ${E.hhmm(sys.t)} una vela cerró ${sys.dir > 0 ? 'por encima' : 'por debajo'} del FVG que dejó la manipulación. Ese cierre es la entrada (Modelo ${sys.model}).`, ann: [...lv, ...swA, ...fvA] });
      steps.push({ upto: sys.t + 1, h: 'Stop y objetivo', p: `Stop en ${fmt(sys.stop)}, detrás del extremo del barrido. Objetivo en ${fmt(sys.target)} (${sys.targetKind.toLowerCase().replace('fvg', 'FVG')}). R:R 1:${sys.rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })}.`, ann: [...lv, ...swA, ...fvA, { k: 'trade', i0: sys.t, i1: sys.t + 10, entry: sys.entry, sl: sys.stop, tp: sys.target }] });
      steps.push({ upto: r.i + 3, h: 'Resultado del plan', p: r.reason === 'Take profit' ? `El precio llegó al objetivo a las ${E.hhmm(r.i)}: +${sys.rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })} R.` : r.reason === 'Stop loss' ? `Tocó el stop a las ${E.hhmm(r.i)}: −1 R. Una pérdida con el plan cumplido sigue siendo un buen trade.` : 'La sesión terminó sin tocar ni el stop ni el objetivo.', ann: [...lv, ...sa] });
    } else steps.push({ upto: E.WIN_END, h: 'Sin setup', p: 'En toda la ventana no hubo toma de liquidez + IFVG + objetivo claro. El plan era no operar.', ann: lv });
    if (tr) {
      const d = sys ? tr.t - sys.t : null;
      const rel = !sys ? 'en un día sin setup del plan' : tr.dir !== sys.dir ? 'en la dirección contraria al setup del plan' : Math.abs(d) <= 3 ? 'en el mismo setup que el plan' : d < 0 ? `${-d} min antes que el setup del plan` : `${d} min después que el setup del plan`;
      const fails = (R.grade.items || []).filter((x) => x.key && !x.ok).map((x) => x.label.toLowerCase());
      steps.push({ upto: (tr.exitI ?? E.BARS - 1) + 3, h: 'Tu operación', p: `Entraste en ${tr.dir > 0 ? 'compra' : 'venta'} a las ${E.hhmm(tr.t)}, ${rel}. Resultado: ${tr.R >= 0 ? '+' : ''}${tr.R.toLocaleString('es-ES', { maximumFractionDigits: 2 })} R (${tr.reason.toLowerCase()}).${fails.length ? ' A revisar: ' + fails.join(', ') + '.' : ' Cumpliste todas las reglas.'}`, ann: [...lv, { k: 'trade', i0: tr.t, i1: (tr.exitI ?? E.BARS - 1) + 1, entry: tr.entry, sl: tr.slNow ?? tr.sl, tp: tr.tp }] });
    }
    return steps;
  }

  function simCtrl() {
    const c = $('#sim-ctrl'); if (!c) return;
    if (SIM.done && SIM.replay != null) {
      const steps = replaySteps(), i = SIM.replay, st = steps[i];
      c.innerHTML = `<div class="sx-replay"><div class="rp-head"><span class="pill mid">Paso ${i + 1} de ${steps.length}</span><button class="link small" type="button" id="rp-x">Salir</button></div><h2>${st.h}</h2><p>${esc(st.p)}</p>
        <div class="sx-row"><button class="btn" type="button" id="rp-prev" ${i ? '' : 'disabled'}>← Anterior</button><button class="btn pri" type="button" id="rp-next">${i < steps.length - 1 ? 'Siguiente →' : 'Terminar'}</button></div></div>`;
      $('#rp-prev').onclick = () => { SIM.replay--; simDraw(); };
      $('#rp-next').onclick = () => { if (i < steps.length - 1) SIM.replay++; else SIM.replay = null; simDraw(); };
      $('#rp-x').onclick = () => { SIM.replay = null; simDraw(); };
      return;
    }
    if (SIM.done) { c.innerHTML = `<div class="sx-row"><button class="btn" id="rp-start2" type="button">Repetición guiada</button><button class="btn pri" id="sim-new" type="button">Nueva sesión</button></div>`; $('#sim-new').onclick = () => { newSim(); render(); }; $('#rp-start2').onclick = () => { SIM.replay = 0; simDraw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }; return; }
    const op = SIM.trades.find((x) => x.exitI == null);
    const sp = SIM.speed || 1;
    const player = `<div class="sx-player">
        <button class="btn sq" id="sim-speed" type="button" aria-label="Velocidad">×${sp}</button>
        <button class="btn" id="sim-step" type="button" aria-label="Avanzar 1 minuto">+1m</button>
        <button class="btn play" id="sim-auto" type="button" aria-label="${autoT ? 'Pausar' : 'Reproducir'}">${autoT ? '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect x="5" y="4" width="4" height="14" rx="1.5"/><rect x="13" y="4" width="4" height="14" rx="1.5"/></svg>' : '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M7 4l11 7-11 7z"/></svg>'}</button>
        <button class="btn" id="sim-5" type="button" aria-label="Avanzar">${SIM.tf === 1 ? '+5m' : `+${SIM.tf}m`}</button>
        <button class="btn ghost sq" id="sim-end" type="button">Fin</button>
      </div>`;
    if (SIM.order) { c.innerHTML = orderPanel(); bindOrder(); return; }
    if (op) {
      const b = SIM.S.C[SIM.t], pts = (b.c - op.entry) * op.dir, risk = Math.abs(op.entry - op.sl), R = pts / risk;
      const lo = Math.min(op.sl, op.tp), hi = Math.max(op.sl, op.tp), pos = Math.max(0, Math.min(1, (b.c - lo) / (hi - lo)));
      const entryPos = (op.entry - lo) / (hi - lo);
      const knob = (op.dir > 0 ? pos : 1 - pos) * 100, ePos = (op.dir > 0 ? entryPos : 1 - entryPos) * 100;
      c.innerHTML = player + `<div class="sx-pos">
        <div class="pos-head"><span><b>${op.dir > 0 ? 'Compra' : 'Venta'} · ${op.qty} ${SIM.inst}</b><small>Entrada ${fmt(op.entry)} · ${E.hhmm(op.t)}${op.slNow === op.entry ? ' · stop en BE' : ''}</small></span>
          <span class="pnl ${R >= 0 ? 'pos' : 'neg'}"><b>${R >= 0 ? '+' : ''}${R.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} R</b><small>${R >= 0 ? '+' : ''}${Math.round(R * op.usdPerR).toLocaleString('es-ES')} $</small></span></div>
        <div class="pos-bar" style="--e:${ePos}%"><i class="knob" style="left:${knob}%"></i></div>
        <div class="pos-lbl"><span>SL ${fmt(op.slNow ?? op.sl)}</span><span>TP ${fmt(op.tp)}</span></div>
        <div class="sx-row"><button class="btn buy" id="sim-be" type="button" ${op.slNow === op.entry ? 'disabled' : ''}>Stop a break even</button><button class="btn sell" id="sim-close" type="button">Cerrar a mercado</button></div>
      </div>`;
    } else {
      const px = fmt(SIM.S.C[SIM.t].c);
      c.innerHTML = player + `<div class="sx-row trade">
        <button class="btn buy tall" id="sim-buy" type="button"><b>Comprar</b><small>${px}</small></button>
        <button class="btn sell tall" id="sim-sell" type="button"><b>Vender</b><small>${px}</small></button></div>`;
    }
    const play = () => { stopAuto(); autoT = setInterval(() => simStep(1), 450 / (SIM.speed || 1)); };
    $('#sim-step').onclick = () => simStep(1);
    $('#sim-5').onclick = () => simStep(SIM.tf === 1 ? 5 : SIM.tf - (SIM.t + 1) % SIM.tf || SIM.tf);
    $('#sim-auto').onclick = () => { if (autoT) stopAuto(); else play(); simCtrl(); };
    $('#sim-speed').onclick = () => { SIM.speed = sp === 1 ? 2 : sp === 2 ? 4 : 1; if (autoT) play(); simCtrl(); };
    $('#sim-end').onclick = () => simFinish();
    if (op) {
      $('#sim-be').onclick = () => { op.slNow = op.entry; op.be = true; buzz(15); simDraw(); };
      $('#sim-close').onclick = () => { closeTrade(op, SIM.S.C[SIM.t].c, SIM.t, 'Cierre manual'); simDraw(); };
    } else {
      $('#sim-buy').onclick = () => openOrder(1);
      $('#sim-sell').onclick = () => openOrder(-1);
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
  function closeTrade(tr, px, i, reason) { tr.exit = px; tr.exitI = i; tr.reason = reason; tr.R = (px - tr.entry) * tr.dir / Math.abs(tr.entry - tr.sl); buzz(reason === 'Take profit' ? [20, 40, 20] : 30); }

  // Sugerencias según la estrategia: stop tras el extremo del barrido y TP en el objetivo más cercano con R:R ≥ 1
  function suggest(o) {
    const C = SIM.S.C, t = SIM.t, dir = o.dir;
    const sw = E.sweeps(C, t + 1).filter((x) => x.dir === dir && x.j >= t - 15 && x.j <= t);
    const from = sw.length ? sw[sw.length - 1].j : Math.max(0, t - 10);
    const seg = C.slice(from, t + 1);
    const es = SIM.S.mkt === 'ES', pad = es ? 0.25 : 1, minStop = es ? 1.25 : 4; // un stop de 1-2 puntos lo barre el ruido
    let sl = E.rt(dir > 0 ? Math.min(...seg.map((b) => b.l)) - pad : Math.max(...seg.map((b) => b.h)) + pad);
    if ((o.entry - sl) * dir < minStop) sl = E.rt(o.entry - dir * minStop);
    const risk = Math.abs(o.entry - sl);
    const tg = E.targets(C, t, dir).find((x) => (x.p - o.entry) * dir >= risk);
    return { sl, tp: tg ? tg.p : E.rt(o.entry + dir * risk * 1.5), why: sw.length ? 'stop tras el barrido' : 'stop tras el extremo reciente', tpWhy: tg ? tg.kind.toLowerCase().replace('fvg', 'FVG') : 'objetivo a 1,5 R (no hay liquidez cerca)' };
  }
  function openOrder(dir) {
    stopAuto();
    const entry = SIM.S.C[SIM.t].c;
    const o = { dir, entry, risk: SIM.risk };
    if (SIM.assist) { const sg = suggest(o); o.sl = sg.sl; o.tp = sg.tp; o.why = `Plan sugerido: ${sg.why} y ${sg.tpWhy}.`; }
    else { const k = SIM.S.mkt === 'ES' ? 0.3 : 1; o.sl = E.rt(entry - dir * 10 * k); o.tp = E.rt(entry + dir * 15 * k); o.why = 'Coloca el stop y el objetivo según el plan.'; }
    SIM.warn = SIM.trades.length ? 'Tu plan dice un trade por sesión: este segundo trade se descuenta en tu nota.' : '';
    SIM.order = o; buzz(10);
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
    else if (o.tp != null && (o.tp - o.entry) * o.dir <= 0) err = `El objetivo debe estar ${o.dir > 0 ? 'por encima' : 'por debajo'} de la entrada.`;
    else if (o.sl != null && qty < 1) err = `Con ${o.risk.toLocaleString('es-ES')} % y ${stopPts.toLocaleString('es-ES')} puntos de stop no alcanza para 1 contrato de ${SIM.inst}. Acerca el stop o usa un micro (MNQ o MES).`;
    return { pv, stopPts, riskUsd, qty, realPct, rr, err };
  }
  function orderNums(o) {
    const k = orderCalc(o), rr = k.rr ?? 0;
    return { k, html: `<div class="rr-line"><div class="rrbar"><i class="l">1 R</i><i class="w" style="flex:${Math.max(0.15, rr).toFixed(2)}">${rr.toLocaleString('es-ES', { maximumFractionDigits: 1 })} R</i></div><b class="${rr >= 1 ? 'pos' : 'neg'}">1:${rr.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</b></div>
      <div class="o-sum"><span>Stop <b class="mono">${k.stopPts.toLocaleString('es-ES')} pts</b></span><span><b>${k.qty || '—'} ${SIM.inst}</b></span><span>Riesgo <b>${k.qty ? Math.round(k.qty * k.stopPts * k.pv).toLocaleString('es-ES') + ' $' : '—'}</b></span></div>
      ${k.err ? `<p class="bad-msg">${k.err}</p>` : ''}` };
  }
  function orderPanel() {
    const o = SIM.order, buy = o.dir > 0, { k, html } = orderNums(o);
    return `<form class="sx-order ${buy ? 'is-buy' : 'is-sell'}" id="ord">
      <div class="o-head"><span><b>${buy ? 'Compra' : 'Venta'} a mercado</b><small class="mono">Entrada ${fmt(o.entry)} · ${E.hhmm(SIM.t)}</small></span></div>
      <div id="o-nums">${html}</div>
      <div class="risk-row"><span>Riesgo</span>${[0.5, 0.6, 0.7].map((r) => `<button type="button" class="rk ${Math.abs(o.risk - r) < 1e-9 ? 'on' : ''}" data-r="${r}">${String(r).replace('.', ',')} %</button>`).join('')}</div>
      <div class="sx-row"><button class="btn ghost" type="button" id="o-cancel">Cancelar</button><button class="btn ${buy ? 'buy' : 'sell'} tall" type="submit" id="o-ok" ${k.err ? 'disabled' : ''}>Confirmar ${buy ? 'compra' : 'venta'}</button></div>
    </form>`;
  }
  function refreshOrderNums() {
    const o = SIM.order; if (!o || !$('#o-nums')) return;
    const { k, html } = orderNums(o);
    $('#o-nums').innerHTML = html; $('#o-ok').disabled = !!k.err;
  }
  function bindOrder() {
    const o = SIM.order;
    $('#sim-ctrl').querySelectorAll('.rk').forEach((b) => b.onclick = () => { o.risk = +b.dataset.r; SIM.risk = o.risk; simCtrl(); });
    $('#o-cancel').onclick = () => { SIM.order = null; SIM.warn = ''; simDraw(); };
    $('#ord').addEventListener('submit', (e) => {
      e.preventDefault();
      const kk = orderCalc(o); if (kk.err) return;
      SIM.trades.push({ t: SIM.t, dir: o.dir, entry: o.entry, sl: o.sl, tp: o.tp, qty: kk.qty, riskPct: kk.realPct, usdPerR: kk.qty * kk.stopPts * kk.pv });
      SIM.order = null; SIM.warn = ''; buzz(25); simDraw();
    });
  }
  // Toque en el gráfico durante la orden: mueve la línea más cercana (stop u objetivo)
  function orderPick(q) {
    const o = SIM.order; if (!o) return;
    const f = Math.abs(q.p - o.sl) <= Math.abs(q.p - o.tp) ? 'sl' : 'tp';
    o[f] = q.p; buzz(8); simOver(); refreshOrderNums();
  }

  // Capa sobre el gráfico: líneas de la orden con etiquetas que se arrastran o se ajustan con ▲▼, y avisos
  function simOver() {
    const over = $('#sx-over'), host = $('#sim-chart'); if (!over || !host) return;
    over.innerHTML = '';
    const msgs = [];
    if (SIM.warn) msgs.push(SIM.warn);
    if (SIM.order) msgs.push(SIM.order.why + ' Arrastra las etiquetas o usa ▲▼.');
    if (msgs.length) over.appendChild(H(`<div class="sx-toast">${msgs.map(esc).join('<br>')}</div>`));
    if (!SIM.order || !chartApi) return;
    const o = SIM.order, svg = chartApi.svg;
    const offY = svg.getBoundingClientRect().top - over.getBoundingClientRect().top;
    const scale = svg.getBoundingClientRect().height / chartApi.H;
    const Y = (p) => offY + chartApi.y(p) * scale;
    const zone = (a, b, cls) => { const el = H(`<i class="oz ${cls}"></i>`); el.style.top = Math.min(Y(a), Y(b)) + 'px'; el.style.height = Math.abs(Y(a) - Y(b)) + 'px'; over.appendChild(el); return el; };
    const zt = zone(o.entry, o.tp, 'tp'), zs = zone(o.entry, o.sl, 'sl');
    const eline = H('<i class="ol entry"><span>Entrada</span></i>'); eline.style.top = Y(o.entry) + 'px'; over.appendChild(eline);
    const handle = (f, label) => {
      const el = H(`<div class="oh ${f}" role="group" aria-label="${label}"><i class="ol"></i><div class="pill"><button type="button" class="nud" data-d="1" aria-label="Subir ${label}">▲</button><span class="grab"><b>${f === 'sl' ? 'SL' : 'TP'}</b><span class="mono"></span></span><button type="button" class="nud" data-d="-1" aria-label="Bajar ${label}">▼</button></div></div>`);
      const place = () => { el.style.top = Y(o[f]) + 'px'; el.querySelector('.mono').textContent = fmt(o[f]); zt.style.top = Math.min(Y(o.entry), Y(o.tp)) + 'px'; zt.style.height = Math.abs(Y(o.entry) - Y(o.tp)) + 'px'; zs.style.top = Math.min(Y(o.entry), Y(o.sl)) + 'px'; zs.style.height = Math.abs(Y(o.entry) - Y(o.sl)) + 'px'; };
      el.querySelectorAll('.nud').forEach((b) => b.onclick = (e) => { e.stopPropagation(); o[f] = E.rt(o[f] + +b.dataset.d); buzz(6); place(); refreshOrderNums(); });
      const grab = el.querySelector('.grab');
      let drag = false;
      grab.addEventListener('pointerdown', (e) => { drag = true; grab.setPointerCapture(e.pointerId); el.classList.add('drag'); e.preventDefault(); });
      grab.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const r = svg.getBoundingClientRect();
        const py = (e.clientY - r.top) / scale;
        o[f] = E.rt(chartApi.hi - (py - chartApi.padT) / chartApi.ih * (chartApi.hi - chartApi.lo));
        place(); refreshOrderNums();
      });
      const end = () => { if (!drag) return; drag = false; el.classList.remove('drag'); buzz(6); simDraw(); }; // redibuja para reajustar la escala
      grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
      over.appendChild(el); place();
    };
    handle('tp', 'objetivo'); handle('sl', 'stop');
  }

  function simFinish() {
    stopAuto();
    if (SIM.done) return;
    SIM.order = null;
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
      grade = { score: 40, items: [{ label: 'Sesión sin operar', pts: 40, max: 100, ok: false, msg: `Había un setup válido a las ${E.hhmm(sys.t)} (Modelo ${sys.model}, ${sys.dir > 0 ? 'compra' : 'venta'}, R:R 1:${sys.rr.toFixed(1).replace('.', ',')}). Ver la repetición en el gráfico.` }] };
    } else {
      grade = { score: 100, items: [{ label: 'Sesión sin operar', pts: 100, max: 100, ok: true, msg: 'Correcto: no hubo toma de liquidez + IFVG + objetivo claro dentro de la ventana. No operar también es cumplir el plan.' }] };
    }
    let reveal = [];
    if (sys) {
      const sa = CH.setupAnn(C, sys, { open: false });
      reveal = sa.ann.map((x) => (x.k === 'mark' && x.t === 'IFVG' ? { ...x, t: `Sistema: Modelo ${sys.model}` } : x)).filter((x) => x.k !== 'trade' || !SIM.trades.length);
    }
    SIM.result = { grade, outcome, sys, reveal };
    const rec = { at: Date.now(), seed: SIM.seed, score: grade.score, R: +outcome.toFixed(2), trades: SIM.trades.map((x) => ({ dir: x.dir, t: x.t, R: +x.R.toFixed(2), reason: x.reason, riskPct: +x.riskPct.toFixed(2) })), model: sys?.model ?? null, sysT: sys?.t ?? null, sysDir: sys?.dir ?? null, note: '',
      items: (grade.items || []).filter((x) => x.key).map((x) => ({ k: x.key, ok: !!x.ok })), sess: SIM.S.sess, mkt: SIM.S.mkt, real: !!SIM.S.real };
    S.sims.push(rec); addXP(grade.score / 5); mark('sim'); save();
    SIM.recIdx = S.sims.length - 1;
    SIM.side = false;
    simDraw();
    window.scrollTo({ top: 0 });
  }
  function simResult() {
    const host = $('#sim-result'); if (!host || !SIM.result || host.dataset.rec === String(SIM.recIdx)) return;
    host.dataset.rec = String(SIM.recIdx);
    const { grade, outcome, sys } = SIM.result;
    const tier = grade.score >= 85 ? ['Excelente', 'good'] : grade.score >= 70 ? ['Bien', 'good'] : grade.score >= 50 ? ['Mejorable', 'mid'] : ['Fuera del plan', 'bad'];
    const tr = SIM.trades[0];
    host.innerHTML = `<section class="panel result">
      <div class="res-head"><div class="score ${tier[1]}"><b>${grade.score}</b><span>/100 disciplina</span></div>
        <div><h2>${tier[0]}</h2><p>${tr ? `${tr.dir > 0 ? 'Compra' : 'Venta'} a las ${E.hhmm(tr.t)} · ${tr.reason} · <b class="${outcome >= 0 ? 'pos' : 'neg'}">${outcome >= 0 ? '+' : ''}${outcome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R</b> (${(outcome * tr.usdPerR).toLocaleString('es-ES', { maximumFractionDigits: 0 })} $)` : 'Sin operaciones'}</p>
        <p class="muted small">La nota mide si seguiste el plan, no si ganaste. ${sys ? `El sistema detectó el primer setup a las ${E.hhmm(sys.t)} (Modelo ${sys.model}).` : 'El sistema no detectó setups válidos en la ventana.'}</p></div></div>
      <button class="btn pri wide" type="button" id="rp-start">Ver repetición guiada paso a paso</button>
      <ul class="grade">${grade.items.map((it) => `<li class="${it.ok ? 'ok' : it.pts > 0 ? 'mid' : 'no'}"><div><b>${it.label}</b><p>${esc(it.msg)}</p></div><span class="mono">${it.pts}/${it.max}</span></li>`).join('')}</ul>
      <label for="sim-note" class="note-l">Nota para tu diario (emociones, qué mejorar)</label>
      <textarea id="sim-note" rows="2" placeholder="Ej.: entré antes del cierre de la vela por ansiedad"></textarea>
      <div class="row"><button class="btn" id="note-save" type="button">Guardar nota</button><span class="muted small" id="note-ok"></span></div>
    </section>`;
    $('#note-save').onclick = () => { S.sims[SIM.recIdx].note = $('#sim-note').value.trim(); save(); $('#note-ok').textContent = 'Nota guardada en el diario.'; };
    $('#rp-start').onclick = () => { SIM.replay = 0; simDraw(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }

  // ---------- Progreso ----------
  const hm = (i, sess) => { const m = (sess === 'asia' ? 19 * 60 + 30 : 9 * 60) + i; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  const RULE = { time: 'Horario operativo', sweep: 'Toma de liquidez previa', ifvg: 'Entrada en IFVG', sl: 'Stop loss lógico', tp: 'Objetivo claro y R:R ≥ 1', risk: 'Riesgo 0,5–0,7 %', one: 'Un trade por sesión' };
  const hbars = (rows, fmtv, cls = '') => `<div class="hbars ${cls}">${rows.map((r) => `<div class="hb"><span class="hb-l">${r.l}</span><span class="hb-t"><i style="width:${r.w > 0 ? Math.max(2, Math.min(100, r.w)) : 0}%" class="${r.c || ''}"></i></span><b class="hb-v">${fmtv(r)}</b></div>`).join('')}</div>`;
  function vJournal(m) {
    const { cur, next } = currentLevel();
    m.appendChild(H(`<header class="page-head"><h1>Progreso</h1><p class="lead">Tu nivel, en qué fallas, tus estadísticas y el diario de sesiones.</p></header>`));
    m.appendChild(H(`<section class="card"><div class="card-head"><h2>Nivel ${cur.n} · ${cur.name}</h2><span class="muted small">${S.xp.toLocaleString('es-ES')} XP · racha ${streak()}</span></div>
      <div class="ladder">${levels().map((l) => `<span class="${l.n <= cur.n ? 'on' : ''}">${l.n}</span>`).join('')}</div>
      ${next ? `<p class="small muted">Para ${next.name}:</p><ul class="reqs">${next.reqs.map(([t, v, g, u = '']) => `<li class="${v >= g ? 'ok' : ''}"><span>${t}</span><b>${v}${u} / ${g}${u}</b></li>`).join('')}</ul>` : '<p>Nivel máximo. Mantén una sesión diaria para conservar la consistencia.</p>'}</section>`));
    // precisión por ejercicio
    m.appendChild(H(`<section class="card"><div class="card-head"><h2>Ejercicios</h2><span class="muted small">media de las últimas 3 rondas</span></div>${hbars(EXS.map((x) => { const h = S.ex[x.id]?.hist || []; const v = h.length ? Math.round(h.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, h.length)) : null; return { l: x.t, w: v ?? 0, v, c: v == null ? '' : v >= 85 ? 'g' : v >= 60 ? 'y' : 'p' }; }), (r) => (r.v == null ? '—' : r.v + ' %'))}</section>`));
    if (!S.sims.length) {
      m.appendChild(H('<section class="card empty"><h2>Todavía no hay sesiones</h2><p>Opera tu primera sesión simulada. Aquí verás tu nota de disciplina, el resultado en R, en qué reglas fallas y tus notas.</p><a class="btn pri" href="#practica">Ir a Practicar</a></section>'));
    } else {
      const tr = S.sims.filter((x) => x.trades.length);
      const wins = tr.filter((x) => x.R > 0).length;
      const totR = S.sims.reduce((a, b) => a + b.R, 0);
      m.appendChild(H(`<section class="tiles">
        <div class="tile"><span>Sesiones</span><b>${S.sims.length}</b><small class="sub">${S.sims.length - tr.length} sin operar</small></div>
        <div class="tile"><span>Acierto</span><b>${tr.length ? Math.round(wins / tr.length * 100) : 0}<small>%</small></b><small class="sub">${wins} de ${tr.length} trades</small></div>
        <div class="tile"><span>Resultado</span><b class="${totR >= 0 ? 'pos' : 'neg'}">${totR >= 0 ? '+' : ''}${totR.toLocaleString('es-ES', { maximumFractionDigits: 1 })}<small> R</small></b></div>
        <div class="tile"><span>Disciplina media</span><b>${Math.round(simAvg(S.sims.length))}<small>/100</small></b></div></section>`));
      // reglas que más fallas
      const withItems = tr.filter((x) => x.items && x.items.length);
      if (withItems.length) {
        const rows = Object.keys(RULE).map((k) => { const n = withItems.filter((x) => x.items.some((i) => i.k === k && !i.ok)).length; return { l: RULE[k], n, w: n / withItems.length * 100, c: n / withItems.length >= 0.4 ? 'p' : n ? 'y' : 'g' }; }).sort((a, b) => b.n - a.n);
        const top = rows[0];
        m.appendChild(H(`<section class="card"><div class="card-head"><h2>Lo que más fallas</h2><span class="muted small">${withItems.length} trades</span></div>
          ${top.n ? `<p class="warn-box"><b>${top.l}:</b> no la cumpliste en ${Math.round(top.w)} % de tus trades. Es lo primero a corregir.</p>` : '<p class="ok-box">Cumpliste todas las reglas en tus trades registrados.</p>'}
          ${hbars(rows, (r) => Math.round(r.w) + ' %')}</section>`));
      }
      // operas el setup del plan
      const aligned = tr.filter((x) => x.sysT != null && x.trades[0] && Math.abs(x.trades[0].t - x.sysT) <= 3 && (x.sysDir == null || x.sysDir === x.trades[0].dir));
      const noSys = S.sims.filter((x) => x.sysT == null), patient = noSys.filter((x) => !x.trades.length);
      m.appendChild(H(`<section class="card"><h2>¿Operas el setup del plan?</h2><div class="rows2">
        <div><b>${tr.length ? Math.round(aligned.length / tr.length * 100) : 0} %</b><span>de tus trades fueron en el mismo setup que el plan</span></div>
        <div><b>${noSys.length ? Math.round(patient.length / noSys.length * 100) : 0} %</b><span>de los días sin setup no operaste (paciencia)</span></div></div></section>`));
      // por franja y por día
      const fr = [[30, 60, 'Primeros 30 min'], [60, 90, '30 a 60 min'], [90, 120, '60 a 90 min'], [0, 30, 'Antes de abrir'], [120, 999, 'Fuera de la ventana']].map(([a, b, l]) => {
        const xs = tr.filter((x) => x.trades[0].t >= a && x.trades[0].t < b); const r = xs.reduce((q, w) => q + w.trades[0].R, 0);
        return { l, n: xs.length, r, w: xs.length / Math.max(1, tr.length) * 100, c: r >= 0 ? 'g' : 'p' };
      }).filter((x) => x.n);
      const wd = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const byD = wd.map((l, i) => { const xs = tr.filter((x) => new Date(x.at).getDay() === i); const r = xs.reduce((q, w) => q + w.R, 0); return { l, n: xs.length, r, w: xs.length / Math.max(1, tr.length) * 100, c: r >= 0 ? 'g' : 'p' }; }).filter((x) => x.n);
      const fmtR = (r) => `${r.n} · ${r.r >= 0 ? '+' : ''}${r.r.toLocaleString('es-ES', { maximumFractionDigits: 1 })} R`;
      if (tr.length) m.appendChild(H(`<section class="card"><h2>Cuándo entras</h2><p class="small muted">Desde la apertura de la ventana · número de trades y resultado</p>${hbars(fr, fmtR)}<h3 class="sub-t">Por día de la semana</h3>${hbars(byD, fmtR)}</section>`));
      const ch = H('<section class="card"><h2>Curva en R y disciplina</h2><div id="j-curve"></div></section>');
      m.appendChild(ch);
      requestAnimationFrame(() => {
        if (!$('#j-curve')) return;
        let e = 0; const v = [0, ...S.sims.map((x) => (e += x.R))];
        const d = [S.sims[0].score / 10, ...S.sims.map((x, i, a) => a.slice(Math.max(0, i - 4), i + 1).reduce((q, w) => q + w.score, 0) / Math.min(5, i + 1) / 10)];
        CH.lines($('#j-curve'), [{ v, c: 'info', label: `${e.toLocaleString('es-ES', { maximumFractionDigits: 1 })} R`, area: true }, { v: d, c: 'acc', dash: true, label: 'Disciplina ÷10' }], { h: 210, refs: [{ v: 0, c: 'mute' }], xlabel: 'Sesiones' });
      });
      const rows = S.sims.map((x, i) => ({ x, i })).reverse();
      m.appendChild(H(`<section class="card"><h2>Diario de sesiones</h2><div class="jlist">
        ${rows.map(({ x, i }) => `<div class="jrow"><div class="jr-top"><span class="mono muted">#${i + 1} · ${new Date(x.at).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}${x.sess === 'asia' ? ' · Asia' : ''}${x.mkt === 'ES' ? ' · ES' : ''}${x.real ? ' · real' : ''}</span><span class="pill ${x.score >= 85 ? 'ok' : x.score >= 50 ? 'mid' : 'no'}">${x.score}</span></div>
          <div class="jr-mid"><span>${x.trades.length ? x.trades.map((t) => `${t.dir > 0 ? 'Compra' : 'Venta'} ${hm(t.t, x.sess)} · ${t.reason}`).join('<br>') : 'Sin operar'}</span><b class="mono ${x.R > 0 ? 'pos' : x.R < 0 ? 'neg' : ''}">${x.R > 0 ? '+' : ''}${x.R.toLocaleString('es-ES', { maximumFractionDigits: 2 })} R</b></div>
          ${x.note ? `<p class="jr-note">${esc(x.note)}</p>` : ''}</div>`).join('')}
      </div></section>`));
    }
    const old = Date.now() - (S.lastBackup || 0) > 7 * DAY && (S.xp > 0 || S.sims.length);
    const io = H(`<details class="card" ${old ? 'open' : ''}><summary><b>Copia de seguridad</b><span class="muted small">${S.lastBackup ? 'última: ' + new Date(S.lastBackup).toLocaleDateString('es-ES') : 'nunca'}</span></summary><p class="small">Tu progreso se guarda solo en este navegador. Copia este texto y guárdalo (por ejemplo en Notas) para recuperarlo o llevarlo a otro dispositivo.</p>
      <textarea id="bk" rows="3" class="mono small" aria-label="Copia del progreso"></textarea><div class="row"><button class="btn pri" id="bk-copy" type="button">Copiar</button><button class="btn" id="bk-load" type="button">Cargar texto pegado</button></div><span class="small muted" id="bk-msg"></span></details>`);
    m.appendChild(io);
    $('#bk').value = JSON.stringify(S);
    $('#bk-copy').onclick = async () => {
      const ok = () => { S.lastBackup = Date.now(); save(); $('#bk').value = JSON.stringify(S); };
      try { await navigator.clipboard.writeText($('#bk').value); ok(); $('#bk-msg').textContent = 'Copiado. Pégalo en un lugar seguro.'; } catch (e) { $('#bk').select(); ok(); $('#bk-msg').textContent = 'Selecciónalo y cópialo manualmente.'; }
    };
    $('#bk-load').onclick = () => { try { const v = JSON.parse($('#bk').value); if (!v || typeof v !== 'object' || !('lessons' in v)) throw 0; S = Object.assign(blank(), v); save(); $('#bk-msg').textContent = 'Progreso cargado.'; } catch (e) { $('#bk-msg').textContent = 'El texto no es una copia válida del progreso.'; } };
  }

  // ---------- Arranque ----------
  let rz, lastW = window.innerWidth;
  window.addEventListener('resize', () => { moveInd(true); if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(() => { if (view === 'simulador') simDraw(); else if (view !== 'practica') render(); }, 250); });
  go(location.hash.slice(1));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInd(true));
  // Ocultar la pantalla de carga cuando la app y las fuentes están listas (mínimo ~1,9 s para que se vea la animación completa)
  const splash = document.getElementById('splash');
  if (splash) {
    const hide = () => { const wait = reduceMotion() ? 0 : Math.max(0, 1900 - (Date.now() - (window.__t0 || 0))); setTimeout(() => { splash.classList.add('done'); setTimeout(() => splash.remove(), 600); }, wait); };
    (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()).then(hide);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:' && /github\.io$/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo offline */ });
  }
})();
