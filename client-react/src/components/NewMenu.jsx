import { useState, useRef, useEffect } from 'react';
import FileUploader from './FileUploader';
import { SIDEBAR_MENU } from '../consts/Sidebar';
import './styles/NewMenu.css';

const NewMenu = ({ onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelected = (data) => {
    onUpload(data);
    setIsOpen(false);
  };

  return (
    <div className="position-relative" ref={menuRef}>
      <button className="google-new-btn" onClick={() => setIsOpen(!isOpen)}>
        <svg width="24" height="24" viewBox="0 0 36 36">
          <path fill="#34A853" d="M16 16v14h4V20z" /><path fill="#4285F4" d="M30 16H20l-4 4h14z" />
          <path fill="#FBBC05" d="M6 16v4h10l4-4z" /><path fill="#EA4335" d="M20 16V6h-4v14z" />
        </svg>
        <span className="fw-medium ms-2">{SIDEBAR_MENU.NEW_BTN}</span>
      </button>

      {isOpen && (
        <div className="google-dropdown-menu shadow">
          <FileUploader onFileSelected={handleSelected} customItem={
            <div className="menu-item"><i className="bi bi-file-earmark-arrow-up"></i><span>העלאת קבצים</span></div>
          } />
          <FileUploader isDirectory={true} onFileSelected={handleSelected} customItem={
            <div className="menu-item"><i className="bi bi-folder-symlink"></i><span>העלאת תיקייה</span></div>
          } />
        </div>
      )}
    </div>
  );
};

export default NewMenu;