import { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   ADRIAN CHEN — "THE INCIDENT CONSOLE"
   Full portfolio: Hero · Incidents · Skills · Contact
   Tokens: bg #0A0E14 · panel #0F1520 · line #1C2635
           cyan #4FD8EB · amber #F5B454 · dim #7A8CA3 · ok #6EE7A0
   Zero chart/animation libraries — raw SVG + CSS only.
   ============================================================ */

/* ---------- data ---------- */
const START = new Date("2025-06-02T09:00:00");

const PROCESSES = [
  { pid: 1042, name: "volare_admin.module", note: "Laravel · MySQL · DevExtreme", load: 72 },
  { pid: 2210, name: "vocalvault.dev", note: "PERN · speech recognition", load: 55 },
  { pid: 3307, name: "leetcode.daily", note: "Python · binary search · linked lists", load: 38 },
  { pid: 4001, name: "uk_internship.scan", note: "applications · 2027 cycle", load: 26 },
];

const INCIDENTS = [
  {
    id: "INC-1615",
    sev: "SEV-1",
    sevClass: "sev-r",
    title: "Advance Search hangs entire admin panel",
    system: "Volare+ · production",
    status: "RESOLVED",
    rootCause:
      "Intermittent MySQL error 1615 ('prepared statement needs to be re-prepared'). Repeated unparameterised raw SQL inside a loop stressed the prepared-statement cache during back-to-back view queries.",
    fix:
      "Redirected the affected queries to the base user table via a config-layer change — no PHP rewrite required, minimal change scope.",
    lesson:
      "The scary-looking error is rarely the root cause. Reproduce first, then trace the query path before touching code.",
    stack: ["MySQL", "Laravel", "Raw SQL"],
  },
  {
    id: "INC-SPA",
    sev: "SEV-2",
    sevClass: "sev-a",
    title: "Grid silently dies on second page visit",
    system: "Volare+ · admin frontend",
    status: "RESOLVED",
    rootCause:
      "SPA re-navigation re-injected an inline <script> block; block-scoped re-declaration threw a SyntaxError at parse time — before a single line executed — so the DevExtreme grid never initialised and no data calls fired.",
    fix:
      "Guarded the declaration so repeat injection is idempotent; grid and data sources initialise cleanly on every navigation.",
    lesson:
      "A parse-time error is invisible in the network tab. When 'nothing happens', check the console before the API.",
    stack: ["JavaScript", "DevExtreme", "SPA"],
  },
  {
    id: "INC-OAUTH",
    sev: "SEV-2",
    sevClass: "sev-a",
    title: "Vendors never activate after sync",
    system: "Volare+ · third-party integration",
    status: "RESOLVED",
    rootCause:
      "Misconfigured .env values produced a malformed OAuth2 client-credentials token URL. The failure was swallowed by a caught exception, so syncLegalvendor never flipped vendors to active — silently.",
    fix:
      "Audited the token flow end-to-end, corrected the environment configuration, and verified downstream activation and dropdown population.",
    lesson:
      "Silent failures hide in catch blocks. If an integration 'does nothing', follow the token before blaming the data.",
    stack: ["OAuth2", "Laravel", "ENV config"],
  },
  {
    id: "PRJ-VVLT",
    sev: "ACTIVE",
    sevClass: "sev-g",
    title: "VocalVault — speech-powered expense tracker",
    system: "Personal project · PERN stack",
    status: "IN PROGRESS",
    rootCause:
      "Logging small daily expenses has too much friction — most people just stop. Voice input removes the typing step entirely.",
    fix:
      "Full-stack build: PostgreSQL relational schema, Express REST API, React frontend with speech-recognition input and a confirmation gate before any transcribed expense is persisted. Backend-first, voice pipeline last.",
    lesson:
      "github.com/adriancwpin/VocalVault",
    stack: ["React", "Node/Express", "PostgreSQL", "Web Speech"],
  },
  {
    id: "PRJ-DNM",
    sev: "SHIPPED",
    sevClass: "sev-g",
    title: "Delay No More — procrastination-cycle detector",
    system: "Personal project · Flask + Chrome extension",
    status: "SHIPPED",
    rootCause:
      "You can't fix procrastination you can't see. Browser behaviour (tab-switching, idle drift) is the raw signal.",
    fix:
      "Chrome extension streams activity to a Flask REST API; OAuth login; analytics dashboard visualises focus cycles, with Spotify listening data folded in.",
    lesson:
      "github.com/adriancwpin/ProcrastiCycle",
    stack: ["Flask", "JavaScript", "OAuth", "Spotify API"],
  },
  {
    id: "PRJ-MAZE",
    sev: "SHIPPED",
    sevClass: "sev-g",
    title: "Maze Solver Visualizer — DFS vs BFS, live",
    system: "Personal project · Python",
    status: "SHIPPED",
    rootCause:
      "Big-O tables don't build intuition. Watching two algorithms race the same maze does.",
    fix:
      "Real-time Tkinter visualisation of DFS and BFS on 20x20 mazes, tracking visited nodes, path length, and execution steps side by side.",
    lesson:
      "github.com/adriancwpin/Maze_solver",
    stack: ["Python", "Tkinter", "PyAmaze"],
  },
  {
    id: "PRJ-BRK",
    sev: "SHIPPED",
    sevClass: "sev-g",
    title: "Brick Breaker — collision detection from scratch",
    system: "Personal project · Java",
    status: "SHIPPED",
    rootCause:
      "Game loops force you to think about state, timing, and physics all at once — the best OOP workout there is.",
    fix:
      "Modular object-oriented architecture separating game loop, physics, rendering, and map generation; real-time Rectangle-intersection collision detection for ball–paddle and ball–brick interactions.",
    lesson:
      "repo upload pending — ask me about the collision system",
    stack: ["Java", "Swing", "AWT"],
  },
];

const SKILLS = [
  { name: "PHP / Laravel", pct: 78, note: "daily driver — production codebase" },
  { name: "SQL (MySQL · PostgreSQL)", pct: 74, note: "query tuning, schema design" },
  { name: "JavaScript / React", pct: 72, note: "SPA debugging, PERN builds" },
  { name: "Python", pct: 70, note: "algorithms, tooling, visualisation" },
  { name: "Node.js / Express", pct: 62, note: "REST APIs, auth flows" },
  { name: "Java / C++", pct: 48, note: "coursework + OOP projects" },
  { name: "Haskell", pct: 35, note: "functional programming coursework" },
];

const COMMITS = [3, 5, 2, 7, 4, 6, 9, 5, 8, 4, 7, 10, 6, 8, 5, 9, 7, 11, 6, 8, 10, 7, 9, 12, 8, 6, 9, 7];

/* ---------- hooks ---------- */
function useUptime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((now - START) / 1000);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${d}d ${h}:${m}:${sec}`;
}

function useJitter(base) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const t = setInterval(() => {
      setV(Math.max(8, Math.min(96, base + (Math.random() * 18 - 9))));
    }, 900);
    return () => clearInterval(t);
  }, [base]);
  return v;
}

/* ---------- components ---------- */
function StatusBar({ uptime }) {
  return (
    <div className="statusbar">
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pulse" /> <b className="ok">SYSTEM NOMINAL</b>
      </span>
      <span className="dim">host: <span className="cyan">adrian.chen</span></span>
      <span className="dim">role: swe-intern @ stampedesolution</span>
      <span className="dim">uptime (internship): <span className="amber">{uptime}</span></span>
      <span className="dim" style={{ marginLeft: "auto" }}>Kuala Lumpur ⇄ Edinburgh</span>
    </div>
  );
}

function ProcessRow({ p }) {
  const load = useJitter(p.load);
  const bars = useMemo(() => Array.from({ length: 8 }), []);
  return (
    <div className="procrow">
      <span className="dim" style={{ width: 44 }}>{p.pid}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cyan">{p.name}</span>
        <span className="dim" style={{ display: "block", fontSize: 11 }}>{p.note}</span>
      </span>
      <span className="bars" aria-hidden="true">
        {bars.map((_, i) => (
          <i key={i} style={{ height: `${Math.max(3, (load / 100) * 22 * ((i % 3) * 0.28 + 0.6))}px` }} />
        ))}
      </span>
      <span className="amber" style={{ width: 42, textAlign: "right" }}>{Math.round(load)}%</span>
    </div>
  );
}

function Sparkline() {
  const [hover, setHover] = useState(null);
  const W = 460, H = 70, max = Math.max(...COMMITS);
  const pts = COMMITS.map((v, i) => [
    (i / (COMMITS.length - 1)) * (W - 10) + 5,
    H - 8 - (v / max) * (H - 20),
  ]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
      onMouseLeave={() => setHover(null)} role="img" aria-label="Commit activity, last 28 days">
      <path d={path} fill="none" stroke="var(--cyan)" strokeWidth="1.6" />
      <path d={`${path} L${W - 5},${H - 4} L5,${H - 4} Z`} fill="rgba(79,216,235,.07)" stroke="none" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4 : 2.2}
          fill={hover === i ? "var(--amber)" : "var(--cyan)"}
          onMouseEnter={() => setHover(i)} style={{ cursor: "crosshair" }} />
      ))}
      {hover !== null && (
        <text x={Math.min(pts[hover][0], W - 90)} y={14} fill="var(--amber)" fontSize="11">
          day {hover + 1} · {COMMITS[hover]} commits
        </text>
      )}
    </svg>
  );
}

const CMDS = {
  help: () => [
    "available commands:",
    "  whoami       — who is this system",
    "  skills       — loaded modules",
    "  projects     — active + shipped builds",
    "  experience   — work log",
    "  contact      — open a channel",
    "  secret       — tail the real bug log",
    "  clear        — wipe terminal",
  ],
  whoami: () => [
    "adrian.chen — BEng Computer Science, University of Edinburgh (2028)",
    "software engineering intern on a production Laravel/MySQL platform.",
    "specialty: tracing bugs to the actual root cause, not the symptom.",
  ],
  skills: () => [
    "loaded: php/laravel, mysql, postgresql, javascript/react,",
    "        node/express, python, flask, git, oauth2",
    "loading: java, c++, haskell (coursework)",
  ],
  projects: () => [
    "PRJ-VVLT  vocalvault        ACTIVE   speech-powered expense tracker (PERN)",
    "PRJ-DNM   delay-no-more     SHIPPED  procrastination detector (flask+extension)",
    "PRJ-MAZE  maze-visualizer   SHIPPED  DFS vs BFS, real-time (python)",
    "PRJ-BRK   brick-breaker     SHIPPED  OOP game engine from scratch (java)",
    "scroll to ── RESOLVED INCIDENTS ── for full post-mortems",
  ],
  experience: () => [
    "2025-06 → now   swe intern @ StampedeSolution · Volare+ debt collection platform",
    "                started QA (phpunit, postman) → moved to development",
    "                admin module · laravel · mysql · devextreme",
    "2024-04 → 08    junior school tutor · kuala lumpur",
  ],
  contact: () => [
    "email    adriancwpin8@gmail.com",
    "github   github.com/adriancwpin",
    "linkedin linkedin.com/in/adrianchenweipin",
  ],
  secret: () => [
    "> tail -n 4 /var/log/actual_bugs.log",
    "[1615] mysql: 'prepared statement needs to be re-prepared' — raw SQL in a loop.",
    "[SPA ] SyntaxError at parse time. zero lines executed. grid never born.",
    "[AUTH] token URL malformed by blank .env — failure eaten by a catch block.",
    "root cause found: 3/3. symptoms patched: 0. that's the job.",
  ],
};

function Terminal() {
  const [lines, setLines] = useState([
    { t: "out", s: "adrian.chen console v2.0 — type 'help' or tap a command" },
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState([]);
  const [hIdx, setHIdx] = useState(-1);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const run = (raw) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "clear") { setLines([]); return; }
    const out = CMDS[cmd]
      ? CMDS[cmd]()
      : [`command not found: ${cmd} — try 'help'`];
    setLines((l) => [...l, { t: "in", s: raw }, ...out.map((s) => ({ t: "out", s }))]);
    setHist((h) => [raw, ...h]);
    setHIdx(-1);
  };

  const onKey = (e) => {
    if (e.key === "Enter") { run(input); setInput(""); }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hIdx + 1, hist.length - 1);
      if (hist[n]) { setHIdx(n); setInput(hist[n]); }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = hIdx - 1;
      if (n < 0) { setHIdx(-1); setInput(""); }
      else { setHIdx(n); setInput(hist[n]); }
    }
  };

  return (
    <div className="term">
      <div className="term-head">
        <span className="term-dot" style={{ background: "#F47067" }} />
        <span className="term-dot" style={{ background: "var(--amber)" }} />
        <span className="term-dot" style={{ background: "var(--ok)" }} />
        <span className="dim" style={{ marginLeft: 8, fontSize: 12 }}>adrian@console:~</span>
      </div>
      <div className="term-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap" }}>
            {l.t === "in"
              ? <span><span className="amber">❯ </span><span className="cyan">{l.s}</span></span>
              : <span className="dim">{l.s}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 14px 0" }}>
        {["whoami", "projects", "experience", "secret"].map((c) => (
          <button key={c} className="pill" onClick={() => run(c)}>{c}</button>
        ))}
      </div>
      <div className="term-input">
        <span className="amber">❯</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          aria-label="Terminal command input"
          placeholder="type a command…"
          spellCheck="false"
        />
        <span className="cursor" aria-hidden="true" />
      </div>
    </div>
  );
}

function Incident({ inc, open, onToggle }) {
  const isProject = inc.id.startsWith("PRJ");
  return (
    <div className="incident">
      <button className="inc-head" onClick={onToggle} aria-expanded={open}>
        <span className={`sev ${inc.sevClass}`}>{inc.sev}</span>
        <span className="cyan" style={{ fontWeight: 600 }}>{inc.id}</span>
        <span style={{ flex: 1, minWidth: 200 }}>{inc.title}</span>
        <span className="dim" style={{ fontSize: 12 }}>{inc.status}</span>
        <span className="amber">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="inc-body">
          <div className="kv" style={{ marginTop: 12 }}>
            <b>system</b>{inc.system}
          </div>
          <div className="inc-cols">
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {isProject ? "why it exists" : "root cause"}
              </div>
              <p style={{ fontSize: 13 }}>{inc.rootCause}</p>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {isProject ? "what was built" : "resolution"}
              </div>
              <p style={{ fontSize: 13 }}>{inc.fix}</p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {isProject ? "repository" : "lesson filed"}
            </div>
            <p style={{ fontSize: 13 }} className={isProject ? "cyan" : "amber"}>
              {isProject
                ? (inc.lesson.startsWith("github.com")
                    ? <a href={`https://${inc.lesson}`} target="_blank" rel="noreferrer"
                        style={{ color: "var(--cyan)" }}>{inc.lesson}</a>
                    : <span className="dim">{inc.lesson}</span>)
                : `“${inc.lesson}”`}
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            {inc.stack.map((s) => <span className="tag" key={s}>{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const uptime = useUptime();
  const [openId, setOpenId] = useState("INC-1615");

  return (
    <div className="ic-root">
      <StatusBar uptime={uptime} />

      <div className="wrap">
        {/* HERO */}
        <header style={{ marginTop: 36 }}>
          <div className="eyebrow">// incident console · portfolio</div>
          <h1 style={{ fontSize: "clamp(26px,4.5vw,40px)", fontWeight: 700, marginTop: 8 }}>
            Adrian Chen<span className="amber">_</span>
          </h1>
          <p className="dim" style={{ maxWidth: 640, marginTop: 8 }}>
            CS undergraduate @ Edinburgh · software engineering intern.
            This console monitors one system: my work. Every incident below is real.
          </p>
        </header>

        <div className="hero-grid">
          <div>
            <div className="panel" style={{ padding: "14px 16px" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>running processes</div>
              {PROCESSES.map((p) => <ProcessRow key={p.pid} p={p} />)}
            </div>
            <div className="panel" style={{ padding: "14px 16px", marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>commit activity · last 28d</div>
              <Sparkline />
            </div>
          </div>
          <Terminal />
        </div>

        {/* INCIDENTS */}
        <section className="section" aria-labelledby="inc-h">
          <div className="sec-head">
            <span className="eyebrow">01</span>
            <h2 id="inc-h">Resolved incidents & active builds</h2>
            <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>
              tap to read the post-mortem
            </span>
          </div>
          {INCIDENTS.map((inc) => (
            <Incident key={inc.id} inc={inc}
              open={openId === inc.id}
              onToggle={() => setOpenId(openId === inc.id ? null : inc.id)} />
          ))}
        </section>

        {/* SKILLS */}
        <section className="section" aria-labelledby="sk-h">
          <div className="sec-head">
            <span className="eyebrow">02</span>
            <h2 id="sk-h">Loaded modules</h2>
          </div>
          <div className="skill-grid">
            {SKILLS.map((s) => (
              <div className="panel skill-card" key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="cyan" style={{ fontSize: 13 }}>{s.name}</span>
                  <span className="amber" style={{ fontSize: 12 }}>{s.pct}%</span>
                </div>
                <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>{s.note}</div>
                <div className="meter"><i style={{ width: `${s.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="dim" style={{ fontSize: 11, marginTop: 10 }}>
            * percentages are self-reported load, not certainty. everything here is still compiling.
          </p>
        </section>

        {/* CONTACT */}
        <footer className="panel foot">
          <div className="eyebrow" style={{ marginBottom: 10 }}>open a channel</div>
          <p style={{ fontSize: 15 }}>
            <a href="mailto:adriancwpin8@gmail.com">adriancwpin8@gmail.com</a>
            <span className="dim"> · </span>
            <a href="https://github.com/adriancwpin" target="_blank" rel="noreferrer">github</a>
            <span className="dim"> · </span>
            <a href="https://www.linkedin.com/in/adrianchenweipin" target="_blank" rel="noreferrer">linkedin</a>
          </p>
          <p className="dim" style={{ fontSize: 11, marginTop: 12 }}>
            built with react · zero chart libraries · every svg hand-rolled · © 2026 adrian chen
          </p>
        </footer>
      </div>
    </div>
  );
}
