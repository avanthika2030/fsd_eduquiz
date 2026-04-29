import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddVideo from "./pages/AddVideo";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import History from "./pages/History";
import Notes from "./pages/Notes";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-video" element={<AddVideo />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/notes" element={<Notes />} />
        </Routes>
      </div>

    </BrowserRouter>
  );
}

export default App;