import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, RESOURCE_API_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import { DELETE } from "../consts/Delete";
import { PERMISSIONS } from '../consts/Permissions';
import { RENAME } from '../consts/Rename';
import PermissionsPage from './PermissionsPage';
import UpdateName from './UpdateName';
import './styles/FileCard.css';

const FileCard = ({
  file,
  onNavigate,
  onOpenImage,
  onDeleteSuccess,
  onRefresh,
}) => {
  const { id, name, type, isStarred, isDeleted: isSoftDeleted, isSpam } = file;

  const navigate = useNavigate();

  const isFolder = type === "FOLDER";
  const isImage = type === "IMAGE";

  const [fileContent, setFileContent] = useState("Loading...");
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showUpdateName, setShowUpdateName] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // see usrer role for this file/folder
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
          setUserRole('OWNER');
        } else if (response.status === 403) {
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
  }, [id, isFolder, isDeleted]);

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

const decodeBase64ToHebrew = (str) => {
  if (!str || str === "Loading..." || str.includes("Error")) return str;
  try {
    const cleanStr = str.replace(/\s/g, '');
    const binString = atob(cleanStr);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return str;
  }
};

  const previewSrc = isImage ? getPreviewSrc() : null;
  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);

    const deleteUrl = isSoftDeleted ? 
    `${RESOURCE_API_URL}/permanent-delete/${id}` : 
    `${RESOURCE_API_URL}/${id}`;

    if (window.confirm(`${DELETE.CONFIRM_MESSAGE} ${name}?`)) {
      try {
        const auth = getTokenHeader();
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: auth
        });
        if (response.ok) {
          setIsDeleted(true);
          onDeleteSuccess && onDeleteSuccess(id);
          onRefresh()
        } else {
          throw new Error();
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleStarToggle = async (e) => {
    e.stopPropagation();
    try {
      const auth = getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/star/${id}`, {
        method: "PATCH",
        headers: auth,
      });
      if (response.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Star toggle failed", err);
    }
  };

  const handleRestore = async (e) => {
    e.stopPropagation();
    try {
      const auth = getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/restore/${id}`, {
        method: "POST",
        headers: auth,
      });
      if (response.ok && onRefresh) onRefresh();
    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  const handleSpamToggle = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
        const auth = getTokenHeader();
        const response = await fetch(`${RESOURCE_API_URL}/spam/${id}`, {
            method: "PATCH",
            headers: auth,
        });
        if (response.ok && onRefresh) onRefresh();
    } catch (err) {
        console.error("Spam toggle failed", err);
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
      <div className="folder-menu-dots t-text-sub" onClick={toggleMenu}>
        ⋮
      </div>
      {showMenu && (
        <div className="delete-dropdown">
          {isSoftDeleted && (<>
            <button className="delete-button" onClick={handleRestore}>
              <span>♻️</span>
              <span>{DELETE.RESTORE}</span>
            </button>
            <div className="menu-divider"></div>
            </>
          )}
          {!isSoftDeleted && (<>
            <button className="delete-button" onClick={handleSpamToggle}>
              <span>⚠️</span>
              <span>{file.isSpam ? "לא ספאם" : "דווח כספאם"}</span>
            </button>
            <div className="menu-divider"></div>
          </>)}
          <button 
            className={`delete-button ${isOwner ? '' : 'permissions-button-non-owner'}`}
            onClick={handleShowPermissions}
          >
            <span>👥</span>
            <span>{PERMISSIONS.MENU_BUTTON}</span>
          </button>
          <div className="menu-divider"></div>
          <button 
            className={`delete-button ${canEdit ? 'update-name-button-enabled' : 'update-name-button-disabled'}`}
            onClick={handleShowUpdateName}
            disabled={!canEdit}
          >
            <span>✏️</span>
            <span>{RENAME.MENU_BUTTON}</span>
          </button>
          <div className="menu-divider"></div>
          <button 
            className={`delete-button ${canEdit ? 'update-name-button-enabled' : 'update-name-button-disabled'}`}
            onClick={handleDelete}
            disabled={!canEdit}
          >
            <span>🗑️</span>
            <span>{isSoftDeleted ? DELETE.PERMANENT_DELETE : DELETE.DELETE_BUTTON}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderStar = () => (
    <span
      onClick={handleStarToggle}
      className={`star-icon ${isStarred ? 'starred' : 'unstarred'}`}
    >
      <i className={`bi ${isStarred ? "bi-star-fill" : "bi-star"}`}></i>
    </span>
  );

  return (
    <>
      {isFolder ? (
        // Folder Card
        <div className="menu-container">
          <div
            className="drive-folder-card folder-card-layout t-bg-surface t-border"
            onClick={handleClick}
            title={name}
          >
            <div className="folder-content-left">
              <span className="folder-emoji">
                📁
              </span>
              <span className="folder-name-text t-text-main">
                {name}
              </span>
            </div>
            <div className="folder-actions">
              {renderStar()}
              {renderActionMenu()}
            </div>
          </div>
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
                  {decodeBase64ToHebrew(fileContent).substring(0, 1000)}
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
              {renderStar()}
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