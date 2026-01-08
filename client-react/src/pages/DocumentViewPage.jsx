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

  const patchFile = async (data) => {
    const auth = getTokenHeader();
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = new Error("Failed to update file.");
        throw error;
    }

    return response.json();
};

const handleRename = async (newNameFromInput) => {
    if (!newNameFromInput.trim() || !newNameFromInput) {
        setError("File name cannot be empty.");
        setIsEditingName(false);
        return;
    }

    try {
        await patchFile({ name: newNameFromInput });
        setFileName(newNameFromInput);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsEditingName(false);
    }
};

const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
        const updatedFile = await patchFile({ content: content });
        setContent(updatedFile.content);
        setOriginalContent(updatedFile.content);
        setFileName(updatedFile.name);
        setIsEditing(false);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
        setIsEditing(false);
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
            <div className="file-name-input-container" style={{ display: 'flex', alignItems: 'center' }}>
            <input
                className="file-name-input"
                defaultValue={fileName}
                onBlur={(e) => handleRename(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(e.target.value)}
                autoFocus
            />
            <span className="visual-extension">.txt</span>
            </div>
        ) : (
            <span 
            className="file-name-button" 
            onClick={() => setIsEditingName(true)}
            >
            {fileName}.txt
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