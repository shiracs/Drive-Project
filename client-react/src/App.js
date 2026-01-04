import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import FilePage from "./pages/FilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* default route redirects to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* main page that displays files */}
        <Route path="/dashboard" element={<FilePage />} /> 
      </Routes>
    </Router>
  );
}

export default App;