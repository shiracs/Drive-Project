import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DocumentPaper from "../components/DocumentPaper";
import { DOC_BUTTONS } from "../consts/DocumentBottons";
import { DOC_VIEW_MESSAGES } from "../consts/DocumentView";
import { API_BASE_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import "./styles/DocumentViewPage.css";

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [fileName, setFileName] = useState(
    location.state?.file?.name || "Loading..."
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(null);

  // decode text coming from server
  const decodeBase64 = (str) => {
    if (!str) return "";
    try {
      const binString = atob(str.replace(/\s/g, ""));
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
      return new TextDecoder().decode(bytes);
    } catch (e) {
      console.error("Decoding failed", e);
      return str;
    }
  };

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      try {
        const auth = getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, { headers: auth });
        if (!response.ok) {
          setError(DOC_VIEW_MESSAGES.FETCH_ERROR);
          return;
        }

        const data = await response.json();
        const decodedText = data.content ? decodeBase64(data.content) : "";
        setContent(decodedText);
        setOriginalContent(decodedText);
        setFileName(data.name);

        if (location.state?.isNewFile) {
          setIsEditing(true);
        }

        try {
          const roleResponse = await fetch(`${API_BASE_URL}/files/${id}/my-role`, {
            method: 'GET',
            headers: auth
          });

          if (roleResponse.ok) {
            const data = await roleResponse.json();
            const myRole = data.role; 
            setCanEdit(myRole == 'OWNER' || myRole == 'WRITER');
          } else {
            setCanEdit(false);
          }
        } catch {
          setCanEdit(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFile();
  }, [id]);

  const patchFile = async (data) => {
    const auth = getTokenHeader();
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.status === 403) {
      setCanEdit(false);
      throw new Error("אין הרשאת עריכה");
    }

    if (!response.ok) {
      throw new Error(DOC_VIEW_MESSAGES.UPDATE_ERROR);
    }
  };

  const handleRename = async (newNameFromInput) => {
    if (!newNameFromInput || !newNameFromInput.trim()) {
      setError(DOC_VIEW_MESSAGES.FILE_NAME_EMPTY_ERROR);
      setIsEditingName(false);
      return;
    }

    try {
      await patchFile({ name: newNameFromInput.trim() });
      setFileName(newNameFromInput.trim());
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
      // encode before sending to server
      const bytes = new TextEncoder().encode(content);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
      const encodedContent = btoa(binString);

      await patchFile({ content: encodedContent });
      setOriginalContent(content);
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

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="document-view-container">
      <div className="document-header">
        <div className="header-right-group">
          <button className="back-button" onClick={() => navigate(-1)}><span className="back-arrow"></span></button>
          {canEdit && isEditingName ? (
            <div className="file-name-input-container">
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
              className={canEdit ? "file-name-button" : "file-name-readonly"}
              onClick={canEdit ? () => setIsEditingName(true) : undefined}
            >
              {fileName}.txt
            </span>
          )}
        </div>

        <div className="header-left-group">
          {canEdit && !isEditing ? (
            <button className="edit-button" onClick={() => setIsEditing(true)}>{DOC_BUTTONS.EDIT}</button>
          ) : canEdit && isEditing ? (
            <div className="save-cancel-buttons">
              <button className="edit-button save-button" onClick={handleSave} disabled={loading}>
                {loading ? DOC_VIEW_MESSAGES.SAVING : DOC_BUTTONS.SAVE}
              </button>
              <button
                className="edit-button cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                {DOC_BUTTONS.CANCEL}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="document-workspace">
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