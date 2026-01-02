import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage"; // הוספה

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/dashboard" element={<div className="container mt-5"><h1>התחברת בהצלחה! אהובה</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;