import { useNavigate } from "react-router-dom";
import { useState } from "react";

const API = "http://127.0.0.1:5000/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.error) { setError(data.error); setLoading(false); return; }
        setSuccess("Account created! Signing you in…");
        // auto login
        const loginRes = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginData.access_token) {
          localStorage.setItem("token", loginData.access_token);
          localStorage.setItem("userEmail", email);
          navigate("/dashboard");
        }
      } else {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.error) { setError(data.error); setLoading(false); return; }
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userEmail", email);
        navigate("/dashboard");
      }
    } catch {
      setError("Cannot reach server. Is the backend running?");
    }

    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-brand">
          <span className="brand-hex">⬡</span>
          <span className="brand-name">EduQuiz AI</span>
        </div>

        <h2 className="login-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="login-sub">
          {mode === "login"
            ? "Sign in to continue your learning journey."
            : "Start learning smarter with AI today."}
        </p>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >Sign In</button>
          <button
            className={`mode-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
          >Register</button>
        </div>

        <div className="field-group">
          <label className="field-label">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <span className="spinner" />
          ) : (
            mode === "login" ? "Sign In" : "Create Account"
          )}
        </button>

        <p className="login-footer-text">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          min-height: 100vh;
          background: #080810;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
        }

        .login-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          animation: slideUp 0.5s ease both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .brand-hex { font-size: 24px; color: #8b5cf6; }
        .brand-name { font-size: 18px; font-weight: 600; color: #f0f0fa; }

        .login-title {
          font-family: 'Instrument Serif', serif;
          font-size: 30px;
          color: #f0f0fa;
          margin-bottom: 8px;
        }

        .login-sub {
          font-size: 14px;
          color: #707088;
          margin-bottom: 28px;
        }

        .mode-toggle {
          display: flex;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 28px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .mode-btn {
          flex: 1;
          padding: 8px;
          border: none;
          background: none;
          color: #707088;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: rgba(139,92,246,0.2);
          color: #c4b5fd;
          border: 1px solid rgba(139,92,246,0.3);
        }

        .field-group {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: #9090a8;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 16px;
          color: #f0f0fa;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .field-input::placeholder { color: #404058; }
        .field-input:focus { border-color: rgba(139,92,246,0.5); }

        .alert {
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .alert-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .alert-success {
          background: rgba(52,211,153,0.1);
          border: 1px solid rgba(52,211,153,0.2);
          color: #6ee7b7;
        }

        .submit-btn {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 30px rgba(139,92,246,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 50px rgba(139,92,246,0.5);
        }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer-text {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #404058;
        }
      `}</style>
    </div>
  );
}