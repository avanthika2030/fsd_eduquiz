export default function Notes() {
  const [notes, setNotes] = useState(
    localStorage.getItem("notes") || ""
  );

  const saveNotes = () => {
    localStorage.setItem("notes", notes);
    alert("Saved!");
  };

  return (
    <div className="max-w-xl mx-auto">

      <h2 className="text-2xl font-bold mb-4">Notes</h2>

      <textarea
        className="w-full border p-3 rounded mb-4"
        rows="10"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Save Notes
      </button>

    </div>
  );
}