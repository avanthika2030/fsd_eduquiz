import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { questions = [], answers = {} } = state || {};

  let score = 0;

  questions.forEach((q, i) => {
    if (answers[i] === q.correct_answer) score++;
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Result</h2>

        <p className="text-xl mb-6">
          Score: {score} / {questions.length}
        </p>

        <div className="text-left">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct_answer;

            return (
              <div
                key={i}
                className={`p-4 mb-4 rounded ${
                  isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p className="font-semibold">{q.question}</p>
                <p>Your Answer: {answers[i]}</p>
                <p>Correct Answer: {q.correct_answer}</p>
                <p className="text-sm text-gray-600">
                  Bloom Level: {q.bloom_level}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}