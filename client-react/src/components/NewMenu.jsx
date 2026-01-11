import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FileUploader from './FileUploader';
import { SIDEBAR_MENU } from '../consts/Sidebar';
import { RESOURCE_API_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import './styles/NewMenu.css';

const NewMenu = ({ onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentFolderId = searchParams.get("folderId") || null;

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

  const handleCreateTextFile = async () => {
    setIsOpen(false);
    try {
      const auth = getTokenHeader();
      
      const response = await fetch(RESOURCE_API_URL, {
        method: "POST",
        headers: {
          ...auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: SIDEBAR_MENU.NEW_FILE_NAME, 
          type: "FILE", 
          content: "", 
          parentId: currentFolderId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const newFile = await response.json();
      navigate(`/files/${newFile.id}`, { state: { isNewFile: true } });
    } catch (error) {
      console.error("Failed to create file:", error);
      alert(SIDEBAR_MENU.CREATE_FILE_ERROR);
    }
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
          <div className="menu-item" onClick={handleCreateTextFile}>
            <i className="bi bi-file-earmark-text"></i>
            <span>{SIDEBAR_MENU.NEW_TXT_FILE}</span>
          </div>
          <div className="menu-item" onClick={() => console.log('צור תיקייה')}>
            <i className="bi bi-folder-plus"></i>
            <span>{SIDEBAR_MENU.CREATE_FOLDER}</span>
          </div>
          <div className="menu-divider"></div>
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