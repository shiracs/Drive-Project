import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FilePage from "./pages/FilePage";
import DocumentViewPage from "./pages/DocumentViewPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchPage from "./pages/SearchPage";
import { SIDEBAR_MENU, SIDEBAR_PATHS } from "./consts/Sidebar";
import {
  SHARED_API_URL,
  OWNED_API_URL,
  RECENT_API_URL,
  STARRED_API_URL,
  TRASH_API_URL,
  SPAM_API_URL
} from "./consts/Urls";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
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
          <Route path={SIDEBAR_PATHS.HOME} element={<FilePage />} />
          <Route
            path="/shared"
            element={
              <FilePage
                customUrl={SHARED_API_URL}
                title={SIDEBAR_MENU.SHARED}
              />
            }
          />
          <Route
            path="/my-storage"
            element={
              <FilePage
                customUrl={OWNED_API_URL}
                title={SIDEBAR_MENU.MY_STORAGE}
              />
            }
          />
          <Route
            path="/recent"
            element={
              <FilePage
                customUrl={RECENT_API_URL}
                title={SIDEBAR_MENU.RECENT}
                subTitle={"מציג 5 אחרונים ששונו"}
              />
            }
          />
          <Route
            path="/starred"
            element={
              <FilePage
                customUrl={STARRED_API_URL}
                title={SIDEBAR_MENU.STARRED}
              />
            }
          />
          <Route
            path="/trash"
            element={
                <FilePage
                  customUrl={TRASH_API_URL}
                  title={SIDEBAR_MENU.TRASH}
                />
            }
          />
          <Route 
              path="/spam" 
              element={
                  <FilePage 
                      customUrl={SPAM_API_URL} 
                      title={SIDEBAR_MENU.SPAM} 
                  />
              } 
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
