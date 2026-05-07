import { useEffect, useState } from "react";

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");

        const res = await fetch(`http://localhost:5000/api/history/${userEmail}`);
        const data = await res.json();

        setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Quiz History</h2>

      {history.length === 0 ? (
        <p>No history available</p>
      ) : (
        history.map((h, i) => (
          <div key={i} className="bg-white p-4 rounded shadow mb-4">
            <p className="font-semibold">{h.title}</p>
            <p>Date: {new Date(h.date).toLocaleString()}</p>
            <p>Score: {h.score} / {h.total}</p>

            {/* Optional: clickable video */}
            {h.url && (
              <a href={h.url} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                Watch Video
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}