import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';
import { DOC_BUTTONS } from '../consts/DocumentBottons';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [fileName, setFileName] = useState(location.state?.file?.name || "Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const auth = getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, { headers: auth });
        if (!response.ok) {
          setError("Failed to fetch file data.");
          return;
        }
        const data = await response.json();
        setContent(data.content || "");
        setOriginalContent(data.content || "");
        setFileName(data.name);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchFile();
  }, [id]);

  const splitFileName = (fullname) => {
    if (!fullname || typeof fullname !== 'string') return { name: "", ext: "" };
    
    const lastDotIndex = fullname.lastIndexOf('.');
    if (lastDotIndex === -1) return { name: fullname, ext: "" };
    
    return {
        name: fullname.substring(0, lastDotIndex),
        ext: fullname.substring(lastDotIndex)
    };
    };

    const handleRename = async (newNameFromInput) => {
    const { ext } = splitFileName(fileName || "");

    if (!newNameFromInput.trim() || !newNameFromInput) {
        setError("File name cannot be empty.");
        setIsEditingName(false);
        return;
    }
    
    const finalName = (ext && !newNameFromInput.endsWith(ext)) 
        ? `${newNameFromInput}${ext}` 
        : newNameFromInput;

    try {
      const auth = getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName })
      });

      if (!response.ok) {
        setError("Failed to rename file.");
        return;
      }

      setFileName(finalName);
    
    } catch (err) {
      setError(err.message);
    } finally {
      setIsEditingName(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const auth = getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content })
      });
      if (!response.ok) {
        setError("Failed to save document.");
        return;
      }
      const updatedFile = await response.json();
      setContent(updatedFile.content);
      setOriginalContent(updatedFile.content);
      setFileName(updatedFile.name);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  return (
    <div className="document-view-container">
      <div className="document-header">
        <div className="header-right-group">
          <button className="back-button" onClick={() => navigate(-1)}><span className="back-arrow"></span></button>
          {isEditingName ? (
            <input
              className="file-name-input"
              defaultValue={fileName}
              onBlur={(e) => handleRename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(e.target.value)}
              autoFocus
            />
          ) : (
            <span 
              className="file-name-button" 
              onClick={() => setIsEditingName(true)}
              style={{ cursor: 'pointer' }}
            >
              {fileName}
            </span>
          )}
        </div>
        
        <div className="header-left-group">
          {!isEditing ? (
            <button className="edit-button" onClick={() => setIsEditing(true)}>{DOC_BUTTONS.EDIT}</button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="edit-button" style={{ backgroundColor: '#34a853' }} onClick={handleSave}>
                {loading ? "Saving..." : DOC_BUTTONS.SAVE}
              </button>
              <button className="edit-button" style={{ backgroundColor: '#ea4335' }} onClick={handleCancel}>
                {DOC_BUTTONS.CANCEL}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="document-workspace">
        {/* sending data and update function as Props */}
        <DocumentPaper 
          content={content} 
          setContent={setContent} 
          isEditing={isEditing} 
        />
      </div>
    </div>
  );
};

export default DocumentViewPage;