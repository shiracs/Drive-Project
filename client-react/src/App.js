import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import FilePage from "./pages/FilePage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { SIDEBAR_PATHS } from "./consts/Sidebar"

function App() {
  return (
    <Router>
      <Routes>
        {/* Login and Registration routes - no protection needed */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Anything inside this route requires authentication */}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path={SIDEBAR_PATHS.HOME} element={<FilePage />} />
          <Route path={SIDEBAR_PATHS.MY_DRIVE} element={<Dashboard />} />
          
          {/* When user is authenticated, redirect root to home page */}
          <Route
            path="/"
            element={<Navigate to={SIDEBAR_PATHS.HOME} replace />}
          />
        </Route>

        {/* When user is NOT authenticated, redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
