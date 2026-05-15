import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async () => {

    setError("");
    setSuccess("");

    if (!email || !newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {

      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess("Password updated successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch {
      setError("Cannot reach server.");
    }
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
          Reset Password
        </h2>

        <p className="login-sub">
          Enter your new password below.
        </p>

        <div className="field-group">
          <label className="field-label">Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">New Password</label>

          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">
            Re-enter Password
          </label>

          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <button
          className="submit-btn"
          onClick={handleReset}
        >
          Update Password
        </button>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

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
          background:
            radial-gradient(
              ellipse 80% 60% at 50% 0%,
              rgba(139,92,246,0.15) 0%,
              transparent 70%
            );

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
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .brand-hex {
          font-size: 24px;
          color: #8b5cf6;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 600;
          color: #f0f0fa;
        }

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

        .field-group {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: #9090a8;
        }

        .field-input {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #f0f0fa;
          font-size: 14px;
          outline: none;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #8b5cf6;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
        }

        .alert {
          margin-top: 10px;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
        }

        .alert-error {
          background: rgba(248,113,113,0.12);
          color: #f87171;
        }

        .alert-success {
          background: rgba(52,211,153,0.12);
          color: #34d399;
        }
      `}</style>

    </div>
  );
}