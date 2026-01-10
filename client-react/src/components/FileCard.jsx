import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, RESOURCE_API_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import { DELETE } from "../consts/Delete";
import "../App.css";

const FileCard = ({
  file,
  onNavigate,
  onOpenImage,
  onDeleteSuccess,
  onRefresh,
}) => {
  const { id, name, type, isStarred, isDeleted: isSoftDeleted } = file;

  const navigate = useNavigate();

  const isFolder = type === "FOLDER";
  const isImage = type === "IMAGE";

  const [fileContent, setFileContent] = useState("Loading...");
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
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

  const renderActionMenu = () => (
    <div className="menu-container">
      <div className="folder-menu-dots t-text-sub" onClick={toggleMenu}>
        ⋮
      </div>
      {showMenu && (
        <div className="delete-dropdown">
          {isSoftDeleted && (<>
            <button className="delete-button" onClick={handleRestore} style={{ color: '#28a745' }}>
              <span>{DELETE.RESTORE}</span>
            </button>
            <div className="menu-divider"></div>
            </>
          )}
          <button className="delete-button" onClick={handleDelete}>
            <span>{isSoftDeleted ? DELETE.PERMANENT_DELETE : DELETE.DELETE_BUTTON}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderStar = () => (
    <span
      onClick={handleStarToggle}
      style={{
        cursor: "pointer",
        color: isStarred ? "#ffc107" : "#ccc",
        marginLeft: "8px",
      }}
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
            className="drive-folder-card t-bg-surface t-border"
            onClick={handleClick}
            title={name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              height: "48px",
              minWidth: "200px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                flex: 1,
              }}
            >
              <span
                style={{ fontSize: "1.2rem", marginLeft: "8px", flexShrink: 0 }}
              >
                📁
              </span>
              <span
                className="t-text-main"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                {name}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                gap: "4px",
                marginRight: "auto",
              }}
            >
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
            className="file-preview-container t-bg-page"
            style={isImage ? { padding: 0, overflow: "hidden" } : {}}
          >
            {isImage ? (
              previewSrc ? (
                <img
                  src={previewSrc}
                  alt={name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                <div className="file-name-text t-text-main">{name}</div>
              </div>
              {renderStar()}
              {renderActionMenu()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileCard;