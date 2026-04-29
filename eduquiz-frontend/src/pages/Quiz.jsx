import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const navigate = useNavigate();

  const quizData = JSON.parse(localStorage.getItem("quizData")) || {};
  const questions = quizData.questions || [];

  const [answers, setAnswers] = useState({});

  const handleSelect = (qIndex, option) => {
    setAnswers({ ...answers, [qIndex]: option });
  };

  const handleSubmit = () => {
    navigate("/result", { state: { questions, answers } });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-4">
        {quizData.title || "Quiz"}
      </h2>

      {questions.map((q, i) => (
        <div
          key={i}
          className="bg-white p-4 mb-4 rounded shadow-md"
        >
          <p className="font-semibold mb-2">{q.question}</p>

          {q.options.map((opt, j) => (
            <button
              key={j}
              onClick={() => handleSelect(i, opt)}
              className={`block w-full text-left p-2 mb-2 rounded border ${
                answers[i] === opt
                  ? "bg-blue-200"
                  : "hover:bg-gray-100"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ))}

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}