import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 flex justify-between items-center shadow-md">

      <h1
        className="font-bold text-lg cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        🧠 SmartQuiz AI
      </h1>

      <div className="space-x-6">
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}