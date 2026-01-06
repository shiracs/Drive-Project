import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import your pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import FilePage from "./pages/FilePage";
import DocumentViewPage from "./pages/DocumentViewPage";
import MainLayout from "./components/layout/MainLayout";
import { SIDEBAR_PATHS } from "./consts/Sidebar";

function App() {
  return (
    <Router>
      <Routes>
        {/* Test route for the white paper - no layout wrappers */}
        <Route path="/test-view" element={<DocumentViewPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Routes with Sidebar */}
        <Route element={<MainLayout />}>
          <Route path={SIDEBAR_PATHS.HOME} element={<FilePage />} />
          <Route path={SIDEBAR_PATHS.MY_DRIVE} element={<Dashboard />} />
          <Route
            path="/"
            element={<Navigate to={SIDEBAR_PATHS.HOME} replace />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;