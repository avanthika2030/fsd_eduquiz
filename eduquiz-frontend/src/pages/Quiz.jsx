import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BLOOM_COLORS = {
  Remember: "#6366f1", Understand: "#8b5cf6", Apply: "#a855f7",
  Analyze: "#d946ef", Evaluate: "#ec4899", Create: "#f43f5e",
};

export default function Quiz() {
  const navigate = useNavigate();
  const quizData = JSON.parse(localStorage.getItem("quizData"));
  const questions = quizData?.questions || [];
  const title = quizData?.title || "Quiz";

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  if (!questions.length) {
    return (
      <div className="quiz-empty">
        <p>No quiz found. Go back and generate one.</p>
        <button onClick={() => navigate("/dashboard")}>← Back</button>
        <style>{`.quiz-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#080810;color:#9090a8;gap:16px;font-family:'DM Sans',sans-serif; } .quiz-empty button{background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);color:#c4b5fd;padding:10px 20px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;}`}</style>
      </div>
    );
  }

  const q = questions[current];
  const correctAns = q.correct_answer || q.correct;
  const bloomColor = BLOOM_COLORS[q.bloom_level] || "#8b5cf6";
  const progress = ((current + 1) / questions.length) * 100;

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
  };

  const handleReveal = () => setRevealed(true);

  const handleNext = () => {
    const updatedAnswers = { ...answers, [current]: selected };
    setAnswers(updatedAnswers);
    setSelected(null);
    setRevealed(false);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      navigate("/result", { state: { questions, answers: updatedAnswers } });
    }
  };

  const optionState = (opt) => {
    if (!revealed) return selected === opt ? "selected" : "default";
    if (opt === correctAns) return "correct";
    if (opt === selected && opt !== correctAns) return "wrong";
    return "dim";
  };

  return (
    <div className="quiz-root">
      {/* HEADER */}
      <header className="quiz-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
        <div className="quiz-meta">
          <span className="quiz-title-small">{title}</span>
          <span className="quiz-count">{current + 1} / {questions.length}</span>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="progress-bar-wrap">
        <div className="progress-bar" style={{ width: `${progress}%`, background: bloomColor }} />
      </div>

      <div className="quiz-body">
        {/* BLOOM BADGE */}
        <div className="bloom-badge" style={{ background: `${bloomColor}22`, border: `1px solid ${bloomColor}44`, color: bloomColor }}>
          {q.bloom_level || "Question"} · {q.difficulty || ""}
        </div>

        {/* QUESTION */}
        <h2 className="question-text">{q.question}</h2>

        {/* OPTIONS */}
        <div className="options-grid">
          {q.options?.map((opt, i) => {
            const state = optionState(opt);
            return (
              <button
                key={i}
                className={`option-btn ${state}`}
                onClick={() => handleSelect(opt)}
              >
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="opt-text">{opt.replace(/^[A-D]\)\s*/, "")}</span>
                {revealed && opt === correctAns && <span className="opt-mark">✓</span>}
                {revealed && opt === selected && opt !== correctAns && <span className="opt-mark">✗</span>}
              </button>
            );
          })}
        </div>

        {/* EXPLANATION */}
        {revealed && q.explanation && (
          <div className="explanation-box">
            <p className="exp-title">💡 Explanation</p>
            <p className="exp-text">{q.explanation}</p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="quiz-actions">
          {!revealed ? (
            <button
              className="action-btn secondary"
              onClick={handleReveal}
              disabled={!selected}
            >
              Check Answer
            </button>
          ) : (
            <button className="action-btn primary" onClick={handleNext}>
              {current + 1 < questions.length ? "Next Question →" : "See Results →"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .quiz-root {
          min-height: 100vh;
          background: #080810;
          color: #e0e0f0;
          font-family: 'DM Sans', sans-serif;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .back-btn {
          background: none;
          border: none;
          color: #606078;
          font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #c4b5fd; }

        .quiz-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .quiz-title-small {
          font-size: 12px;
          color: #505068;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .quiz-count {
          font-size: 13px;
          font-weight: 600;
          color: #9090a8;
        }

        .progress-bar-wrap {
          height: 3px;
          background: rgba(255,255,255,0.06);
        }
        .progress-bar {
          height: 100%;
          border-radius: 0 2px 2px 0;
          transition: width 0.4s ease, background 0.4s;
        }

        .quiz-body {
          max-width: 680px;
          margin: 0 auto;
          padding: 56px 24px;
          animation: fadeUp 0.3s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bloom-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 20px;
        }

        .question-text {
          font-family: 'Instrument Serif', serif;
          font-size: 26px;
          line-height: 1.4;
          color: #f0f0fa;
          margin-bottom: 32px;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #c0c0d8;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
          width: 100%;
        }

        .option-btn:hover:not(:disabled) {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.2);
        }

        .option-btn.selected {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.4);
          color: #e0e0f0;
        }

        .option-btn.correct {
          background: rgba(52,211,153,0.1);
          border-color: rgba(52,211,153,0.4);
          color: #6ee7b7;
        }

        .option-btn.wrong {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        .option-btn.dim {
          opacity: 0.4;
        }

        .opt-letter {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          color: #9090a8;
        }

        .option-btn.selected .opt-letter { background: rgba(139,92,246,0.3); color: #c4b5fd; }
        .option-btn.correct .opt-letter { background: rgba(52,211,153,0.2); color: #6ee7b7; }
        .option-btn.wrong .opt-letter { background: rgba(239,68,68,0.15); color: #fca5a5; }

        .opt-text { flex: 1; line-height: 1.4; }
        .opt-mark { font-size: 16px; font-weight: 700; margin-left: auto; }

        .explanation-box {
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 24px;
          animation: fadeUp 0.25s ease both;
        }

        .exp-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #9b72cf;
          margin-bottom: 8px;
        }

        .exp-text {
          font-size: 14px;
          color: #9090a8;
          line-height: 1.7;
        }

        .quiz-actions { display: flex; gap: 10px; }

        .action-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          box-shadow: 0 0 24px rgba(139,92,246,0.3);
        }
        .action-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 0 40px rgba(139,92,246,0.5); }

        .action-btn.secondary {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c0c0d8;
        }
        .action-btn.secondary:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
        .action-btn.secondary:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}