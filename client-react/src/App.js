import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SharedPage from "./pages/SharedPage";
import FilePage from "./pages/FilePage";
import DocumentViewPage from "./pages/DocumentViewPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { SIDEBAR_PATHS } from "./consts/Sidebar";
import SearchPage from "./pages/SearchPage";
import MyStoragePage from "./pages/MyStoragePage";

function App() {
  return (
    <Router>
      <Routes>
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
          <Route path={`/${SIDEBAR_PATHS.HOME}/:folderId?`} element={<FilePage />} />
          <Route path={SIDEBAR_PATHS.SHARED} element={<SharedPage />} />
          <Route path={SIDEBAR_PATHS.MY_STORAGE} element={<MyStoragePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/" element={<Navigate to={SIDEBAR_PATHS.HOME} replace />} />
        </Route>

        <Route
          path="/files/:id"
          element={
            <ProtectedRoute>
              <DocumentViewPage />
            </ProtectedRoute>
          }
        />

        {/* When user is NOT authenticated, redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
