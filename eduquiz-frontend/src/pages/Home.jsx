import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-200 to-indigo-200 text-center">

      <h1 className="text-5xl font-bold mb-4">
        🧠 SmartQuiz AI
      </h1>

      <p className="text-lg text-gray-700 mb-6 max-w-md">
        Generate quizzes from videos using AI. Learn smarter, not harder.
      </p>

      <button
        onClick={() => navigate("/register")}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
      >
        Get Started
      </button>

    </div>
  );
}