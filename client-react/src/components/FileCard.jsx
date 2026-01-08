import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import '../App.css';

const FileCard = ({ file, onNavigate, onOpenImage }) => {
  const { id, name, type } = file;

  const navigate = useNavigate();
  
  const isFolder = type === 'FOLDER';
  const isImage = type === 'IMAGE';
  
  const [fileContent, setFileContent] = useState("Loading...");
  
  // load preview content for files
  useEffect(() => {
    // only for files, not folders
    if (!isFolder && id) {
      let isMounted = true;
      
      const fetchPreview = async () => {
        try {
          const auth = getTokenHeader();

          // fetch file content from server
          const response = await fetch(`${API_BASE_URL}/files/${id}`, {
            method: 'GET',
            headers: auth
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (isMounted) {
            setFileContent(data.content ? data.content : "");
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

  const handleClick = (e) => {
    if (e.target.closest('.folder-menu-dots')) return;

    if (isFolder && onNavigate) {
      onNavigate(id);
    } else if(isImage) {
      onOpenImage(id);
    } else {
      navigate(`/files/${file.id}`, { state: { file } });
    }
  };

  return (
    <>
      {isFolder ? (
        // Folder Card  
        <div className="drive-folder-card t-bg-surface t-border" onClick={handleClick} title={name}>
          <div className="folder-content-right">
            <span className="folder-icon">📁</span>
            <span className="folder-name t-text-main">{name}</span>
          </div>
          <div className="folder-menu-dots t-text-sub">⋮</div>
        </div>
      ) : (
        // Image Card
        <div className="drive-file-card t-bg-surface t-border" onClick={handleClick} title={name}>
          <div className="file-preview-container t-bg-page" style={isImage ? { padding: 0, overflow: 'hidden' } : {}}>
            {isImage ? (
              <img 
                src={fileContent} 
                alt={name} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    display: 'block' 
                }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Image+Error'; }}
              />
            ) : (
              // File Card
              <div className="file-paper-preview t-bg-surface">
                <div className="preview-text-content t-text-sub">
                  {fileContent.substring(0, 2000)}
                </div>
              </div>
            )}
          </div>

          {/* File/Image info area */}
          <div className="file-info-area t-bg-surface t-border">
            <div className="file-header-row">
              <div className="file-name-container">
                <div className="file-icon-small">{isImage ? '🖼️' : '📄'}</div>
                <div className="file-name-text t-text-main">{`${name}${isImage ? '.png' : '.txt'}`}</div>
              </div>
              <div className="folder-menu-dots t-text-sub">⋮</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileCard;