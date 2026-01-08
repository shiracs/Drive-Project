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
import DocumentViewPage from "./pages/DocumentViewPage";
import MainLayout from "./components/layout/MainLayout";
import { SIDEBAR_PATHS } from "./consts/Sidebar";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/files/:id" element={<DocumentViewPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<MainLayout />}>
          <Route path={SIDEBAR_PATHS.HOME} element={<FilePage />} />
          <Route path={SIDEBAR_PATHS.MY_DRIVE} element={<Dashboard />} />
          
          <Route
            path="/"
            element={<Navigate to={SIDEBAR_PATHS.HOME} replace />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;