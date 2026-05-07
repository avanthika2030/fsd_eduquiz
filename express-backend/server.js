const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const historyRoutes = require("./routes/historyRoutes");
const notesRoutes = require("./routes/notesRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/notes", notesRoutes);

app.listen(5000, () => {
  console.log("Express server running on port 5000");
});