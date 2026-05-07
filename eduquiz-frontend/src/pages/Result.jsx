import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const saved = useRef(false);

  const { questions = [], answers = {} } = state || {};

  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct || answers[i] === q.correct_answer) score++;
  });

  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const grade =
    percentage >= 90 ? { label: "Excellent", color: "#34d399", bg: "rgba(52,211,153,0.08)" } :
    percentage >= 75 ? { label: "Great", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" } :
    percentage >= 50 ? { label: "Good", color: "#fbbf24", bg: "rgba(251,191,36,0.08)" } :
    { label: "Keep Practicing", color: "#f87171", bg: "rgba(248,113,113,0.08)" };

  useEffect(() => {
  if (!saved.current && questions.length > 0) {
    saved.current = true;

    const quizData = JSON.parse(localStorage.getItem("quizData")) || {};
    const stored = JSON.parse(localStorage.getItem("quizResults")) || [];

    const newEntry = {
      score,
      total: questions.length,
      date: new Date().toISOString(),
      title: quizData.title || "Untitled Quiz",
    };

    // 🔹 keep localStorage (optional, for quick UI)
    stored.push(newEntry);
    localStorage.setItem("quizResults", JSON.stringify(stored));

    // 🔥 ADD THIS PART (backend save)
    const saveHistory = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail"); // make sure you store this during login

        await fetch("http://localhost:5000/api/history/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            video_url: quizData.video_url || "",
            title: newEntry.title,
            score: score,
            total: questions.length,
          }),
        });
      } catch (err) {
        console.error("Failed to save history:", err);
      }
    };

    saveHistory();
  }
}, []);

  return (
    <div className="result-root">
      <header className="result-header">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </header>

      {/* SCORE HERO */}
      <div className="score-hero">
        <div className="score-ring-wrap">
          <svg className="score-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={grade.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 1.2s ease" }}
            />
          </svg>
          <div className="score-inner">
            <span className="score-pct">{percentage}%</span>
          </div>
        </div>

        <div className="score-info">
          <div className="grade-badge" style={{ background: grade.bg, color: grade.color, border: `1px solid ${grade.color}33` }}>
            {grade.label}
          </div>
          <h1 className="result-title">
            {score} out of {questions.length} correct
          </h1>
          <p className="result-sub">
            {percentage >= 80
              ? "Outstanding work! You've mastered this material."
              : percentage >= 50
              ? "Good effort! Review the explanations below to improve."
              : "Keep going — every attempt builds understanding."}
          </p>
          <div className="result-actions">
            <button className="ra-primary" onClick={() => navigate("/dashboard")}>
              Generate New Quiz
            </button>
            <button className="ra-secondary" onClick={() => navigate("/dashboard")}>
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* REVIEW */}
      <div className="review-section">
        <h2 className="review-heading">Review Answers</h2>
        <div className="review-list">
          {questions.map((q, i) => {
            const correct = q.correct_answer || q.correct;
            const isCorrect = answers[i] === correct;
            const bloom = q.bloom_level;

            return (
              <div key={i} className={`review-card ${isCorrect ? "correct" : "wrong"}`}>
                <div className="review-card-header">
                  <div className="review-meta">
                    <span className={`review-badge ${isCorrect ? "correct" : "wrong"}`}>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                    {bloom && (
                      <span className="review-bloom">{bloom}</span>
                    )}
                  </div>
                  <span className="review-qnum">Q{i + 1}</span>
                </div>

                <p className="review-question">{q.question}</p>

                <div className="review-answers">
                  <div className={`review-answer your ${isCorrect ? "correct" : "wrong"}`}>
                    <span className="ra-label">Your answer</span>
                    <span className="ra-val">{answers[i] || "Not answered"}</span>
                  </div>
                  {!isCorrect && (
                    <div className="review-answer correct-ans">
                      <span className="ra-label">Correct answer</span>
                      <span className="ra-val">{correct}</span>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div className="review-explanation">
                    <span className="re-icon">💡</span>
                    <span className="re-text">{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .result-root {
          min-height: 100vh;
          background: #080810;
          color: #e0e0f0;
          font-family: 'DM Sans', sans-serif;
          padding-bottom: 80px;
        }

        .result-header {
          padding: 24px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .back-link {
          background: none;
          border: none;
          color: #606078;
          font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .back-link:hover { color: #c4b5fd; }

        .score-hero {
          max-width: 900px;
          margin: 0 auto;
          padding: 64px 48px;
          display: flex;
          align-items: center;
          gap: 64px;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .score-ring-wrap {
          position: relative;
          flex-shrink: 0;
          width: 160px;
          height: 160px;
        }

        .score-ring {
          width: 160px;
          height: 160px;
        }

        .score-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-pct {
          font-family: 'Instrument Serif', serif;
          font-size: 36px;
          color: #f0f0fa;
          line-height: 1;
        }

        .score-info { flex: 1; }

        .grade-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 16px;
        }

        .result-title {
          font-family: 'Instrument Serif', serif;
          font-size: 36px;
          color: #f0f0fa;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .result-sub {
          font-size: 15px;
          color: #707088;
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 420px;
        }

        .result-actions { display: flex; gap: 12px; }

        .ra-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 20px rgba(139,92,246,0.3);
          transition: all 0.2s;
        }
        .ra-primary:hover { transform: translateY(-1px); box-shadow: 0 0 36px rgba(139,92,246,0.5); }

        .ra-secondary {
          padding: 12px 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #c0c0d8;
          font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .ra-secondary:hover { background: rgba(255,255,255,0.08); }

        .review-section {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 48px;
        }

        .review-heading {
          font-family: 'Instrument Serif', serif;
          font-size: 24px;
          color: #e0e0f0;
          margin-bottom: 20px;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-card {
          border-radius: 14px;
          padding: 20px 24px;
          border: 1px solid;
          animation: fadeUp 0.3s ease both;
        }
        .review-card.correct {
          background: rgba(52,211,153,0.04);
          border-color: rgba(52,211,153,0.15);
        }
        .review-card.wrong {
          background: rgba(239,68,68,0.04);
          border-color: rgba(239,68,68,0.12);
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .review-meta { display: flex; align-items: center; gap: 8px; }

        .review-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .review-badge.correct { background: rgba(52,211,153,0.12); color: #6ee7b7; }
        .review-badge.wrong { background: rgba(239,68,68,0.1); color: #fca5a5; }

        .review-bloom {
          font-size: 11px;
          color: #8b5cf6;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          padding: 3px 8px;
          border-radius: 5px;
        }

        .review-qnum {
          font-size: 12px;
          color: #505068;
          font-weight: 600;
        }

        .review-question {
          font-size: 15px;
          color: #c0c0d8;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .review-answers {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .review-answer {
          flex: 1;
          min-width: 200px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .review-answer.correct-ans { border-color: rgba(52,211,153,0.2); }
        .review-answer.your.correct { border-color: rgba(52,211,153,0.2); }
        .review-answer.your.wrong { border-color: rgba(239,68,68,0.15); }

        .ra-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #505068;
          margin-bottom: 4px;
        }

        .ra-val { font-size: 13px; color: #c0c0d8; line-height: 1.4; display: block; }

        .review-explanation {
          display: flex;
          gap: 10px;
          background: rgba(139,92,246,0.05);
          border: 1px solid rgba(139,92,246,0.1);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .re-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .re-text { font-size: 13px; color: #807098; line-height: 1.6; }
      `}</style>
    </div>
  );
}