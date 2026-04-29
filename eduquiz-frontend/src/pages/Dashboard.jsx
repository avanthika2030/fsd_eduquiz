import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const history = JSON.parse(localStorage.getItem("history")) || [];

  const chartData = history.map((h, i) => ({
    name: `Quiz ${i + 1}`,
    score: h.score,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-6">

      <h1 className="text-4xl font-bold mb-2">
        Welcome to <span className="text-purple-600">SmartQuiz AI</span>
      </h1>

      <p className="text-gray-600 mb-8">
        Generate intelligent quizzes from videos instantly 🚀
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        <div
          onClick={() => navigate("/add-video")}
          className="backdrop-blur-lg bg-white/30 border border-white/20 p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
        >
          📺 Add Video
        </div>

        <div
          onClick={() => navigate("/quiz")}
          className="backdrop-blur-lg bg-white/30 border border-white/20 p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
        >
          🧪 Generate Quiz
        </div>

        <div
          onClick={() => navigate("/history")}
          className="backdrop-blur-lg bg-white/30 border border-white/20 p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
        >
          📚 History
        </div>

        <div
          onClick={() => navigate("/notes")}
          className="backdrop-blur-lg bg-white/30 border border-white/20 p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
        >
          📝 Notes
        </div>

      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Performance Analytics</h2>

        {chartData.length === 0 ? (
          <p>No quiz data yet</p>
        ) : (
          <BarChart width={500} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#8b5cf6" />
          </BarChart>
        )}
      </div>

    </div>
  );
}