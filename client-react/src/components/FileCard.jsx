import React from 'react';
import { API_BASE_URL } from '../consts/Urls';
import '../App.css';

const FileCard = async ({ file, onNavigate }) => {
  const {
    id,
    name,
    type,
    owner = "User",
    profilePic,
    updatedAt
  } = file;

  const isFolder = type === 'FOLDER';
  const [fileContent, setFileContent] = useState("");
  
  // display formatted date or 'date unknown'
  const displayDate = updatedAt 
    ? new Date(updatedAt).toLocaleDateString('he-IL') 
    : 'date unknown';

  // load preview content for files
  useEffect(() => {
    // only for files, not folders
    if (!isFolder && id) {
      const fetchPreview = async () => {
        try {
            // fetch file content from server
            const response = await fetch(`${API_BASE_URL}/files/${id}`);
            if (response.ok) {
            const text = await response.text();
            setFileContent(text.substring(0, 100)); // first 100 chars
            }
        } catch (err) {
            console.error("Failed to load preview", err);
            setFileContent("Error loading preview");
        }
      };
      fetchPreview();
    }
  }, [id, isFolder]);

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

  // get content fron server or placeholder - first few lines
  try {
    const fileContent = await fetch(`API_URL/files/${id}/content`).then(res => res.text());
  } catch {
    const fileContent = "error";
  }
  return (
    <div className="drive-file-card" onClick={handleClick} title={name}>
      {/* display preview area */}
      <div className="file-preview-container">
        <div className="file-paper-preview">
          <div className="text-lines">
            <div className="line full"></div>
            <div className="line full"></div>
            <div className="line half"></div>
            <div className="line full"></div>
          </div>
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