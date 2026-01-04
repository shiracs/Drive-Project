import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import '../App.css';

const FileCard = ({ file, onNavigate }) => {
  const {
    id,
    name,
    type,
    owner = "User",
    profilePic,
    content, // TODO: only for demo purpose
    updatedAt
  } = file;

  const isFolder = type === 'FOLDER';
  // TODO: use dummy content for now
  const [fileContent, setFileContent] = useState(content || "This is a preview of the file content...");
  
  // display formatted date or 'date unknown'
  const displayDate = updatedAt 
    ? new Date(updatedAt).toLocaleDateString('he-IL') 
    : 'date unknown';
  
  // // load preview content for files
  // useEffect(() => {
  //   // only for files, not folders
  //   if (!isFolder && id) {
  //     const fetchPreview = async () => {
  //       try {
  //           // fetch file content from server
  //           const response = await fetch(`${API_BASE_URL}/files/${id}`);
  //           if (response.ok) {
  //           const text = await response.text();
  //           setFileContent(text.substring(0, 100)); // first 100 chars
  //           }
  //       } catch (err) {
  //           console.error("Failed to load preview", err);
  //           setFileContent("Error loading preview");
  //       }
  //     };
  //     fetchPreview();
  //   }
  // }, [id, isFolder]);

  // TODO: handle click event 
  const handleClick = (e) => {
  };

  // display folder
  if (isFolder) {
    return (
      <div className="drive-folder-card" onClick={handleClick} title={name}>
        <div className="folder-content-right">
          <span className="folder-icon">📁</span>
          <span className="folder-name">{name}</span>
        </div>
        <div className="folder-menu-dots">⋮</div>
      </div>
    );
  }

  // display file
  return (
<div className="drive-file-card" onClick={handleClick} title={name}>
      <div className="file-preview-container">
        <div className="file-paper-preview">
          <div className="preview-text-content">
            {fileContent}
          </div>
        </div>
      </div>
      {/* display info area */}
      <div className="file-info-area">
        <div className="file-header-row">
          <div className="file-icon-small">📄</div>
          <div className="file-name-text">{name}</div>
        </div>

        <div className="file-footer-row">
          <span className="file-date">{displayDate}</span>
          <div className="user-avatar-circle" title={owner}>
            {profilePic ? (
              <img src={profilePic} alt={owner} />
            ) : (
              owner.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCard;