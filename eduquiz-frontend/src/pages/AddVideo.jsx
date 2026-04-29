import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddVideo() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!url) return alert("Enter YouTube URL");

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      console.log(data);

      // Store quiz data
      localStorage.setItem("quizData", JSON.stringify(data));

      navigate("/quiz");
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Add YouTube Video</h2>

      <input
        type="text"
        placeholder="Paste YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-3 w-96 rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Generate Quiz
      </button>
    </div>
  );
}