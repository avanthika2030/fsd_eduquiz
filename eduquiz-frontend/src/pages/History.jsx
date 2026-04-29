export default function History() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Quiz History</h2>

      {history.length === 0 ? (
        <p>No history available</p>
      ) : (
        history.map((h, i) => (
          <div key={i} className="bg-white p-4 rounded shadow mb-4">
            <p className="font-semibold">Attempt {i + 1}</p>
            <p>Date: {h.date}</p>
            <p>Score: {h.score} / {h.total}</p>
          </div>
        ))
      )}
    </div>
  );
}