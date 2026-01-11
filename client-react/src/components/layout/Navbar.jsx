import { useNavigate } from "react-router-dom";
import { clearAuthData } from "../../utils/auth";
import SearchBar from "../SearchBar";
import { LOG_IN } from "../../consts/Login";
import { useTheme } from "../../contexts/ThemeContext";
import ProfilePic from "../ProfilePic"
import "./styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const username = localStorage.getItem("username");
  const profilePic = localStorage.getItem("profilePic")

  const userInitials = username.slice(0, 1).toUpperCase();

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light border-bottom px-4 py-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--border-color)', boxShadow: '0 1px 2px var(--shadow)' }}>
      <div className="d-flex align-items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
          alt="logo"
          width="30"
        />
        <span className="navbar-brand fw-normal fs-4 m-0" style={{ color: 'var(--text-secondary)' }}>
          Drive
        </span>
        <div className="dark-mode-toggle">
          <input
            type="checkbox"
            id="darkModeSwitch"
            checked={isDarkMode}
            onChange={toggleTheme}
          />
          <label htmlFor="darkModeSwitch" className="toggle-label">
            <span className="toggle-button"></span>
          </label>
        </div>
      </div>

      <SearchBar />

      <div className="d-flex align-items-center gap-3">
        <span
          className="small fw-bold"
          title={username}
          style={{ 
            color: "var(--text-secondary)",
            maxWidth: "120px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
            verticalAlign: "middle"
          }}
        >
          שלום, {username}
        </span>
        <ProfilePic 
          profilePic={profilePic} 
          displayName={username} 
          initials={userInitials} 
        />
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm rounded-pill px-3"
        >
          {LOG_IN.LOG_OUT}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
