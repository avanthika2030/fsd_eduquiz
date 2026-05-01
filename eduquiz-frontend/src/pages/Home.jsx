import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="home-root">
      <canvas ref={canvasRef} className="home-canvas" />

      <nav className="home-nav">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">EduQuiz</span>
          <span className="logo-ai">AI</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="nav-btn-primary" onClick={() => navigate("/login")}>Get Started</button>
        </div>
      </nav>

      <main className="home-main">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Powered by Groq · LLaMA 3.3 · RAG
        </div>

        <h1 className="hero-title">
          Turn any YouTube video<br />
          <span className="hero-title-gradient">into mastery.</span>
        </h1>

        <p className="hero-sub">
          Paste a link. Our AI reads the transcript, generates Bloom's Taxonomy
          quizzes, and gives you instant feedback — all in seconds.
        </p>

        <div className="hero-cta">
          <button className="cta-primary" onClick={() => navigate("/login")}>
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="cta-secondary" onClick={() => navigate("/login")}>
            View demo
          </button>
        </div>

        <div className="hero-stats">
          {[
            { val: "Bloom's", label: "Taxonomy Framework" },
            { val: "RAG", label: "Context Retrieval" },
            { val: "5 sec", label: "Quiz Generation" },
          ].map((s) => (
            <div key={s.label} className="stat-pill">
              <span className="stat-val">{s.val}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </main>

      <section className="features-section">
        {[
          {
            icon: "🎥",
            title: "Video Intelligence",
            desc: "Paste any YouTube URL — our RAG engine extracts and indexes the full transcript with semantic search.",
          },
          {
            icon: "🧠",
            title: "Bloom's Taxonomy",
            desc: "Questions span Remember, Understand, Apply, Analyze, Evaluate & Create — not just rote recall.",
          },
          {
            icon: "⚡",
            title: "Instant Results",
            desc: "Score, review, explanations, and performance analytics delivered immediately after each attempt.",
          },
          {
            icon: "📓",
            title: "AI-Generated Notes",
            desc: "Every video generates a structured summary saved to your personal notes library.",
          },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        <span>© 2025 EduQuiz AI — Built with Groq + FastAPI</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .home-root {
          min-height: 100vh;
          background: #080810;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .home-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .home-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          background: rgba(8,8,16,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(139,92,246,0.12);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 18px;
        }

        .logo-icon { color: #8b5cf6; font-size: 22px; }
        .logo-text { color: #f0f0fa; }
        .logo-ai {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          border: 1px solid rgba(139,92,246,0.3);
          -webkit-text-fill-color: unset;
          color: #a78bfa;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .nav-actions { display: flex; gap: 12px; align-items: center; }

        .nav-btn-ghost {
          background: none;
          border: none;
          color: #a0a0b8;
          font-size: 14px;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-btn-ghost:hover { color: #f0f0fa; }

        .nav-btn-primary {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 20px;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .home-main {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8b5cf6;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.2);
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 40px;
          animation: fadeUp 0.6s ease both;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hero-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(42px, 7vw, 88px);
          line-height: 1.05;
          letter-spacing: -1px;
          color: #f0f0fa;
          margin-bottom: 24px;
          animation: fadeUp 0.6s ease 0.1s both;
        }

        .hero-title-gradient {
          font-style: italic;
          background: linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 50%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          max-width: 520px;
          font-size: 17px;
          line-height: 1.7;
          color: #9090a8;
          margin-bottom: 40px;
          animation: fadeUp 0.6s ease 0.2s both;
        }

        .hero-cta {
          display: flex;
          gap: 12px;
          margin-bottom: 56px;
          animation: fadeUp 0.6s ease 0.3s both;
        }

        .cta-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border: none;
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          padding: 14px 28px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 40px rgba(139,92,246,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 60px rgba(139,92,246,0.6);
        }

        .cta-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c0c0d8;
          font-size: 16px;
          cursor: pointer;
          padding: 14px 28px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, color 0.2s;
        }
        .cta-secondary:hover { background: rgba(255,255,255,0.08); color: #f0f0fa; }

        .hero-stats {
          display: flex;
          gap: 16px;
          animation: fadeUp 0.6s ease 0.4s both;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 16px 24px;
          border-radius: 12px;
          min-width: 120px;
        }

        .stat-val {
          font-size: 20px;
          font-weight: 700;
          color: #c4b5fd;
          font-family: 'Instrument Serif', serif;
        }

        .stat-label {
          font-size: 11px;
          color: #6060780;
          color: #606078;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .features-section {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1px;
          background: rgba(139,92,246,0.1);
          border-top: 1px solid rgba(139,92,246,0.1);
          border-bottom: 1px solid rgba(139,92,246,0.1);
        }

        .feature-card {
          background: #080810;
          padding: 48px 40px;
          transition: background 0.3s;
        }
        .feature-card:hover { background: rgba(139,92,246,0.05); }

        .feature-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          color: #e8e8f0;
          margin-bottom: 12px;
          font-family: 'Instrument Serif', serif;
        }

        .feature-desc {
          font-size: 14px;
          line-height: 1.7;
          color: #707088;
        }

        .home-footer {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 32px;
          font-size: 13px;
          color: #404058;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}