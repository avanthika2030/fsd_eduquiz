import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const API = "http://127.0.0.1:5000/api";

const NAV_ITEMS = [
  { icon: "◈", label: "Generate", id: "generate" },
  { icon: "📊", label: "Analytics", id: "analytics" },
  { icon: "📓", label: "Notes", id: "notes" },
  { icon: "🕘", label: "History", id: "history" },
];

const BLOOM_ALL = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const BLOOM_COLORS = {
  Remember: "#6366f1", Understand: "#8b5cf6", Apply: "#a855f7",
  Analyze: "#d946ef", Evaluate: "#ec4899", Create: "#f43f5e",
};

const LOAD_MESSAGES = [
  "Extracting transcript…",
  "Chunking & embedding…",
  "Retrieving context…",
  "Generating questions…",
  "Building your quiz…",
];

// centralised auth fetch — auto-logout on 401
const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
  return res;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("generate");

  // quiz settings — all sent to backend
  const [url, setUrl] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [bloom, setBloom] = useState(["Remember", "Understand", "Apply"]);
  const [model, setModel] = useState("llama-3.3-70b-versatile");

  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");

  const [results, setResults] = useState([]);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  const email = localStorage.getItem("userEmail") || "student";

  const loadResults = async () => {
  try {
    const userEmail = localStorage.getItem("userEmail");

    const res = await fetch(`${API}/history/${userEmail}`);
    const data = await res.json();

    setResults(data);
  } catch (err) {
    console.error("Error loading history:", err);
    setResults([]);
  }
};

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    if (tab === "notes") fetchNotes();
    if (tab === "history" || tab === "analytics") loadResults();
  }, [tab]);

  const toggleBloom = (lvl) =>
    setBloom((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );

  const handleGenerate = async () => {
    if (!url.trim()) { alert("Please enter a YouTube URL."); return; }
    if (bloom.length === 0) { alert("Select at least one Bloom level."); return; }

    setLoading(true);
    let i = 0;
    setLoadMsg(LOAD_MESSAGES[0]);
    const interval = setInterval(() => {
      i = (i + 1) % LOAD_MESSAGES.length;
      setLoadMsg(LOAD_MESSAGES[i]);
    }, 2500);

    try {
      const res = await authFetch("/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
          bloom_levels: bloom,        // e.g. ["Remember", "Analyze"]
          difficulty: difficulty,     // "Easy" | "Medium" | "Hard"
          num_questions: numQuestions,
          model, // 3–15
        }),
      });

      clearInterval(interval);
      if (!res) { setLoading(false); return; }

      const data = await res.json();
      if (data.error) { alert("Error: " + data.error); setLoading(false); return; }

      localStorage.setItem("quizData", JSON.stringify(data));
      navigate("/quiz");

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      alert("Cannot reach server. Is the backend running on port 8000?");
    }

    setLoading(false);
  };

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const res = await authFetch("/notes");
      if (!res) return;
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch { setNotes([]); }
    setNotesLoading(false);
  };

  const saveEdit = async (id) => {
    try {
      const res = await authFetch("/notes", {
        method: "PUT",
        body: JSON.stringify({ id, content: editContent }),
      });
      if (!res) return;
      setEditingNote(null);
      fetchNotes();
    } catch { alert("Failed to save note."); }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // analytics
  const chartData = results.map((r, i) => ({
    name: `#${i + 1}`, score: r.score, total: r.total,
    pct: Math.round((r.score / r.total) * 100),
  }));
  const avgScore = results.length
  ? (results.reduce((a, b) => a + Math.round((b.score / b.total) * 100), 0) / results.length).toFixed(1)
  : 0;

// Best score as best percentage
const best = results.length
  ? Math.max(...results.map((r) => Math.round((r.score / r.total) * 100)))
  : 0;
  let streak = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].score >= Math.ceil(results[i].total / 2)) streak++;
    else break;
  }

  return (
    <div className="dash-root">

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sb-hex">⬡</span>
          <span className="sb-name">EduQuiz</span>
          <span className="sb-ai">AI</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((n) => (
            <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{email[0]?.toUpperCase()}</div>
            <div className="user-info">
              <span className="user-email">{email}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main">
        <div className="dash-header">
          <h1 className="dash-title">
            {tab === "generate" && "Generate Quiz"}
            {tab === "analytics" && "Your Analytics"}
            {tab === "notes" && "Saved Notes"}
            {tab === "history" && "Quiz History"}
          </h1>
          <p className="dash-subtitle">
            {tab === "generate" && "Paste a YouTube URL and configure your quiz settings."}
            {tab === "analytics" && "Track your learning progress over time."}
            {tab === "notes" && "AI-generated summaries saved from your videos."}
            {tab === "history" && "Review all your past quiz attempts."}
          </p>
        </div>

        {/* ════ GENERATE ════ */}
        {tab === "generate" && (
          <div className="generate-layout">
            <div className="generate-main">

              <div className="url-card">
                <label className="url-label">YouTube URL</label>
                <div className="url-row">
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    className="url-input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                  <button className="gen-btn" onClick={handleGenerate} disabled={loading}>
                    {loading ? <span className="spinner" /> : "Generate →"}
                  </button>
                </div>

                {loading && (
                  <div className="load-status">
                    <span className="load-dot" />{loadMsg}
                  </div>
                )}

                {!loading && (
                  <div className="settings-summary">
                    <span className="ss-item"><span className="ss-key">Questions</span><span className="ss-val">{numQuestions}</span></span>
                    <span className="ss-sep">·</span>
                    <span className="ss-item"><span className="ss-key">Difficulty</span><span className="ss-val">{difficulty}</span></span>
                    <span className="ss-sep">·</span>
                    <span className="ss-item"><span className="ss-key">Levels</span><span className="ss-val">{bloom.length === 0 ? "None" : bloom.join(", ")}</span></span>
                  </div>
                )}
              </div>

              <div className="quick-stats">
                <div className="qs-card"><span className="qs-val">{results.length}</span><span className="qs-label">Total Quizzes</span></div>
                <div className="qs-card"><span className="qs-val">{avgScore}%</span><span className="qs-label">Avg Score</span></div>
                <div className="qs-card"><span className="qs-val">{best}%</span><span className="qs-label">Best Score</span></div>
                <div className="qs-card streak"><span className="qs-val">🔥 {streak}</span><span className="qs-label">Win Streak</span></div>
              </div>

              {results.length > 0 && (
                <div className="mini-chart">
                  <p className="chart-title">Recent Performance</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#606078", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#606078", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#13131f", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#a0a0b8" }} itemStyle={{ color: "#c4b5fd" }} />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          {/* SETTINGS PANEL */}
<div className="settings-panel">
  <h3 className="panel-title">⚙ Quiz Settings</h3>

  {/* MODEL SELECTOR */}
  <div className="setting-section">
    <p className="setting-label">AI Model</p>
    <select
      className="model-select"
      value={model}
      onChange={(e) => setModel(e.target.value)}
    >
      <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
      <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</option>
      <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
      <option value="gemma2-9b-it">Gemma2 9B</option>
    </select>
  </div>

  {/* NUMBER OF QUESTIONS */}
  <div className="setting-section">
    <div className="setting-row">
      <p className="setting-label">Number of Questions</p>
      <span className="setting-badge">{numQuestions}</span>
    </div>
    <input
      type="range" min="3" max="15" value={numQuestions}
      onChange={(e) => setNumQuestions(Number(e.target.value))}
      className="range-slider"
    />
    <div className="range-hints"><span>3</span><span>15</span></div>
  </div>

  {/* DIFFICULTY */}
  <div className="setting-section">
    <p className="setting-label">Difficulty</p>
    <div className="diff-row">
      {["Easy", "Medium", "Hard"].map((d) => (
        <button key={d} className={`diff-btn ${difficulty === d ? "active" : ""}`} onClick={() => setDifficulty(d)}>{d}</button>
      ))}
    </div>
  </div>

  {/* BLOOM LEVELS */}
  <div className="setting-section">
    <div className="setting-row">
      <p className="setting-label">Bloom's Levels</p>
      <span className="setting-badge">{bloom.length} selected</span>
    </div>
    <div className="bloom-grid">
      {BLOOM_ALL.map((lvl) => (
        <button
          key={lvl}
          className={`bloom-tag ${bloom.includes(lvl) ? "active" : ""}`}
          onClick={() => toggleBloom(lvl)}
          style={bloom.includes(lvl) ? {
            background: `${BLOOM_COLORS[lvl]}22`,
            border: `1px solid ${BLOOM_COLORS[lvl]}55`,
            color: BLOOM_COLORS[lvl],
          } : {}}
        >
          {lvl}
        </button>
      ))}
    </div>
  </div>

  <div className="bloom-legend">
    <p className="legend-title">About Bloom's Taxonomy</p>
    <p className="legend-desc">
      A 6-level cognitive framework. Higher levels (Analyze → Create) produce harder, more conceptual questions.
    </p>
  </div>
</div>
        </div>
        )}

        {/* ════ ANALYTICS ════ */}
        {tab === "analytics" && (
          <div className="analytics-layout">
            <div className="stats-row">
              {[
                { label: "Total Quizzes", val: results.length, icon: "📋" },
                { label: "Average Score", val: avgScore, icon: "📈" },
                { label: "Best Score", val: best, icon: "🏆" },
                { label: "Current Streak", val: `🔥 ${streak}`, icon: "" },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <span className="stat-icon">{s.icon}</span>
                  <span className="stat-num">{s.val}</span>
                  <span className="stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="big-chart">
              <p className="chart-title">Score History</p>
              {results.length === 0 ? (
                <div className="empty-state">No quiz data yet. Generate a quiz to start tracking!</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#606078", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#606078", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#13131f", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, fontSize: 13 }} labelStyle={{ color: "#a0a0b8" }} itemStyle={{ color: "#c4b5fd" }} />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6, fill: "#c4b5fd" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ════ NOTES ════ */}
        {tab === "notes" && (
          <div className="notes-layout">
            {notesLoading ? (
              <div className="empty-state">Loading notes…</div>
            ) : notes.length === 0 ? (
              <div className="empty-state">No notes yet. Notes are auto-generated when you create a quiz.</div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="note-card">
                  <div className="note-header">
                    <div>
                      <p className="note-title">{n.title || "Untitled Video"}</p>
                      <a className="note-url" href={n.url} target="_blank" rel="noreferrer">
                        {n.url?.length > 55 ? n.url.slice(0, 55) + "…" : n.url}
                      </a>
                    </div>
                    <button className="note-edit-btn" onClick={() => { setEditingNote(n.id); setEditContent(n.content); }}>✏ Edit</button>
                  </div>
                  {editingNote === n.id ? (
                    <div>
                      <textarea className="note-textarea" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className="note-save-btn" onClick={() => saveEdit(n.id)}>Save</button>
                        <button className="note-cancel-btn" onClick={() => setEditingNote(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="note-content">{n.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {tab === "history" && (
          <div className="history-layout">
            {results.length === 0 ? (
              <div className="empty-state">No quiz history yet.</div>
            ) : (
              [...results].reverse().map((r, i) => {
                const pct = Math.round((r.score / r.total) * 100);
                const grade = pct >= 80 ? "good" : pct >= 50 ? "mid" : "low";
                return (
                  <div key={i} className="history-card">
                    <div className="hist-left">
                      <span className={`hist-badge ${grade}`}>{pct >= 80 ? "✓" : pct >= 50 ? "~" : "✗"}</span>
                      <div>
                        <p className="hist-title">{r.title || `Attempt #${results.length - i}`}</p>
                        <p className="hist-date">Attempt #{results.length - i} · {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="hist-right">
                      <span className="hist-score">{r.score}/{r.total}</span>
                      <span className={`hist-pct ${grade}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .dash-root { display:flex; min-height:100vh; background:#080810; color:#e0e0f0; font-family:'DM Sans',sans-serif; }

        .dash-sidebar { width:240px; flex-shrink:0; background:rgba(255,255,255,0.02); border-right:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; padding:24px 16px; position:sticky; top:0; height:100vh; }
        .sidebar-brand { display:flex; align-items:center; gap:8px; padding:8px 12px; margin-bottom:32px; }
        .sb-hex { color:#8b5cf6; font-size:20px; }
        .sb-name { font-size:16px; font-weight:600; color:#f0f0fa; }
        .sb-ai { font-size:10px; font-weight:700; color:#a78bfa; border:1px solid rgba(139,92,246,0.3); padding:1px 5px; border-radius:4px; letter-spacing:1px; }
        .sidebar-nav { display:flex; flex-direction:column; gap:4px; flex:1; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border:none; background:none; color:#707088; font-size:14px; font-weight:500; cursor:pointer; border-radius:10px; font-family:'DM Sans',sans-serif; text-align:left; transition:all 0.15s; }
        .nav-item:hover { background:rgba(255,255,255,0.04); color:#c0c0d8; }
        .nav-item.active { background:rgba(139,92,246,0.15); color:#c4b5fd; border:1px solid rgba(139,92,246,0.2); }
        .nav-icon { font-size:16px; }
        .sidebar-footer { margin-top:auto; }
        .user-chip { display:flex; align-items:center; gap:10px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; margin-bottom:8px; }
        .user-avatar { width:32px; height:32px; background:linear-gradient(135deg,#7c3aed,#8b5cf6); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:white; flex-shrink:0; }
        .user-info { display:flex; flex-direction:column; min-width:0; }
        .user-email { font-size:12px; color:#c0c0d8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .user-role { font-size:11px; color:#505068; }
        .logout-btn { width:100%; padding:8px; background:none; border:1px solid rgba(255,255,255,0.06); border-radius:8px; color:#505068; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .logout-btn:hover { border-color:rgba(239,68,68,0.3); color:#fca5a5; }

        .dash-main { flex:1; padding:40px 48px; overflow-y:auto; min-width:0; }
        .dash-header { margin-bottom:36px; }
        .dash-title { font-family:'Instrument Serif',serif; font-size:32px; color:#f0f0fa; margin-bottom:6px; }
        .dash-subtitle { font-size:14px; color:#707088; }

        .generate-layout { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
        .generate-main {}

        .url-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px; margin-bottom:20px; }
        .url-label { display:block; font-size:12px; font-weight:500; letter-spacing:0.8px; text-transform:uppercase; color:#9090a8; margin-bottom:12px; }
        .url-row { display:flex; gap:10px; }
        .url-input { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 16px; color:#f0f0fa; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
        .url-input::placeholder { color:#404058; }
        .url-input:focus { border-color:rgba(139,92,246,0.4); }
        .gen-btn { padding:12px 24px; background:linear-gradient(135deg,#7c3aed,#8b5cf6); border:none; border-radius:10px; color:white; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; box-shadow:0 0 20px rgba(139,92,246,0.3); transition:transform 0.2s,box-shadow 0.2s; display:flex; align-items:center; min-width:130px; justify-content:center; }
        .gen-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 0 40px rgba(139,92,246,0.5); }
        .gen-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .load-status { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:13px; color:#9090a8; }
        .load-dot { width:8px; height:8px; background:#8b5cf6; border-radius:50%; flex-shrink:0; animation:pulse 1.2s ease-in-out infinite; }
        .settings-summary { display:flex; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap; }
        .ss-item { display:flex; align-items:center; gap:5px; }
        .ss-key { font-size:11px; color:#505068; text-transform:uppercase; letter-spacing:0.5px; }
        .ss-val { font-size:12px; color:#9090a8; font-weight:500; }
        .ss-sep { color:#303048; }

        .quick-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        .qs-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:4px; }
        .qs-card.streak { background:rgba(251,146,60,0.08); border-color:rgba(251,146,60,0.2); }
        .qs-val { font-size:22px; font-weight:700; color:#c4b5fd; font-family:'Instrument Serif',serif; }
        .qs-label { font-size:11px; color:#606078; }
        .mini-chart { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:20px 24px; }
        .chart-title { font-size:13px; font-weight:500; color:#9090a8; margin-bottom:16px; text-transform:uppercase; letter-spacing:0.8px; }

        .settings-panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; position:sticky; top:24px; }
        .panel-title { font-size:14px; font-weight:600; color:#c0c0d8; margin-bottom:24px; }
        .setting-section { margin-bottom:24px; }
        .setting-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .setting-label { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.8px; color:#606078; }
        .setting-badge { font-size:11px; font-weight:600; color:#a78bfa; background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.2); padding:2px 8px; border-radius:100px; }
        .range-slider { width:100%; accent-color:#8b5cf6; cursor:pointer; }
        .range-hints { display:flex; justify-content:space-between; font-size:10px; color:#404058; margin-top:4px; }
        .diff-row { display:flex; gap:6px; }
        .diff-btn { flex:1; padding:8px 0; border:1px solid rgba(255,255,255,0.08); background:none; color:#707088; font-size:12px; font-weight:500; cursor:pointer; border-radius:8px; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .diff-btn.active { background:rgba(139,92,246,0.15); border-color:rgba(139,92,246,0.3); color:#c4b5fd; }
        .bloom-grid { display:flex; flex-wrap:wrap; gap:6px; }
        .bloom-tag { padding:5px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#606078; font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .bloom-legend { background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.12); border-radius:10px; padding:14px; }
        .legend-title { font-size:12px; font-weight:600; color:#c4b5fd; margin-bottom:6px; }
        .legend-desc { font-size:12px; color:#707088; line-height:1.6; }

        .analytics-layout {}
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:24px; display:flex; flex-direction:column; gap:8px; }
        .stat-icon { font-size:20px; }
        .stat-num { font-size:32px; font-weight:700; color:#c4b5fd; font-family:'Instrument Serif',serif; }
        .stat-lbl { font-size:12px; color:#606078; }
        .big-chart { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:28px; }
        .empty-state { padding:60px 0; text-align:center; color:#505068; font-size:14px; }

        .notes-layout { display:flex; flex-direction:column; gap:16px; }
        .note-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:24px; }
        .note-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
        .note-title { font-size:16px; font-weight:600; color:#e0e0f0; margin-bottom:4px; font-family:'Instrument Serif',serif; }
        .note-url { font-size:12px; color:#8b5cf6; text-decoration:none; }
        .note-url:hover { text-decoration:underline; }
        .note-edit-btn { background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.2); color:#a78bfa; font-size:12px; cursor:pointer; padding:6px 12px; border-radius:7px; font-family:'DM Sans',sans-serif; flex-shrink:0; transition:all 0.15s; }
        .note-edit-btn:hover { background:rgba(139,92,246,0.2); }
        .note-content { font-size:14px; color:#9090a8; line-height:1.7; }
        .note-textarea { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px; color:#e0e0f0; font-size:14px; font-family:'DM Sans',sans-serif; resize:vertical; outline:none; line-height:1.6; }
        .note-save-btn { padding:8px 20px; background:linear-gradient(135deg,#7c3aed,#8b5cf6); border:none; border-radius:8px; color:white; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .note-cancel-btn { padding:8px 16px; background:none; border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#707088; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; }

        .history-layout { display:flex; flex-direction:column; gap:10px; }
        .history-card { display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px 20px; }
        .hist-left { display:flex; align-items:center; gap:14px; }
        .hist-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; }
        .hist-badge.good { background:rgba(52,211,153,0.15); color:#6ee7b7; }
        .hist-badge.mid { background:rgba(251,191,36,0.15); color:#fde68a; }
        .hist-badge.low { background:rgba(239,68,68,0.15); color:#fca5a5; }
        .hist-title { font-size:14px; font-weight:500; color:#c0c0d8; }
        .hist-date { font-size:12px; color:#505068; margin-top:2px; }
        .hist-right { display:flex; align-items:center; gap:12px; }
        .hist-score { font-size:16px; font-weight:600; color:#e0e0f0; }
        .hist-pct { font-size:13px; font-weight:600; padding:3px 10px; border-radius:6px; }
        .hist-pct.good { background:rgba(52,211,153,0.1); color:#6ee7b7; }
        .hist-pct.mid { background:rgba(251,191,36,0.1); color:#fde68a; }
        .hist-pct.low { background:rgba(239,68,68,0.1); color:#fca5a5; }

        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }

        .model-select {
        width: 100%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 10px 14px;
        color: #c0c0d8;
        font-size: 13px;
        font-family: 'DM Sans', sans-serif;
        outline: none;
        cursor: pointer;
        transition: border-color 0.2s;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23707088' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
      }
      .model-select:focus { border-color: rgba(139,92,246,0.4); }
      .model-select option { background: #13131f; color: #c0c0d8; }

        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(0.8); } }
      `}</style>
    </div>
  );
}