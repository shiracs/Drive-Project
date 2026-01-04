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
import { SIDEBAR_PATHS } from "./consts/Sidebar"

function App() {
  return (
    <Router>
      <Routes>
        {/* Login and Register Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Pages under MainLayout */}
        <Route element={<MainLayout />}>
          
          <Route path={SIDEBAR_PATHS.HOME} element={<FilePage />} />
          <Route path={SIDEBAR_PATHS.MY_DRIVE} element={<Dashboard />} />{" "}
          {/* <Route path={SIDEBAR_PATHS.SHARED} element={<SharedPage />} />
          <Route path={SIDEBAR_PATHS.RECENT} element={<RecentPage />} />
          <Route path={SIDEBAR_PATHS.STARRED} element={<StarredPage />} />
          <Route path={SIDEBAR_PATHS.TRASH} element={<TrashPage />} />
          <Route path={SIDEBAR_PATHS.STORAGE} element={<StoragePage />} /> */}
          <Route
            path="/"
            element={<Navigate to={SIDEBAR_PATHS.HOME} replace />}
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
