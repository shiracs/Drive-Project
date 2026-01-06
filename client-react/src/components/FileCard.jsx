import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import '../App.css';

const FileCard = ({ file, onNavigate }) => {
  const {
    id,
    name,
    type,
  } = file;

  const navigate = useNavigate();
  
  const isFolder = type === 'FOLDER';
  
  const [fileContent, setFileContent] = useState("Loading...");
  
  // load preview content for files
  useEffect(() => {
    // only for files, not folders
    if (!isFolder && id) {
      let isMounted = true;
      
      const fetchPreview = async () => {
        try {
          const token = localStorage.getItem('userToken');
          // fetch file content from server
          const response = await fetch(`${API_BASE_URL}/files/${id}`, {
            method: 'GET',
            headers: {
              'Authorization': token 
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const text = await response.text();
          
          if (isMounted) {
            try {
              const jsonData = JSON.parse(text);
              setFileContent(jsonData.content || text.substring(0, 100));
            } catch (e) {
              setFileContent(text.substring(0, 100));
            }
          }

        } catch (err) {
          console.error("Failed to load preview", err);
          if (isMounted) {
            setFileContent("Error loading preview");
          }
        }
      };
      
      fetchPreview();
      
      // cleanup function
      return () => {
        isMounted = false;
      };
    }
  }, [id, isFolder]);

  // TODO: handle click event 
  const handleClick = (e) => {
    if (e.target.closest('.folder-menu-dots')) return;

    if (isFolder && onNavigate) {
      onNavigate(id);
    } else {
      // TODO: for files, maybe open or download
      navigate('/test-view', { state: { file } });
    }
  };

  return (
    <>
      {isFolder ? (
        /* Folder UI */
        <div className="drive-folder-card" onClick={handleClick} title={name}>
          <div className="folder-content-right">
            <span className="folder-icon">📁</span>
            <span className="folder-name">{name}</span>
          </div>
          <div className="folder-menu-dots">⋮</div>
        </div>
      ) : (
        /* File UI */
        <div className="drive-file-card" onClick={handleClick} title={name}>
          <div className="file-preview-container">
            <div className="file-paper-preview">
              <div className="preview-text-content">
                {fileContent}
              </div>
            </div>
          </div>

          <div className="file-info-area">
            <div className="file-header-row">
              {/* Right side: icon and file name */}
              <div className="file-name-container">
                <div className="file-icon-small">📄</div>
                <div className="file-name-text">{name}</div>
              </div>
              
              {/* Left side: options button */}
              <div className="folder-menu-dots">⋮</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileCard;