import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FilePage from "./pages/FilePage";
import DocumentViewPage from "./pages/DocumentViewPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { SIDEBAR_PATHS } from "./consts/Sidebar";
import SearchPage from "./pages/SearchPage";
import { API_BASE_URL } from "./consts/Urls";
import { clearAuthData, getTokenHeader } from "./utils/auth";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const auth = getTokenHeader();
      
      // If there's a token, verify it's still valid
      if (auth.Authorization) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'GET',
            headers: auth
          });
          
          // If token is invalid clear auth data and redirect to login
          if (response.status === 401 || response.status === 403) {
            clearAuthData();
            window.location.href = '/login';
          }
        } catch (error) {
          // If server is unreachable, clear token as it's likely invalid
          clearAuthData();
          window.location.href = '/login';
        }
      }
    };
    
    validateToken();
  }, []);

  return (
    <ThemeProvider>
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
          <Route
            path={`/${SIDEBAR_PATHS.HOME}/:folderId?`}
            element={<FilePage />}
          />
          <Route path="/search" element={<SearchPage />} />
          <Route
            path="/"
            element={<Navigate to={SIDEBAR_PATHS.HOME} replace />}
          />
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
    </ThemeProvider>
  );
}

export default App;
