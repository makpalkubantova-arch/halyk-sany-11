/* «8 миллиард: қаладан — әлемге» — тақта, оқушы телефоны, қонақ */
const D = DATA, Q = new URLSearchParams(location.search);
const MODE = Q.get("m") === "s" ? "stu" : Q.get("m") === "g" ? "guest" : "board";
const SITE = location.href.split("?")[0].split("#")[0];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = { k: "hs11:", get(k, d) { try { const v = localStorage.getItem(this.k + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(this.k + k, JSON.stringify(v)); } catch {} } };
const CL = { b: D.live.url + "/" + D.live.room,
  async get(p) { const r = await fetch(`${this.b}/${p}.json`); return r.json(); },
  put(p, v) { return fetch(`${this.b}/${p}.json`, { method: "PUT", body: JSON.stringify(v) }); } };
const uid = () => { let u = LS.get("uid"); if (!u) { u = Math.random().toString(36).slice(2, 10); LS.set("uid", u); } return u; };
const G = k => D.groups.find(g => g.k === k);
const C = id => D.countries.find(c => c.id === id) || D.extra.find(c => c.id === id);
const clsOf = e => e >= 60 ? "hi" : e >= 40 ? "mid" : "lo";
const K = k => D.classes.find(c => c.k === k);
const fmt = n => n.toLocaleString("ru-RU").replace(/,/g, " ");

/* ---------- QR: түрлі түсті дөңгелек нүктелер, жұмыр «көздер», ортасында белгі ---------- */
let QRN = 0;
const qrSvg = (text, o = {}) => { const c1 = o.c1 || "#0E7C9B", c2 = o.c2 || "#1F9D6B", eye = o.eye || "#10243E", logo = o.logo || "🌍";
  const q = qrcode(0, "H"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 3, S = n + m * 2, id = "qg" + (++QRN);
  const inF = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  const L = Math.ceil(n * .22), lo = Math.floor((n - L) / 2), inL = (x, y) => x >= lo && x < lo + L && y >= lo && y < lo + L;
  let d = ""; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x) && !inF(x, y) && !inL(x, y)) d += `<circle cx="${x + m + .5}" cy="${y + m + .5}" r=".47"/>`;
  const eyeAt = (x, y) => `<rect x="${x + m + .5}" y="${y + m + .5}" width="6" height="6" rx="2" fill="none" stroke="${eye}" stroke-width="1"/><rect x="${x + m + 2}" y="${y + m + 2}" width="3" height="3" rx="1" fill="url(#${id})"/>`;
  const cx = m + n / 2, r = L / 2 + .2;
  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${S}" height="${S}" rx="${m}" fill="#fff"/><g fill="url(#${id})">${d}</g>${eyeAt(0, 0)}${eyeAt(n - 7, 0)}${eyeAt(0, n - 7)}
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="#fff" stroke="url(#${id})" stroke-width=".6"/><text x="${cx}" y="${cx}" font-size="${L * .62}" text-anchor="middle" dominant-baseline="central">${logo}</text></svg>`; };
const stuUrl = SITE + "?m=s", guestUrl = SITE + "?m=g";

/* ---------- әлем картасы ---------- */
function mapSvg(fill, extraSvg = "") { let p = "";
  for (const [id, c] of Object.entries(MAP)) { const f = fill(id); p += `<path data-id="${id}" d="${c.d}"${f ? ` style="fill:${f.c}"${f.cls ? ` class="${f.cls}"` : ""}` : ""}><title>${esc((C(id) || {}).n || c.n)}</title></path>`; }
  return `<svg class="map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet"><rect width="1000" height="520" rx="16" fill="#EAF6FA"/>${p}${extraSvg}</svg>`; }

/* ---------- күй ---------- */
const S = {
  get i() { return LS.get("stage", 0); }, set i(v) { LS.set("stage", v); },
  get grp() { return LS.get("grp", {}); }, set grp(v) { LS.set("grp", v); },
  get pts() { return LS.get("pts", { meg: 0, gre: 0, fro: 0 }); }, set pts(v) { LS.set("pts", v); }
};
let CLOUD = { votes: {}, feet: {}, letters: {}, guests: {} };
async function pull() { try { const d = await CL.get(""); CLOUD = Object.assign({ votes: {}, feet: {}, letters: {}, guests: {} }, d || {}); onCloud(); } catch {} }
let onCloud = () => {};
function addPt(g, n = 1) { const p = S.pts; p[g] = Math.max(0, (p[g] || 0) + n); S.pts = p; drawScore(); flash(g, n); }
function flash(g, n) { const el = $(`.sg[data-g="${g}"] .pt`); if (!el) return; el.animate([{ transform: "scale(1.5)" }, { transform: "scale(1)" }], 400);
  if (n > 0) chime(); }
let AC; function chime(f = 660) { try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = "sine";
  g.gain.setValueAtTime(.15, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + .5); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .5); } catch {} }
const gpick = (key, cur) => `<span class="gp">${D.groups.map(g => `<button class="gpb${cur === g.k ? " on" : ""}" data-gp="${key}" data-g="${g.k}" style="--gc:${g.c}" title="${g.n}">${g.i}</button>`).join("")}</span>`;
const ptBtns = () => `<div class="ptrow">${D.groups.map(g => `<button class="btn" style="background:${g.c};box-shadow:0 4px 0 #0003" data-add="${g.k}">${g.i} +1</button>`).join("")}</div>`;

/* тізім өзгерсе, ескі топ/із белгілерін тазалау */
(() => { const v = D.roster.join("|"); if (LS.get("rosterV") !== v) { ["grp", "feet", "hw", "lab", "deb", "pts"].forEach(k => { try { localStorage.removeItem(LS.k + k); } catch {} }); LS.set("rosterV", v); } })();
/* ================= ТАҚТА ================= */
const TM = { left: 0, run: false, end: 0 };
function boardInit() {
  document.body.className = "board";
  document.body.innerHTML = `<div id="stage"><header class="top"><div class="brand"><span class="logo">🌍</span><div><b>${esc(D.lesson.title)}</b><small>${esc(D.lesson.subject)} · ${esc(D.lesson.date)}</small></div></div>
    <nav class="chips" id="chips"></nav><div class="timer" id="timer"><b id="tt">0:00</b><button id="tgo">▶</button><button id="tre">↺</button></div>
    <button class="tb" id="vidB" title="Түсіндірме бейнеролик">🎬 Видео</button><button class="tb" id="qrB" title="QR">📱</button><button class="tb" id="fsB">⛶</button></header>
    <section class="shead" id="shead"></section><main class="body" id="body"></main>
    <footer class="score"><button class="nav" id="prev">‹</button><div id="sgs" style="display:flex;gap:12px;flex:1"></div><button class="nav" id="next">›</button></footer></div>
    <div class="modal" id="modal" hidden><div class="mbox"><button class="mx" id="mx">✕</button><div id="mc"></div></div></div>`;
  const fit = () => { const k = Math.min(innerWidth / 1600, innerHeight / 900); $("#stage").style.transform = `translate(-50%,-50%) scale(${k})`; }; addEventListener("resize", fit); fit();
  $("#prev").onclick = () => go(S.i - 1); $("#next").onclick = () => go(S.i + 1);
  $("#fsB").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
  $("#mx").onclick = () => { $("#modal").hidden = true; $("#mc").innerHTML = ""; $(".mbox").style.maxWidth = ""; };
  $("#vidB").onclick = () => videoModal(false);
  $("#qrB").onclick = () => modal(`<h2 style="margin:0 0 6px">📱 Телефоны барлар үшін</h2><div style="display:flex;gap:24px;justify-content:center">
    <div class="qr">${qrSvg(stuUrl, { logo: "🎒" })}<b>Оқушы</b></div><div class="qr">${qrSvg(guestUrl, { c1: "#D99A1E", c2: "#E8573A", logo: "👥" })}<b>Қонақ</b></div></div>
    <p class="mut small">Телефон міндетті емес: барлық тапсырма тақтада, картада, жұмыс парағында орындалады.</p>`);
  $("#tgo").onclick = () => { if (TM.run) { TM.left = Math.max(0, TM.end - Date.now()); TM.run = false; } else { TM.end = Date.now() + TM.left; TM.run = true; } tick(); };
  $("#tre").onclick = () => { TM.run = false; TM.left = D.stages[S.i].m * 60000; tick(); };
  setInterval(tick, 250);
  document.addEventListener("click", e => { const a = e.target.closest("[data-add]"); if (a) addPt(a.dataset.add, +(a.dataset.n || 1)); });
  addEventListener("keydown", e => { if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return; if (e.key === "ArrowRight") go(S.i + 1); if (e.key === "ArrowLeft") go(S.i - 1); });
  setInterval(pull, 4000); pull(); go(S.i);
}
/* түсіндірме бейнеролик: 4 бөлім, әр бөлім соңында өзі тоқтайды */
const VID = [[0, 29.5, "1 · Халық саны қалай өсті", "time"], [29.5, 48.5, "2 · Себеп → салдар", "chain"], [48.5, 61, "3 · EPI деген не", "lab"], [61, 96.5, "4 · Қорытынды", "debate"]];
function videoModal(auto) {
  modal(`<h2 style="margin:0 0 8px">🎬 Жаңа тақырып: түсіндірме</h2><video id="vid" src="tusindiru.mp4?v=20261116g" controls playsinline preload="auto" style="width:100%;border-radius:14px;background:#0B1B2E"></video>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center">${VID.map((v, k) => `<button class="tb" data-seg="${k}">${v[2]}</button>`).join("")}</div>
    <p class="mut small" style="margin:8px 0 0">Бөлімді бассаңыз, сол жерден басталып, бөлім соңында өзі тоқтайды. Диктор дауысымен (қазақша).</p>`);
  $(".mbox").style.maxWidth = "1000px";
  const v = $("#vid"); let stop = null;
  const seek = t => { if (v.readyState >= 1) v.currentTime = t; else v.addEventListener("loadedmetadata", () => v.currentTime = t, { once: true }); };
  const play = k => { stop = VID[k][1]; seek(VID[k][0] + 0.05); v.play().catch(() => {}); document.querySelectorAll("[data-seg]").forEach(b => b.style.background = +b.dataset.seg === k ? "#E3F3F8" : "#fff"); };
  const iv = setInterval(() => { if (!document.body.contains(v)) return clearInterval(iv); if (stop !== null && v.currentTime >= stop - 0.5) { v.pause(); stop = null; } }, 40);
  document.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => play(+b.dataset.seg));
  const cur = VID.findIndex(x => x[3] === D.stages[S.i].id); if (cur >= 0) { if (auto === true) play(cur); else { seek(VID[cur][0] + 0.05); document.querySelector(`[data-seg="${cur}"]`).style.background = "#E3F3F8"; } }
}
function modal(h) { $("#mc").innerHTML = h; $("#modal").hidden = false; }
function tick() { const ms = TM.run ? Math.max(0, TM.end - Date.now()) : TM.left; if (TM.run && ms <= 0) { TM.run = false; TM.left = 0; chime(440); }
  const s = Math.ceil(ms / 1000); $("#tt").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  $("#timer").classList.toggle("warn", TM.run && s <= 30); $("#tgo").textContent = TM.run ? "⏸" : "▶"; }
function drawScore() { const p = S.pts, gr = S.grp; $("#sgs").innerHTML = D.groups.map(g => { const n = Object.values(gr).filter(v => v === g.k).length;
  return `<div class="sg" data-g="${g.k}" style="--gc:${g.c};--gs:${g.soft}"><span class="gi">${g.i}</span><div><b>${g.n}</b><small>${n} оқушы</small></div>
    <button data-add="${g.k}" data-n="-1">−</button><span class="pt">${p[g.k] || 0}</span><button data-add="${g.k}">+</button></div>`; }).join(""); }
let stop = () => {};
function go(i) { i = Math.max(0, Math.min(D.stages.length - 1, i)); const prevId = (D.stages[S.i] || {}).id; stop(); stop = () => {}; onCloud = () => {}; S.i = i; const st = D.stages[i];
  /* үй тапсырмасынан кейін жаңа тақырып бейнеролигі өзі ашылады */
  if (st.id === "time" && prevId === "hw") setTimeout(() => { if (S.i === i && $("#modal").hidden) videoModal(true); }, 450);
  TM.run = false; TM.left = st.m * 60000; tick();
  $("#chips").innerHTML = D.stages.map((s, k) => `<button class="chip${k === i ? " on" : k < i ? " done" : ""}" data-go="${k}"><b>${k + 1}</b>${esc(s.t)}</button>`).join("");
  $$("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
  $("#shead").innerHTML = `<span class="n">${i + 1}</span><div><h1>${esc(st.t)}</h1><div class="meta"><span class="tag">👥 ${esc(st.type)}</span><span class="tag t">⏱ ${st.m} мин</span><span class="tag">🧭 ${esc(st.method)}</span><span class="tag tools">${st.tools.join(" ")}</span></div></div>${VID.some(x => x[3] === st.id) ? `<button class="btn sun" id="vidS" style="margin-left:auto;font-size:19px;padding:12px 22px">🎬 Бейнеролик · ${VID.findIndex(x => x[3] === st.id) + 1}-бөлім</button>` : ""}`;
  if ($("#vidS")) $("#vidS").onclick = () => videoModal(true);
  drawScore(); $("#body").innerHTML = ""; R[st.id](); }

const R = {};
/* 1. Әлем тыныс алып тұр */
R.breath = () => {
  const base = 8161e6, t0 = Date.UTC(2024, 6, 1), rate = 69.5e6 / (365.25 * 864e5), start = Date.now();
  const big = ["356", "156", "840", "360", "586", "566", "076", "050", "643", "231", "392", "818"];
  const dots = big.map((id, k) => `<circle class="dot" cx="${MAP[id].c[0]}" cy="${MAP[id].c[1]}" r="7" style="animation-delay:${k * .17}s"/>`).join("");
  $("#body").innerHTML = `<div style="display:grid;grid-template-columns:1fr 1.15fr;gap:20px;height:100%">
    <div><div class="card"><div class="mut" style="font-weight:800">Дүниежүзі халқы дәл қазір (шамамен, БҰҰ бағалауы бойынша)</div>
      <div class="counter" id="cnt">—</div><div class="plus">Сабақ басталғалы: <span id="since">+0</span> адам</div>
      <div class="mut small">Секундына ≈ 2 адам қосылады · 40 минутта ≈ 5 300 адам — бір шағын ауылдың халқы</div></div>
      <div class="qbig">Біз Экосканермен <b>Астананың</b> ауасы мен суын өлшедік. Ал 8 миллиард адам бүкіл <b>Жер шарының</b> «тынысын» қалай өзгертеді? Халық көп ел — міндетті түрде лас ел ме?</div>
      <div style="display:flex;gap:10px;margin-top:14px"><button class="btn" id="tpc">🎯 Тақырып пен мақсатты ашу</button></div>
      <div id="tpx"></div></div>
    <div class="card" style="padding:8px;display:flex;flex-direction:column">${mapSvg(() => null, dots)}<div class="mut small" style="padding:2px 8px">● — халқы ең көп 12 ел. Глобусты айналдырып, осы елдерді тауып көрейік.</div></div></div>`;
  const draw = () => { const n = Math.round(base + (Date.now() - t0) * rate); $("#cnt").innerHTML = fmt(n); $("#since").textContent = "+" + fmt(Math.round((Date.now() - start) * rate)); };
  draw(); const h = setInterval(draw, 200); stop = () => clearInterval(h);
  $("#tpc").onclick = () => $("#tpx").innerHTML = `<div class="card" style="margin-top:12px;border-left:8px solid var(--leaf)"><b>Тақырып:</b> ${esc(D.lesson.topic)}<br><b>Мақсат:</b> ${esc(D.lesson.goal)}
    <div class="small" style="margin-top:6px"><b>Бағалау критерийі:</b> ① халық санының өзгерісін түсіндіреді; ② халық саны мен қоршаған орта сапасының байланысын дәлелдейді; ③ елдерді EPI бойынша үш топқа жіктейді.</div></div>`;
};
/* 2. Топқа бөліну: таңдау бойынша */
R.groups = () => { let sel = null;
  const draw = () => { const gr = S.grp, free = D.roster.filter(n => !gr[n]);
    $("#body").innerHTML = `<div style="display:flex;flex-direction:column;height:100%"><div class="card" style="margin-bottom:12px;padding:10px 16px;flex:none"><b>Сұрақ:</b> «Қай аймақта өмір сүрер едің?» Атыңды бас → өзің таңдаған аймақты бас. Бұл аймақтың 8 елін сабақ бойы зерттейсің.
      <div class="pool" style="margin:8px 0 0">${free.map(n => `<button class="nm${sel === n ? " sel" : ""}" data-n="${esc(n)}">${esc(n)}</button>`).join("") || `<span class="mut">✅ Бәрі таңдады</span>`}</div></div>
      <div class="gcards" style="flex:1;min-height:0;height:auto">${D.groups.map(g => `<div class="gcard" data-gc="${g.k}" style="--gc:${g.c};--gs:${g.soft}">
        <div style="display:flex;gap:12px;align-items:center"><div class="pic" style="height:90px;width:90px;font-size:56px;flex:0 0 90px">${g.i}</div><div><h2 style="margin:0">${g.n}</h2><p>${g.d}</p></div></div>
        <p class="small" style="margin-top:8px"><b>Елдері:</b> ${D.countries.filter(c => c.g === g.k).map(c => c.n).join(", ")}</p>
        <div class="names">${Object.keys(gr).filter(n => gr[n] === g.k).map(n => `<button class="nm" data-back="${esc(n)}">${esc(n)}</button>`).join("")}</div></div>`).join("")}</div></div>`;
    $$("[data-n]").forEach(b => b.onclick = () => { sel = sel === b.dataset.n ? null : b.dataset.n; draw(); });
    $$("[data-gc]").forEach(c => c.onclick = e => { if (e.target.closest("[data-back]") || !sel) return; const gr = S.grp; gr[sel] = c.dataset.gc; S.grp = gr; sel = null; chime(720); draw(); drawScore(); });
    $$("[data-back]").forEach(b => b.onclick = () => { const gr = S.grp; delete gr[b.dataset.back]; S.grp = gr; draw(); drawScore(); }); };
  draw(); };
/* 3. Үй тапсырмасы: көрсеткіш светофоры */
R.hw = () => { const st = LS.get("hw", {});
  const draw = () => { $("#body").innerHTML = `<div class="hwg"><div><div class="card" style="margin-bottom:10px;padding:10px 16px">Экосканердегі жіктеу картаңды аш (📒). Қай топ жауап береді — белгісін бас, сосын жауапты таңда.</div>
    ${D.hw.map((h, k) => { const s = st[k] || {}; return `<div class="card hwc" style="margin-bottom:10px;padding:12px 16px"><div style="display:flex;justify-content:space-between;align-items:center"><b>${k + 1}. ${esc(h.t)}</b>${gpick("h" + k, s.g)}</div>
      <div class="opts">${h.o.map(o => `<button class="opt${s.ok && o === h.a ? " ok" : ""}" data-h="${k}" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>`; }).join("")}</div>
    <div><div class="card" style="border-top:8px solid var(--sun)"><h3>🌉 Көпір: Астанадан — әлемге</h3>
      <div style="display:flex;align-items:end;gap:30px;height:230px;padding:10px 20px">
        <div style="text-align:center"><div style="width:90px;height:${Math.max(6, Math.round(150 * 1.6 / 33))}px;background:var(--sea);border-radius:8px 8px 0 0;margin:auto"></div><b>Астана</b><div class="mut small">≈ 1,6 млн</div></div>
        <div style="text-align:center"><div style="width:90px;height:150px;background:var(--red);border-radius:8px 8px 0 0;margin:auto"></div><b>Дели</b><div class="mut small">≈ 33 млн</div></div>
        <div style="flex:1;font-size:20px;font-weight:700">Делиде адам Астанадан ~20 есе көп. Ауа, су, қалдық қандай болар еді? Неге?</div></div>
      <button class="btn ghost" id="hwk">Жауап</button><div id="hwa"></div></div>
      <div class="card" style="margin-top:12px"><h3>📒 107-б., 1-тапсырма: кестені орындаған топқа</h3>${ptBtns()}</div></div></div>`;
    $$("[data-gp]").forEach(b => b.onclick = () => { const k = b.dataset.gp.slice(1); st[k] = Object.assign(st[k] || {}, { g: b.dataset.g }); LS.set("hw", st); draw(); });
    $$("[data-h]").forEach(b => b.onclick = () => { const k = b.dataset.h, h = D.hw[k], s = st[k] || {}; if (s.ok) return;
      if (b.dataset.o === h.a) { s.ok = 1; st[k] = s; LS.set("hw", st); if (s.g) addPt(s.g); else chime(); draw(); } else b.classList.add("no"); });
    $("#hwk").onclick = () => $("#hwa").innerHTML = `<p style="font-size:18px;margin:8px 0 0">Халық тығыз → көлік, жылу, өнеркәсіп, қалдық көп → ауадағы ластану нормадан бірнеше есе асады (Дели — ауасы ең лас мегаполистердің бірі). <b>Бірақ</b> бәрі тек халық санына байланысты ма? — Бүгін дәлелдейміз.</p>`; };
  draw(); };
/* 4. Халықтың уақыт таспасы */
R.time = () => { const T = D.timeline; let k = LS.get("tlk", 7); const yr = y => 70 + T.findIndex(t => t[0] === y) * (1400 / (T.length - 1));
  const draw = () => { $("#body").innerHTML = `<div class="card" style="height:100%"><div style="display:flex;justify-content:space-between"><b style="font-size:20px">Жоғарғы сан — миллиард адам. Сырғытпаны жылжыт: әр миллиард неше жылда қосылды?</b><span class="tag">📒 Дәптерге график сал: x — жыл, y — млрд</span></div>
    <div class="tl">${T.map((t, j) => `<div class="tlbar${t[0] > 2026 ? " fut" : ""}${j > k ? " off" : ""}" style="left:${yr(t[0])}px;height:${t[1] * 24}px"><span>${String(t[1]).replace(".", ",")}</span></div>
      <div class="tlyear" style="left:${yr(t[0])}px;${j > k ? "opacity:.2" : ""}">${t[0]}</div><div class="tlnote" style="left:${yr(t[0])}px;${j > k ? "opacity:0" : ""}">${t[2]}</div>`).join("")}</div>
    <input type="range" class="range" min="0" max="${T.length - 1}" value="${k}" id="rg">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px"><div class="card" style="background:#F3FAFB"><b>❓ Неге 1-миллиардқа 123 жыл, ал 8-ге 11 жыл ғана керек болды?</b><div id="a1"></div><button class="btn ghost" data-a="a1">Жауап</button></div>
    <div class="card" style="background:#F3FAFB"><b>❓ БҰҰ болжамы: 2080-жылдары шың, сосын азаяды. Неге?</b><div id="a2"></div><button class="btn ghost" data-a="a2">Жауап</button></div></div>${ptBtns()}</div>`;
    $("#rg").oninput = e => { k = +e.target.value; LS.set("tlk", k); draw(); };
    $$("[data-a]").forEach(b => b.onclick = () => { $("#" + b.dataset.a).innerHTML = b.dataset.a === "a1" ? `<p>Медицина, вакцина, азық-түлік көбейді → өлім азайды, өмір ұзарды, ал туу көп күйінде қалды (демографиялық жарылыс).</p>` : `<p>Урбанизация, білім, әйелдердің жұмысқа шығуы → бала саны азаяды (демографиялық ауысу). 63 елде халық саны шыңына жетіп қойды.</p>`; b.remove(); }); };
  draw(); };
/* 5. Себеп → салдар (жұппен) */
R.chain = () => { const sh = LS.get("chain", []);
  const draw = () => { $("#body").innerHTML = `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:18px"><div>${D.chain.map((c, k) => `<div class="ch"><div class="c">${esc(c[0])}</div><div class="ar">→</div><div class="e${sh.includes(k) ? " show" : ""}" data-e="${k}">${esc(c[1])}</div></div>`).join("")}</div>
    <div><div class="card" style="border-top:8px solid var(--sea)"><h3>👫 Жұппен · 📖 оқулық · 📄 №1 парақ</h3><ol style="margin:0;padding-left:22px;font-size:18px"><li>Оқулықтан халық саны мен табиғатқа әсер туралы абзацты оқыңдар.</li><li>№1 парақтағы тізбектің бос ұяшықтарын толтырыңдар.</li><li>Жұбыңмен салыстыр, біреуің тақтада оқисың.</li></ol>
      <p class="mut small">Тақтада: сұр ұяшықты бассаң — жауап ашылады.</p></div><div class="card" style="margin-top:12px"><h3>✅ Тапсырған жұптың тобына</h3>${ptBtns()}</div></div></div>`;
    $$("[data-e]").forEach(e => e.onclick = () => { const k = +e.dataset.e; if (!sh.includes(k)) { sh.push(k); LS.set("chain", sh); chime(600 + k * 60); draw(); } }); };
  draw(); };
/* 6. Жіктеу зертханасы */
R.lab = () => { let tab = LS.get("labtab", "meg"), sel = null, sum = false; const pl = LS.get("lab", {});
  const fill = id => { if (pl[id]) return { c: K(pl[id]).c }; if (id === sel) return { c: "#9FD3E1", cls: "pulse" }; const c = D.countries.find(c => c.id === id); if (c && c.g === tab) return { c: "#C6D9DF", cls: "cand" }; if (sum && C(id)) return { c: K(clsOf(C(id).epi)).c + "99" }; return null; };
  const draw = () => { const g = G(tab), list = D.countries.filter(c => c.g === tab), done = Object.keys(pl).length;
    $("#body").innerHTML = `<div class="lab"><div class="card" style="padding:8px;display:flex;flex-direction:column">${mapSvg(fill)}
      <div class="legend">${D.classes.map(c => `<span><i style="background:${c.c}"></i>${c.n} (${c.sub})</span>`).join("")}<span class="mut">· жіктелді: ${done}/24</span></div>
      <div id="gq" class="globeq"></div></div>
      <div><div class="tabs">${D.groups.map(x => `<button class="tab${x.k === tab ? " on" : ""}" style="--gc:${x.c}" data-t="${x.k}">${x.i} ${x.n}</button>`).join("")}</div>
      <div class="small mut" style="margin-bottom:6px">🗺️ Алдымен №2 парақтағы контур картаға боя → 🌍 глобустан тап → тақтада: елді бас, сосын себетті бас.</div>
      <div class="ccards">${list.map(c => `<button class="cc${sel === c.id ? " sel" : ""}${pl[c.id] ? " done" : ""}" data-c="${c.id}"><div><b>${esc(c.n)}</b><small>👥 ${String(c.pop).replace(".", ",")} млн · ${c.r}-орын</small></div><span class="e">${String(c.epi).replace(".", ",")}</span></button>`).join("")}</div>
      <div class="baskets">${D.classes.map(k => `<button class="bk" data-k="${k.k}" style="--kc:${k.c}"><h4>${k.n}</h4><small>${k.sub}</small><div class="in">${list.filter(c => pl[c.id] === k.k).map(c => `<span>${esc(c.n)}</span>`).join("")}</div></button>`).join("")}</div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn sun" id="sumB">💡 Қорытынды</button><button class="btn ghost" id="rsB">↺</button></div></div></div>`;
    if (sel) { const c = C(sel); $("#gq").innerHTML = `<span style="font-size:30px">🌍</span><b>Глобустан «${esc(c.n)}» елін тап: қай материкте? Қай белдеуде? Мұхитқа шыға ма?</b>`; }
    $$("[data-t]").forEach(b => b.onclick = () => { tab = b.dataset.t; LS.set("labtab", tab); sel = null; draw(); });
    $$("[data-c]").forEach(b => b.onclick = () => { if (pl[b.dataset.c]) return; sel = b.dataset.c; draw(); });
    $$("[data-k]").forEach(b => b.onclick = () => { if (!sel) return; const c = C(sel);
      if (clsOf(c.epi) === b.dataset.k) { pl[sel] = b.dataset.k; LS.set("lab", pl); addPt(c.g); sel = null; draw(); } else { b.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], 300); chime(220); } });
    $("#rsB").onclick = () => { if (!confirm("Зертхананы тазалау керек пе?")) return; for (const k in pl) delete pl[k]; LS.set("lab", pl); sum = false; draw(); };
    $("#sumB").onclick = () => { sum = true; draw(); modal(`<h2 style="margin-top:0">💡 Не байқадық?</h2><div style="text-align:left;font-size:19px">
      <p>• Халқы ең көп елдер (Үндістан, Қытай, Индонезия, Пәкістан, Бангладеш) — <b style="color:var(--red)">төмен сапа</b>.</p>
      <p>• Бірақ <b>Жапония</b> (124 млн, тығыз) — <b style="color:var(--leaf)">жоғары сапа</b>. Ал халқы аз <b>Моңғолия</b> — төмен.</p>
      <p>• <b>Қазақстан</b> (41,3) — орташа сапа, 177 елдің ішінде 84-орын.</p>
      <p><b>Демек:</b> халық саны — маңызды фактор, бірақ экономика, технология және табиғатты қорғау саясаты да шешеді.</p></div>`); }; };
  draw(); };
/* 7. Пікір таразысы */
R.debate = () => { const dv = LS.get("deb", { yes: 0, no: 0, shy: [], shn: [], out: 0 });
  const draw = () => { const cv = Object.values(CLOUD.votes || {}), y = dv.yes + cv.filter(v => v === "yes").length, n = dv.no + cv.filter(v => v === "no").length, t = Math.max(1, y + n);
    $("#body").innerHTML = `<div class="card" style="display:flex;align-items:center;gap:14px;font-size:28px;font-weight:900;margin-bottom:12px"><span style="flex:1;text-align:center">⚖️ ${esc(D.debate.q)}</span><span class="qmini" title="Оқушы дауысы">${qrSvg(stuUrl, { logo: "🎒" })}<small>🎒 телефонмен дауыс</small></span></div>
    <div class="deb"><div class="card side" style="border-top:8px solid var(--red)"><h3>✋ Иә, басты себеп</h3>${D.debate.yes.map((a, k) => `<div class="arg${dv.shy.includes(k) ? " show" : ""}" data-y="${k}">${esc(a)}</div>`).join("")}</div>
      <div class="card side" style="border-top:8px solid var(--leaf)"><h3>🙅 Жоқ, жалғыз себеп емес</h3>${D.debate.no.map((a, k) => `<div class="arg${dv.shn.includes(k) ? " show" : ""}" data-n="${k}">${esc(a)}</div>`).join("")}</div></div>
    <div class="card" style="margin-top:12px"><div class="votes"><button class="btn" style="background:var(--red)" data-v="yes">Иә +1</button><b style="color:var(--red)">${y}</b>
      <div class="vbar"><i style="width:${y / t * 100}%;background:var(--red)"></i><i style="width:${n / t * 100}%;background:var(--leaf)"></i></div><b style="color:var(--leaf)">${n}</b><button class="btn" style="background:var(--leaf)" data-v="no">Жоқ +1</button></div>
      <div class="small mut" style="margin-top:6px">Қол көтеріп дауыс беріңдер (телефоны барлар — QR арқылы). Әр топ өз аймағының 1 дерегімен дәлел айтады → ${D.groups.map(g => `<button class="gpb" style="--gc:${g.c}" data-add="${g.k}">${g.i}+1</button>`).join(" ")}</div>
      <button class="btn sun" id="outB" style="margin-top:8px">🧩 Қорытынды</button><div class="out${dv.out ? " show" : ""}">${esc(D.debate.out)}</div></div>`;
    $$("[data-y]").forEach(e => e.onclick = () => { dv.shy.push(+e.dataset.y); LS.set("deb", dv); draw(); });
    $$("[data-n]").forEach(e => e.onclick = () => { dv.shn.push(+e.dataset.n); LS.set("deb", dv); draw(); });
    $$("[data-v]").forEach(b => b.onclick = () => { dv[b.dataset.v]++; LS.set("deb", dv); draw(); });
    $("#outB").onclick = () => { dv.out = 1; LS.set("deb", dv); draw(); }; };
  onCloud = draw; draw(); };
/* 8. Өзіңді тексер (жеке) */
R.solo = () => { let key = false;
  const T = [["A", "Кестедегі 6 елді EPI бойынша үш топқа жікте: Финляндия 71,0 · Үндістан 22,5 · Қазақстан 41,3 · Жапония 63,2 · Мали 23,6 · Бразилия 48,3. Контур картаға үш түспен боя.", "Жоғары: Финляндия, Жапония · Орташа: Қазақстан, Бразилия · Төмен: Үндістан, Мали"],
    ["B", "Қазақстан қай топқа жатады? EPI-ді төмендететін 2 себеп пен көтеретін 1 себеп жаз (Экосканердегі Астана деректерін қолдан).", "Орташа (41,3; 84-орын). Төмендетеді: көмір жылу орталықтары, қала ауасындағы ластану, су сапасы (Есіл 5-класс). Көтереді: халық тығыздығы аз, қорғалатын аумақтар."],
    ["C", "Халқы көп, бірақ сапасы жоғары ел және халқы аз, бірақ сапасы төмен ел тап. Неге солай? 4–5 сөйлеммен дәлелде.", "Мысалы: Жапония (124 млн, 63,2) — технология, қатаң экологиялық заң, тазарту; Моңғолия (3,5 млн, 34,2) — көмірмен жылыту, Ұлан-Батыр ауасы, шөлейттену. Қорытынды: халық саны жалғыз фактор емес."]];
  const draw = () => { $("#body").innerHTML = `<div class="card" style="margin-bottom:12px;padding:10px 16px">📄 №3 парақ · өз деңгейіңді таңда: <b>A</b> — білу, <b>B</b> — қолдану, <b>C</b> — талдау. 🗺️ Контур карта мен оқулықты қолдануға болады. Орындап болған соң парақты топ хатшысына тапсыр.</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${T.map(t => `<div class="card" style="border-top:8px solid var(--sea)"><h3><span class="who" style="margin:0 8px 0 0">${t[0]}</span>деңгей</h3><p style="font-size:19px">${esc(t[1])}</p>
      ${key ? `<div style="background:#EAF7EF;border-radius:12px;padding:10px;font-size:16px"><b>🔑</b> ${esc(t[2])}</div>` : ""}</div>`).join("")}</div>
    <div style="display:flex;gap:10px;margin-top:14px;align-items:center"><button class="btn ${key ? "ghost" : "sun"}" id="kB">${key ? "🙈 Кілтті жасыру" : "🔑 Кілтті көрсету (өзара тексеру)"}</button>${ptBtns()}</div>`;
    $("#kB").onclick = () => { key = !key; draw(); }; };
  draw(); };
const qrCard = (who, title, sub) => { const s = who === "g" ? { u: guestUrl, c1: "#D99A1E", c2: "#E8573A", logo: "👥", bc: "#D99A1E" } : { u: stuUrl, c1: "#0E7C9B", c2: "#1F9D6B", logo: "🎒", bc: "#1F9D6B" };
  return `<div class="qrc" style="--bc:${s.bc}"><div class="qi">${qrSvg(s.u, s)}</div><div><b>${title}</b><span>${sub}</span></div></div>`; };
/* 0. Сәлемдесу: «Әлем — бір шаңырақ» (ұлттардың тулары) + «Көңіл-күй индексі» */
R.hello = () => { const said = LS.get("flagsd", []), md = LS.get("mood", { g: 0, y: 0, r: 0 }); let cur = null, open = false;
  const draw = () => { const tot = md.g + md.y + md.r, idx = tot ? Math.round(D.moods.reduce((a, m) => a + md[m.k] * m.v, 0) / tot) : null;
    const col = idx == null ? "#5B6B80" : idx >= 60 ? "#1F9D6B" : idx >= 40 ? "#E3A21A" : "#D9452B", F = cur != null ? D.flags[cur] : null;
    $("#body").innerHTML = `<div style="display:grid;grid-template-columns:1.45fr 1fr;gap:18px;height:100%">
    <div class="card" style="position:relative;display:flex;flex-direction:column"><div style="display:flex;align-items:center;gap:12px"><h3 style="margin:0;flex:1">🌍 Әлем — бір шаңырақ: туды тап!</h3><button class="btn sun" id="dice">🎲 Кездейсоқ ту</button></div>
      <div class="mut small" style="margin:4px 0 8px">Жерде 195-тен астам ел, 8 миллиардтан астам адам. Қазақстанда 130-дан астам ұлттың өкілі бір шаңырақ астында тұрады. Ту шықса — сынып елді, астанасын, халқын табады.</div>
      <div class="fwall">${D.flags.map((f, k) => `<button class="fl${said.includes(k) ? " on" : ""}${k === cur ? " cur" : ""}" data-fl="${k}" title="${esc(f.n)}"><img src="flags/${f.c}.svg" alt=""></button>`).join("")}</div>
      ${F ? `<div class="fbig"><img src="flags/${F.c}.svg" alt=""><div>${open ? `<b>${esc(F.n)}</b><span>🏛️ Астанасы: ${esc(F.cap)}</span><span>👥 Халқы: ${esc(F.p)} (шамамен)</span>` : `<b>Бұл қай ел?</b><span>Астанасы? Халқы қанша?</span><button class="btn" id="opn">Ашу</button>`}</div><button class="mx" id="cls">✕</button></div>` : ""}</div>
    <div class="card"><h3>🌡️ Сыныптың «көңіл-күй индексі»</h3><div class="mut small">EPI секілді: 0–100. Қол көтергендерді санап, батырманы басыңыз.</div>
      <div style="display:grid;gap:8px;margin-top:8px">${D.moods.map(m => `<div class="mrow" style="--mc:${m.c}"><div><b>${m.n}</b><small>${m.d}</small></div><button data-md="${m.k}" data-n="-1">−</button><span>${md[m.k]}</span><button data-md="${m.k}" data-n="1">+</button></div>`).join("")}</div>
      <div style="text-align:center;margin-top:6px"><span class="mut" style="font-weight:800">Бүгінгі индекс: </span><b style="font-size:54px;line-height:1;color:${col}">${idx ?? "—"}</b>
      <div class="small" style="font-weight:800;color:${col}">${idx == null ? "" : idx >= 60 ? "Жоғары сапа — сабақты бастаймыз! 🚀" : idx >= 40 ? "Орташа — сабақ барысында көтереміз! 💪" : "Төмен — бір-бірімізге көмектесеміз! 🤝"}</div></div>
      ${qrCard("g", "👥 Құрметті қонақтар!", "Сканерлеңіз: сабақ жоспары және бағалау")}</div></div>`;
    const pick = k => { cur = k; open = false; if (!said.includes(k)) said.push(k); LS.set("flagsd", said); chime(560 + (k % 8) * 50); draw(); };
    $$("[data-fl]").forEach(b => b.onclick = () => pick(+b.dataset.fl));
    $("#dice").onclick = () => { const rest = D.flags.map((_, k) => k).filter(k => !said.includes(k)); const pool = rest.length ? rest : D.flags.map((_, k) => k); pick(pool[Math.floor(Math.random() * pool.length)]); };
    if ($("#opn")) $("#opn").onclick = () => { open = true; chime(880); draw(); };
    if ($("#cls")) $("#cls").onclick = () => { cur = null; draw(); };
    $$("[data-md]").forEach(b => b.onclick = () => { const k = b.dataset.md; md[k] = Math.max(0, md[k] + +b.dataset.n); LS.set("mood", md); draw(); }); };
  draw(); };
/* 10. Бағалау · рейтинг */
R.score = () => { const p = S.pts, gr = S.grp, srt = [...D.groups].sort((a, b) => (p[b.k] || 0) - (p[a.k] || 0)), mx = Math.max(1, ...D.groups.map(g => p[g.k] || 0)), med = ["🥇", "🥈", "🥉"];
  const gs = Object.values(CLOUD.guests || {}).filter(x => x && x.s != null);
  $("#body").innerHTML = `<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;height:100%"><div class="card"><h3>🏆 Топтардың рейтингі</h3>
    ${srt.map((g, k) => `<div style="display:flex;align-items:center;gap:14px;margin:14px 0"><span style="font-size:44px">${(p[g.k] || 0) > 0 ? med[k] : "▫️"}</span><span style="font-size:40px">${g.i}</span>
      <div style="flex:1"><b style="font-size:24px;color:${g.c}">${g.n}</b><div style="height:26px;background:#EEF2F4;border-radius:14px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(p[g.k] || 0) / mx * 100}%;background:${g.c};border-radius:14px;transition:width 1s"></div></div>
      <small class="mut">${Object.values(gr).filter(v => v === g.k).length} оқушы</small></div><b style="font-size:46px;color:${g.c}">${p[g.k] || 0}</b></div>`).join("")}</div>
    <div><div class="card"><h3>📄 Жеке ұпай → балл</h3><div class="small mut">Жұмыс парақтары мен тақтадағы жауаптар бойынша · барлығы 10 ұпай</div>
      <table class="cv"><tr><th>Ұпай</th><td>10</td><td>9</td><td>8</td><td>7</td><td>6</td><td>5</td><td>4</td><td>3</td><td>0–2</td></tr><tr><th>Балл</th><td>10</td><td>9</td><td>8</td><td>7</td><td>6</td><td>5</td><td>4</td><td>3</td><td>2</td></tr></table></div>
      <div class="card" style="margin-top:12px"><b>👥 Қонақтардың «сабақ EPI индексі»:</b> <span style="font-size:34px;font-weight:900;color:var(--leaf)">${gs.length ? Math.round(gs.reduce((a, x) => a + (+x.s || 0), 0) / gs.length) : "—"}</span><span class="mut"> / 100 · ${gs.length} баға</span></div>${qrCard("g", "👥 Қонақтар, сабақты бағалаңыз!", "«Сабақтың EPI индексі» 0–100 · пікіріңіз")}</div></div>`;
  onCloud = () => { if (D.stages[S.i].id === "score") R.score(); }; };
/* 11. Кері байланыс: теңіз жағасы — оқушылар 👣 аяқ ізі, мұғалімдер мен қонақтар 🖐️ қол ізі, 🍾 бөтелкедегі хат */
const FOOT = c => `<g fill="${c}"><ellipse cx="0" cy="8" rx="9" ry="15"/><ellipse cx="0" cy="-12" rx="7" ry="6"/><circle cx="-7" cy="-22" r="3"/><circle cx="-2" cy="-25" r="3.2"/><circle cx="3.5" cy="-24.5" r="2.8"/><circle cx="7.5" cy="-21.5" r="2.4"/><circle cx="10" cy="-17" r="2"/></g>`;
const HAND = c => `<g fill="${c}"><rect x="-15" y="-6" width="30" height="30" rx="12"/><rect x="-15" y="-30" width="7" height="26" rx="3.5"/><rect x="-6.5" y="-36" width="7" height="32" rx="3.5"/><rect x="2" y="-34" width="7" height="30" rx="3.5"/><rect x="10" y="-26" width="6.5" height="22" rx="3.2"/><rect x="-27" y="2" width="16" height="7" rx="3.5" transform="rotate(-38 -19 5)"/></g>`;
const FC = { g: "#1F9D6B", y: "#E3A21A", r: "#D9452B" };
R.feedback = () => { const ft = LS.get("feet", {}), hands = LS.get("hands", []);
  const draw = () => { const all = { ...ft }; Object.values(CLOUD.feet || {}).forEach(f => { if (f && f.n) all[f.n] = f.c; });
    const gh = Object.entries(CLOUD.guests || {}).filter(([, x]) => x && x.s != null).map(([k, x]) => ({ c: x.s >= 60 ? "g" : x.s >= 40 ? "y" : "r", n: x.n || "Қонақ", s: x.s, id: k }));
    const H = [...hands.map((c, k) => ({ c, n: "Мұғалім " + (k + 1), id: "m" + k })), ...gh];
    const ls = Object.values(CLOUD.letters || {}).filter(Boolean).slice(-4);
    const N = D.roster.length, W = 1544, SH = 640, shore = 205;
    let svg = "";
    D.roster.forEach((n, k) => { const x = 70 + k * ((W - 140) / (N - 1)), y = 395 + 62 * Math.sin(k * .62) + (k % 2 ? 22 : -22), rot = 75 + 25 * Math.cos(k * .62), c = all[n];
      svg += `<g class="fp${c ? " on" : ""}" data-f="${esc(n)}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><rect x="-34" y="-36" width="68" height="78" fill="transparent"/>
        <g transform="rotate(${rot.toFixed(0)})">${c ? FOOT(FC[c]) : `<g fill="none" stroke="#B8935A" stroke-width="2" stroke-dasharray="4 3"><ellipse cx="0" cy="8" rx="9" ry="15"/><ellipse cx="0" cy="-12" rx="7" ry="6"/></g>`}</g>
        <text y="44" text-anchor="middle" class="fpn">${esc(n)}</text></g>`; });
    H.forEach((h, k) => { const x = 600 + (k % 13) * 70, y = shore + 58 + Math.floor(k / 13) * 64 + (k % 2) * 8;
      svg += `<g transform="translate(${x} ${y}) rotate(${(k * 37) % 30 - 15})" opacity=".92">${HAND(FC[h.c])}</g><text x="${x}" y="${y + 40}" text-anchor="middle" class="hpn">${esc(String(h.n).slice(0, 12))}${h.s != null ? " · " + h.s : ""}</text>`; });
    ls.forEach((l, k) => { const x = 760 + k * 110; svg += `<g class="bottle" style="animation-delay:${k * .7}s" transform="translate(${x} ${110 + (k % 2) * 40})"><text font-size="38" text-anchor="middle">🍾</text></g>`; });
    const cnt = k => Object.values(all).filter(v => v === k).length;
    $("#body").innerHTML = `<div class="beach"><svg viewBox="0 0 ${W} ${SH}" preserveAspectRatio="none">
      <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E6E8C"/><stop offset="1" stop-color="#3FB6C9"/></linearGradient>
      <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8CFA0"/><stop offset="1" stop-color="#F6E6C4"/></linearGradient>
      <pattern id="grain" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r="1" fill="#C9A86E" opacity=".45"/><circle cx="15" cy="15" r="1.2" fill="#C9A86E" opacity=".35"/><circle cx="18" cy="3" r=".8" fill="#fff" opacity=".6"/></pattern></defs>
      <rect width="${W}" height="${SH}" fill="url(#sand)"/><rect width="${W}" height="${SH}" fill="url(#grain)"/>
      <path d="M0 0H${W}V${shore - 20}C${W * .8} ${shore + 20} ${W * .6} ${shore - 40} ${W * .4} ${shore}S${W * .1} ${shore - 30} 0 ${shore}Z" fill="url(#sea)"/>
      <path class="wave" d="M0 ${shore}C${W * .1} ${shore - 30} ${W * .3} ${shore + 10} ${W * .4} ${shore}S${W * .8} ${shore + 20} ${W} ${shore - 20}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
      <path d="M${W * .52} ${shore + 18}C${W * .6} ${shore + 4} ${W * .7} ${shore + 30} ${W * .8} ${shore + 10}" fill="none" stroke="#D4B47F" stroke-width="2" stroke-dasharray="6 8"/>
      <text x="24" y="40" class="shead1">👣 Менің экологиялық ізім</text><text x="24" y="66" class="ssub">Әр адам Жерде із қалдырады. Бүгінгі сабақтан қандай із қалдырдың? Өз ізіңді бас: 🟢 → 🟡 → 🔴</text>
      <text x="40" y="${shore + 50}" class="ssub2">🖐️ Мұғалімдер мен қонақтардың қол ізі →</text>${svg}</svg>
      <div class="legend2">${D.footprints.map(f => `<span style="background:${f.c}">👣 ${esc(f.n)} · <b>${cnt(f.k)}</b></span>`).join("")}<span style="background:#6B4E2E">🖐️ ${H.length}</span>
        <button class="tb" id="addH">🖐️ + қол ізі</button>${hands.length ? `<button class="tb" id="delH">↺</button>` : ""}</div>
      <div class="scroll"><b>✉️ 2050 жылғы адамға хат</b><div>Дәптерге 2 сөйлем: <i>«2050 жылы сен ... . Біз 2026 жылы ... үшін ... істедік.»</i></div>${ls.map(l => `<p>🍾 ${esc(l)}</p>`).join("")}</div>
      <div class="bqr"><div>${qrSvg(stuUrl, { logo: "🎒" })}<span>🎒 Оқушы: із + хат</span></div><div>${qrSvg(guestUrl, { c1: "#D99A1E", c2: "#E8573A", logo: "🖐️" })}<span>🖐️ Мұғалім, қонақ</span></div></div></div>`;
    $$("[data-f]").forEach(b => b.onclick = () => { const n = b.dataset.f, o = ["g", "y", "r", undefined]; const nx = o[(o.indexOf(ft[n]) + 1) % 4]; if (nx) ft[n] = nx; else delete ft[n]; LS.set("feet", ft); chime(nx === "g" ? 800 : nx === "y" ? 640 : 480); draw(); });
    $("#addH").onclick = () => { const o = ["g", "y", "r"]; hands.push("g"); LS.set("hands", hands); chime(700); draw(); };
    if ($("#delH")) $("#delH").onclick = () => { hands.pop(); LS.set("hands", hands); draw(); }; };
  onCloud = draw; draw(); };
/* 12. Үй тапсырмасы */
R.home = () => { $("#body").innerHTML = `<div class="card" style="margin-bottom:14px;padding:10px 18px;font-size:18px">🏠 Өз деңгейіңді таңда. ${esc(D.lesson.book)}. Контур карта — №3 парақтың артында.</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${D.homework.map((h, k) => `<div class="card hmc" style="--hc:${["#1F9D6B", "#0E7C9B", "#E8573A"][k]}"><div style="display:flex;align-items:center;gap:10px"><span class="lv">${h.lv}</span><span style="font-size:40px">${h.i}</span><b style="color:var(--hc);font-size:20px">${esc(h.n)}</b></div><p style="font-size:20px;line-height:1.35">${esc(h.t)}</p></div>`).join("")}</div>
  <div style="text-align:center;margin-top:26px;font-size:40px;font-weight:900;color:var(--sea)">Сау болыңыздар! 🌍 Жерге қамқор болайық!</div>`; };

/* ================= ОҚУШЫ ТЕЛЕФОНЫ ================= */
function stuInit() { document.body.innerHTML = `<div class="phone" id="ph"></div>`; let me = LS.get("me");
  const draw = () => { if (!me) { $("#ph").innerHTML = `<div class="card"><h2>🎒 Сәлем! Атыңды таңда</h2><div class="pick">${D.roster.map(n => `<button data-me="${esc(n)}">${esc(n)}</button>`).join("")}</div></div>`;
      $$("[data-me]").forEach(b => b.onclick = () => { me = b.dataset.me; LS.set("me", me); draw(); }); return; }
    const v = LS.get("myvote"), f = LS.get("myfoot");
    $("#ph").innerHTML = `<div class="card" style="background:linear-gradient(135deg,#0E7C9B,#1F9D6B);color:#fff"><small>${esc(D.lesson.subject)}</small><h2 style="color:#fff">${esc(D.lesson.title)}</h2>${esc(me)} <button class="tb" id="chg" style="padding:2px 8px;font-size:13px">ауыстыру</button></div>
      <div class="card"><h2>⚖️ Пікір таразысы</h2><p>${esc(D.debate.q)}</p><div class="pick"><button data-v="yes" class="${v === "yes" ? "on" : ""}" style="--gc:#D9452B">✋ Иә, басты себеп</button><button data-v="no" class="${v === "no" ? "on" : ""}" style="--gc:#1F9D6B">🙅 Жоқ, жалғыз себеп емес</button></div></div>
      <div class="card"><h2>👣 Менің экологиялық ізім</h2><div class="pick">${D.footprints.map(x => `<button data-f="${x.k}" class="${f === x.k ? "on" : ""}" style="--gc:${x.c}">${esc(x.n)}</button>`).join("")}</div></div>
      <div class="card"><h2>✉️ 2050 жылғы адамға хат</h2><textarea id="lt" rows="3" maxlength="200" placeholder="2050 жылы сен ... . Біз 2026 жылы ...">${esc(LS.get("myletter", ""))}</textarea><button class="btn" id="ls" style="margin-top:8px;width:100%">Жіберу</button><div id="lok" class="mut small"></div></div>`;
    $("#chg").onclick = () => { me = null; LS.set("me", null); draw(); };
    $$("[data-v]").forEach(b => b.onclick = () => { LS.set("myvote", b.dataset.v); CL.put("votes/" + uid(), b.dataset.v).catch(() => {}); draw(); });
    $$("[data-f]").forEach(b => b.onclick = () => { LS.set("myfoot", b.dataset.f); CL.put("feet/" + uid(), { n: me, c: b.dataset.f }).catch(() => {}); draw(); });
    $("#ls").onclick = () => { const t = $("#lt").value.trim(); if (!t) return; LS.set("myletter", t); CL.put("letters/" + uid(), me + ": " + t).then(() => $("#lok").textContent = "✅ Жіберілді — тақтада көрінеді").catch(() => $("#lok").textContent = "Интернет жоқ — дәптерге жаз"); }; };
  draw(); }

/* ================= ҚОНАҚ ================= */
function guestInit() { document.body.innerHTML = `<div class="phone" id="ph"></div>`; const L = D.lesson, mine = LS.get("gs", null);
  $("#ph").innerHTML = `<div class="card" style="background:linear-gradient(135deg,#0E7C9B,#1F9D6B);color:#fff"><small>👥 Қонаққа арналған бет</small><h2 style="color:#fff">${esc(L.title)}</h2>
      <div class="small">${esc(L.subject)} · ${esc(L.date)}<br>${esc(L.teacher)}<br>${esc(L.school)}</div></div>
    <div class="card"><b>Тақырып:</b> ${esc(L.topic)}<br><b>Мақсат:</b> ${esc(L.goal)}<br><span class="mut small">${esc(L.prev)}</span></div>
    <div class="card"><h2>Сабақ барысы</h2>${D.stages.map((s, k) => `<div style="margin:6px 0"><b>${k + 1}. ${esc(s.t)}</b> <span class="mut small">· ${s.m} мин · ${esc(s.type)} · ${esc(s.method)} ${s.tools.join("")}</span></div>`).join("")}
      <p class="small mut">🗺️ Контур карта · 🌍 глобус · 📄 жұмыс парағы · 📒 дәптер · 📖 оқулық · 🖥️ интерактивті тақта</p></div>
    <div class="card"><h2>🌿 Сабақтың «EPI индексі»</h2><p class="small">Елдер сияқты сабақты да 0–100 бойынша бағалаңыз.</p>
      <input type="range" id="gr" min="0" max="100" value="${mine ? mine.s : 75}"><div style="text-align:center;font-size:42px;font-weight:900" id="gv">${mine ? mine.s : 75}</div>
      <input type="text" id="gn" placeholder="Аты-жөніңіз (тақтада 🖐️ қол ізіңіздің астында шығады)" value="${esc(mine && mine.n ? mine.n : "")}" style="margin-bottom:8px"><textarea id="gt" rows="3" placeholder="Пікіріңіз, ұсынысыңыз">${esc(mine ? mine.t : "")}</textarea><button class="btn" id="gsend" style="width:100%;margin-top:8px">Жіберу</button><div id="gok" class="mut small"></div></div>`;
  const col = v => v >= 60 ? "#1F9D6B" : v >= 40 ? "#E3A21A" : "#D9452B"; const up = () => { $("#gv").textContent = $("#gr").value; $("#gv").style.color = col(+$("#gr").value); }; up();
  $("#gr").oninput = up;
  $("#gsend").onclick = () => { const v = { s: +$("#gr").value, t: $("#gt").value.trim().slice(0, 300), n: ($("#gn") ? $("#gn").value.trim().slice(0, 30) : "") || "Қонақ" }; LS.set("gs", v); CL.put("guests/" + uid(), v).then(() => $("#gok").textContent = "✅ Рахмет! Бағаңыз тақтада көрінеді.").catch(() => $("#gok").textContent = "Интернет жоқ, кейін қайта жіберіңіз."); }; }

/* мұғалім PIN */
function gate() { if (sessionStorage.getItem("hs11pin") === "1" || Q.get("pin") === "2311") { sessionStorage.setItem("hs11pin", "1"); return boardInit(); }
  document.body.innerHTML = `<div class="home"><div class="card" style="max-width:420px;text-align:center"><div style="font-size:50px">👩‍🏫</div><h2>Мұғалім кіруі</h2><input type="text" id="pin" inputmode="numeric" placeholder="PIN" style="text-align:center;font-size:28px"><button class="btn" id="pgo" style="margin-top:10px;width:100%">Кіру</button><p class="mut small"><a href="index.html">← Басты бет</a></p></div></div>`;
  const ok = () => { if ($("#pin").value.trim() === "2311") { sessionStorage.setItem("hs11pin", "1"); boardInit(); } else $("#pin").animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], 300); };
  $("#pgo").onclick = ok; $("#pin").onkeydown = e => { if (e.key === "Enter") ok(); }; $("#pin").focus(); }
MODE === "stu" ? stuInit() : MODE === "guest" ? guestInit() : gate();
