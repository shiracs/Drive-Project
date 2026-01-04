import { Link, useLocation } from 'react-router-dom';
import { SIDEBAR_MENU, SIDEBAR_PATHS } from '../../consts/Sidebar';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: SIDEBAR_MENU.HOME, icon: "bi-house-door", path: SIDEBAR_PATHS.HOME },
    { name: SIDEBAR_MENU.MY_DRIVE, icon: "bi-hdd-stack", path: SIDEBAR_PATHS.MY_DRIVE },
    { name: SIDEBAR_MENU.SHARED, icon: "bi-people", path: SIDEBAR_PATHS.SHARED },
    { name: SIDEBAR_MENU.RECENT, icon: "bi-clock-history", path: SIDEBAR_PATHS.RECENT },
    { name: SIDEBAR_MENU.STARRED, icon: "bi-star", path: SIDEBAR_PATHS.STARRED },
    { name: SIDEBAR_MENU.TRASH, icon: "bi-trash3", path: SIDEBAR_PATHS.TRASH },
    { name: SIDEBAR_MENU.STORAGE, icon: "bi-cloud-check", path: SIDEBAR_PATHS.STORAGE },
  ];

  return (
    <div className="bg-white pt-4" style={{ width: "250px", minHeight: "100vh" }} dir="rtl">
      <div className="px-3 mb-4">
        <button className="google-new-btn">
          <svg width="24" height="24" viewBox="0 0 36 36">
            <path fill="#34A853" d="M16 16v14h4V20z" />
            <path fill="#4285F4" d="M30 16H20l-4 4h14z" />
            <path fill="#FBBC05" d="M6 16v4h10l4-4z" />
            <path fill="#EA4335" d="M20 16V6h-4v14z" />
            <path fill="none" d="M0 0h36v36H0z" />
          </svg>
          <span className="fw-medium ms-2">{SIDEBAR_MENU.NEW_BTN}</span>
        </button>
      </div>

      <ul className="list-unstyled pe-0">
        {menuItems.map((item, index) => (
          <li key={index} className="mb-1">
            <Link 
              to={item.path} 
              className={`sidebar-item text-decoration-none ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-4 mt-4 pt-4 border-top">
        <div className="progress mb-2" style={{ height: "4px" }}>
          <div className="progress-bar" style={{ width: "45%" }}></div>
        </div>
        <small className="text-secondary" style={{ fontSize: "12px" }}>
           6.7GB מתוך 15GB בשימוש
        </small>
      </div>
    </div>
  );
};

export default Sidebar;