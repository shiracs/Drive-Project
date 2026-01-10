import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import { DELETE } from '../consts/Delete';
import { PERMISSIONS } from '../consts/Permissions';
import { RENAME } from '../consts/Rename';
import PermissionsPage from './PermissionsPage';
import UpdateName from './UpdateName';
import '../App.css';

const FileCard = ({ file, onNavigate, onOpenImage, onDeleteSuccess }) => {
  const { id, name, type } = file;

  const navigate = useNavigate();
  
  const isFolder = type === 'FOLDER';
  const isImage = type === 'IMAGE';
  
  const [fileContent, setFileContent] = useState("Loading...");
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showUpdateName, setShowUpdateName] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // Fetch user role/permissions for this resource
  useEffect(() => {
    if (isDeleted || !id) return;
    
    const fetchUserRole = async () => {
      try {
        const auth = getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}/permissions`, {
          method: 'GET',
          headers: auth
        });

        if (response.ok) {
          // If we can fetch permissions, we are the owner
          setUserRole('OWNER');
        } else if (response.status === 403) {
          // If forbidden, we're not owner - try to determine if writer or reader
          // by attempting a simple operation (we'll assume READER for now)
          setUserRole('READER');
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
        setUserRole('READER');
      }
    };

    fetchUserRole();
  }, [id, isDeleted]);
  
  // load preview content for files
  useEffect(() => {
    if (isDeleted) return null;
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

  const getPreviewSrc = () => {
    if (!fileContent) return null;
    if (fileContent.startsWith("data:")) return fileContent;
    return `data:image/png;base64,${fileContent}`;
  };

  const previewSrc = isImage ? getPreviewSrc() : null;
  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (window.confirm(`${DELETE.CONFIRM_MESSAGE} ${name}?`)) {
      try {
        const auth = getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, {
          method: 'DELETE',
          headers: auth
        });
        if (response.ok) {
          setIsDeleted(true);
          onDeleteSuccess && onDeleteSuccess(id);
        } else {
          console.error("Delete failed with status:", response.status);
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleShowPermissions = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowPermissions(true);
  };

  const handleShowUpdateName = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowUpdateName(true);
  };

  const handleUpdateNameSuccess = (newName) => {
    file.name = newName;
  };

  const canEdit = userRole === 'OWNER' || userRole === 'WRITER';
  const isOwner = userRole === 'OWNER';

  const renderActionMenu = () => (
    <div className="menu-container">
      <div className="folder-menu-dots t-text-sub" onClick={toggleMenu}>⋮</div>
      {showMenu && (
        <div className="delete-dropdown">
          <button 
            className={`delete-button ${isOwner ? '' : 'permissions-button-non-owner'}`}
            onClick={handleShowPermissions}
          >
            <span>🔒</span>
            <span>{PERMISSIONS.MENU_BUTTON}</span>
          </button>
          <button 
            className={`delete-button ${canEdit ? 'update-name-button-enabled' : 'update-name-button-disabled'}`}
            onClick={handleShowUpdateName}
            disabled={!canEdit}
          >
            <span>✏️</span>
            <span>{RENAME.MENU_BUTTON}</span>
          </button>
          <button className="delete-button" onClick={handleDelete}>
            <span>🗑️</span>
            <span>{DELETE.DELETE_BUTTON}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isFolder ? (
        // Folder Card  
        <div className="menu-container">      
        <div className="drive-folder-card t-bg-surface t-border" onClick={handleClick} title={name}>
          <div className="folder-content-right">
            <span className="folder-icon">📁</span>
            <span className="folder-name t-text-main">{name}</span>
          </div>{renderActionMenu()}</div>
        </div>
      ) : (
        // Image Card
        <div
          className="drive-file-card t-bg-surface t-border"
          onClick={handleClick}
          title={name}
        >
          <div
            className={`file-preview-container t-bg-page ${isImage ? 'image-preview' : ''}`}
          >
            {isImage ? (
              previewSrc ? (
                <img
                  src={previewSrc}
                  alt={name}
                  className="file-preview-image"
                />
              ) : (
                <div>🖼️</div>
              )
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
                <div className="file-icon-small">{isImage ? "🖼️" : "📄"}</div>
                <div className="file-name-text t-text-main">{isImage ? `${name}.png` : `${name}.txt`}</div>
              </div>
              {renderActionMenu()}
            </div>
          </div>
        </div>
      )}
      
      {/* Permissions Modal */}
      {showPermissions && (
        <div className="permissions-modal-overlay" onClick={() => setShowPermissions(false)}>
          <div className="permissions-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="permissions-modal-close" onClick={() => setShowPermissions(false)}>✕</button>
            <PermissionsPage resourceId={id} resourceName={name} />
          </div>
        </div>
      )}

      {/* Update Name */}
      {showUpdateName && (
        <UpdateName
          fileId={id}
          fileName={name}
          onClose={() => setShowUpdateName(false)}
          onSuccess={handleUpdateNameSuccess}
        />
      )}
    </>
  );
};

export default FileCard;