import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';

const DocumentPaper = ({ fileId }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchFileContent = async () => {
      if (!fileId) return;
      
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
          method: 'GET',
          headers: {
            'Authorization': token
          }
        });

        if (!response.ok) {
          throw new Error(`Fetch error: ${response.status}`);
        }

        const text = await response.text();

        if (isMounted) {
          try {
            // Check if the server response is JSON-wrapped
            const jsonData = JSON.parse(text);
            setContent(jsonData.content || text);
          } catch (e) {
            // Response is plain text from storage
            setContent(text);
          }
        }
      } catch (err) {
        console.error("Failed to load document:", err);
        if (isMounted) {
          setContent("Error: Could not load content from server.");
        }
      }
    };

    fetchFileContent();

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  return (
    <div className="document-paper">
      <div className="document-body">
        <div className="document-text-lines">
          {content}
        </div>
      </div>
    </div>
  );
};

export default DocumentPaper;