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

/* ================= ТАҚТА ================= */
const TM = { left: 0, run: false, end: 0 };
function boardInit() {
  document.body.className = "board";
  document.body.innerHTML = `<div id="stage"><header class="top"><div class="brand"><span class="logo">🌍</span><div><b>${esc(D.lesson.title)}</b><small>${esc(D.lesson.subject)} · ${esc(D.lesson.date)}</small></div></div>
    <nav class="chips" id="chips"></nav><div class="timer" id="timer"><b id="tt">0:00</b><button id="tgo">▶</button><button id="tre">↺</button></div>
    <button class="tb" id="qrB">📱 QR</button><button class="tb" id="fsB">⛶</button></header>
    <section class="shead" id="shead"></section><main class="body" id="body"></main>
    <footer class="score"><button class="nav" id="prev">‹</button><div id="sgs" style="display:flex;gap:12px;flex:1"></div><button class="nav" id="next">›</button></footer></div>
    <div class="modal" id="modal" hidden><div class="mbox"><button class="mx" id="mx">✕</button><div id="mc"></div></div></div>`;
  const fit = () => { const k = Math.min(innerWidth / 1600, innerHeight / 900); $("#stage").style.transform = `translate(-50%,-50%) scale(${k})`; }; addEventListener("resize", fit); fit();
  $("#prev").onclick = () => go(S.i - 1); $("#next").onclick = () => go(S.i + 1);
  $("#fsB").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
  $("#mx").onclick = () => $("#modal").hidden = true;
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
function modal(h) { $("#mc").innerHTML = h; $("#modal").hidden = false; }
function tick() { const ms = TM.run ? Math.max(0, TM.end - Date.now()) : TM.left; if (TM.run && ms <= 0) { TM.run = false; TM.left = 0; chime(440); }
  const s = Math.ceil(ms / 1000); $("#tt").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  $("#timer").classList.toggle("warn", TM.run && s <= 30); $("#tgo").textContent = TM.run ? "⏸" : "▶"; }
function drawScore() { const p = S.pts, gr = S.grp; $("#sgs").innerHTML = D.groups.map(g => { const n = Object.values(gr).filter(v => v === g.k).length;
  return `<div class="sg" data-g="${g.k}" style="--gc:${g.c};--gs:${g.soft}"><span class="gi">${g.i}</span><div><b>${g.n}</b><small>${n} оқушы</small></div>
    <button data-add="${g.k}" data-n="-1">−</button><span class="pt">${p[g.k] || 0}</span><button data-add="${g.k}">+</button></div>`; }).join(""); }
let stop = () => {};
function go(i) { i = Math.max(0, Math.min(D.stages.length - 1, i)); stop(); stop = () => {}; onCloud = () => {}; S.i = i; const st = D.stages[i];
  TM.run = false; TM.left = st.m * 60000; tick();
  $("#chips").innerHTML = D.stages.map((s, k) => `<button class="chip${k === i ? " on" : k < i ? " done" : ""}" data-go="${k}"><b>${k + 1}</b>${esc(s.t)}</button>`).join("");
  $$("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
  $("#shead").innerHTML = `<span class="n">${i + 1}</span><div><h1>${esc(st.t)}</h1><div class="meta"><span class="tag">👥 ${esc(st.type)}</span><span class="tag t">⏱ ${st.m} мин</span><span class="tag">🧭 ${esc(st.method)}</span><span class="tag tools">${st.tools.join(" ")}</span></div></div>`;
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
    $("#body").innerHTML = `<div class="card" style="margin-bottom:12px;padding:10px 16px"><b>Сұрақ:</b> «Қай аймақта өмір сүрер едің?» Атыңды бас → өзің таңдаған аймақты бас. Бұл аймақтың 8 елін сабақ бойы зерттейсің.
      <div class="pool" style="margin:8px 0 0">${free.map(n => `<button class="nm${sel === n ? " sel" : ""}" data-n="${esc(n)}">${esc(n)}</button>`).join("") || `<span class="mut">✅ Бәрі таңдады</span>`}</div></div>
      <div class="gcards" style="height:calc(100% - ${free.length ? 130 : 96}px)">${D.groups.map(g => `<div class="gcard" data-gc="${g.k}" style="--gc:${g.c};--gs:${g.soft}">
        <div style="display:flex;gap:12px;align-items:center"><div class="pic" style="height:90px;width:90px;font-size:56px;flex:0 0 90px">${g.i}</div><div><h2 style="margin:0">${g.n}</h2><p>${g.d}</p></div></div>
        <p class="small" style="margin-top:8px"><b>Елдері:</b> ${D.countries.filter(c => c.g === g.k).map(c => c.n).join(", ")}</p>
        <div class="names">${Object.keys(gr).filter(n => gr[n] === g.k).map(n => `<button class="nm" data-back="${esc(n)}">${esc(n)}</button>`).join("")}</div></div>`).join("")}</div>`;
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
    $("#body").innerHTML = `<div class="card" style="text-align:center;font-size:28px;font-weight:900;margin-bottom:12px">⚖️ ${esc(D.debate.q)}</div>
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
/* 9. Экологиялық із: бағалау · кері байланыс · үй тапсырмасы */
R.end = () => { const ft = LS.get("feet", {});
  const draw = () => { const cf = Object.values(CLOUD.feet || {}), all = { ...ft }; cf.forEach(f => { if (f && f.n) all[f.n] = f.c; });
    const cnt = k => Object.values(all).filter(v => v === k).length, ls = Object.values(CLOUD.letters || {}).filter(Boolean).slice(-4), gs = Object.values(CLOUD.guests || {}).filter(x => x && x.s != null);
    const p = S.pts, best = Math.max(...D.groups.map(g => p[g.k] || 0));
    $("#body").innerHTML = `<div class="feet"><div><div class="card" style="padding:10px 16px"><h3 style="margin-bottom:4px">👣 Менің экологиялық ізім</h3><div class="small mut">Тақтаға шығып, атыңды бас: 🟢 → 🟡 → 🔴. Сабақтан қандай із қалды?</div>
      <div class="names" style="margin-top:8px">${D.roster.map(n => { const c = all[n]; const f = D.footprints.find(x => x.k === c); return `<button class="nm" data-f="${esc(n)}" style="${f ? `background:${f.c};color:#fff` : ""}">${f ? "👣 " : ""}${esc(n)}</button>`; }).join("")}</div>
      <div style="display:flex;gap:10px;margin-top:10px">${D.footprints.map(f => `<div class="fb" style="--fc:${f.c};flex:1;font-size:16px">${esc(f.n)}<b>${cnt(f.k)}</b></div>`).join("")}</div></div>
      <div class="card" style="margin-top:12px;padding:10px 16px"><h3 style="margin-bottom:4px">✉️ 2050 жылғы адамға хат</h3><div class="small">Дәптерге 2 сөйлем: «2050 жылы сен ... . Біз 2026 жылы ... үшін ... істедік.»</div>
      ${ls.map(l => `<div class="small" style="background:#F3FAFB;border-radius:10px;padding:6px 10px;margin-top:6px">✉️ ${esc(l)}</div>`).join("")}</div></div>
    <div><div class="card" style="padding:10px 16px"><h3 style="margin-bottom:4px">🏆 Топтардың ұпайы</h3>${D.groups.map(g => `<div style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;color:${g.c};margin:4px 0">${g.i} ${g.n}<span style="margin-left:auto">${p[g.k] || 0}${best > 0 && (p[g.k] || 0) === best ? " 🏆" : ""}</span></div>`).join("")}</div>
      <div class="card hwl" style="padding:10px 16px"><h3 style="margin-bottom:2px">🏠 Үй тапсырмасы (таңдау бойынша)</h3>${D.homework.map(h => `<div><b>${h.lv}</b><span>${esc(h.t)}</span></div>`).join("")}</div>
      <div class="card" style="margin-top:12px;padding:10px 16px"><b>👥 Қонақтардың «сабақ EPI индексі»:</b> <span style="font-size:28px;font-weight:900;color:var(--leaf)">${gs.length ? Math.round(gs.reduce((a, x) => a + (+x.s || 0), 0) / gs.length) : "—"}</span><span class="mut"> / 100 · ${gs.length} баға</span></div></div></div>`;
    $$("[data-f]").forEach(b => b.onclick = () => { const n = b.dataset.f, o = ["g", "y", "r", undefined], cur = ft[n]; const nx = o[(o.indexOf(cur) + 1) % 4]; if (nx) ft[n] = nx; else delete ft[n]; LS.set("feet", ft); chime(nx === "g" ? 800 : nx === "y" ? 640 : 480); draw(); }); };
  onCloud = draw; draw(); };

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
      <textarea id="gt" rows="3" placeholder="Пікіріңіз, ұсынысыңыз">${esc(mine ? mine.t : "")}</textarea><button class="btn" id="gsend" style="width:100%;margin-top:8px">Жіберу</button><div id="gok" class="mut small"></div></div>`;
  const col = v => v >= 60 ? "#1F9D6B" : v >= 40 ? "#E3A21A" : "#D9452B"; const up = () => { $("#gv").textContent = $("#gr").value; $("#gv").style.color = col(+$("#gr").value); }; up();
  $("#gr").oninput = up;
  $("#gsend").onclick = () => { const v = { s: +$("#gr").value, t: $("#gt").value.trim().slice(0, 300) }; LS.set("gs", v); CL.put("guests/" + uid(), v).then(() => $("#gok").textContent = "✅ Рахмет! Бағаңыз тақтада көрінеді.").catch(() => $("#gok").textContent = "Интернет жоқ, кейін қайта жіберіңіз."); }; }

/* мұғалім PIN */
function gate() { if (sessionStorage.getItem("hs11pin") === "1" || Q.get("pin") === "2311") { sessionStorage.setItem("hs11pin", "1"); return boardInit(); }
  document.body.innerHTML = `<div class="home"><div class="card" style="max-width:420px;text-align:center"><div style="font-size:50px">👩‍🏫</div><h2>Мұғалім кіруі</h2><input type="text" id="pin" inputmode="numeric" placeholder="PIN" style="text-align:center;font-size:28px"><button class="btn" id="pgo" style="margin-top:10px;width:100%">Кіру</button><p class="mut small"><a href="index.html">← Басты бет</a></p></div></div>`;
  const ok = () => { if ($("#pin").value.trim() === "2311") { sessionStorage.setItem("hs11pin", "1"); boardInit(); } else $("#pin").animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], 300); };
  $("#pgo").onclick = ok; $("#pin").onkeydown = e => { if (e.key === "Enter") ok(); }; $("#pin").focus(); }
MODE === "stu" ? stuInit() : MODE === "guest" ? guestInit() : gate();
