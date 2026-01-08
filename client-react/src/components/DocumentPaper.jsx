import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';

const DocumentPaper = forwardRef(({ fileId, isEditing }, ref) => {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);

  // load file content on mount or when fileId changes
  useEffect(() => {
    fetchFileContent();
  }, [fileId]);

  const fetchFileContent = async () => {
    if (!fileId) return;
    try {
        const auth = getTokenHeader();

      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        headers: auth
      });
      
      const data = await response.json();
      const fileContent = data.content || ""; 
      
      setContent(fileContent);
      setOriginalContent(fileContent); 
    } catch (err) {
      console.error("Load failed:", err);
      setContent("Error loading file content.");
    }
  };

  useImperativeHandle(ref, () => ({
    saveToServer: async () => {
      setLoading(true);
      try {
        const auth = getTokenHeader();
        
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
          method: 'PATCH',
          headers: { 
            ...auth,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            content: content 
          })
        });

        if (response.ok) {
          setOriginalContent(content);
        } else {
          const errorMsg = await response.text();
          console.error("Server error:", errorMsg);
        }
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setLoading(false);
      }
    },
    cancelChanges: () => {
      setContent(originalContent);
    }
  }));

  return (
    <div className="document-paper">
      <div className="document-body">
        {loading ? (
          <div className="document-loading">Saving...</div>
        ) : isEditing ? (
          <textarea
            className="document-editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />
        ) : (
          <div className="document-text-lines">
            {content || <span className="document-empty-state">No content found.</span>}
          </div>
        )}
      </div>
    </div>
  );
});

export default DocumentPaper;