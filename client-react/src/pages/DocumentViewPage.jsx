import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';

const DocumentViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extracting the file object passed from FileCard
  const file = location.state?.file;

  if (!file) {
    return (
      <div className="document-workspace">
        <div className="document-error">No file selected.</div>
      </div>
    );
  }

  return (
    <div className="document-view-container">
      {/* Header bar with RTL logic from your CSS */}
      <div className="document-header">
        
        {/* Right Group: Name + Arrow (Corrected Order) */}
        <div className="header-right-group">
        {/* 1. החץ - יופיע ראשון מימין בגלל ה-RTL וה-row-reverse */}
        <button className="back-button" onClick={() => navigate(-1)}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>➔</span>
        </button>

        {/* 2. שם הקובץ - יופיע משמאל לחץ */}
        <button 
            className="file-name-button" 
            onClick={() => console.log("Rename clicked")}
        >
            {file.name}
        </button>
        </div>

        {/* Left Group: Edit Button (Matches .header-left-group) */}
        <div className="header-left-group">
          <button className="edit-button" onClick={() => console.log("Edit clicked")}>
            Edit File
          </button>
        </div>
        
      </div>

      {/* Main workspace area */}
      <div className="document-workspace">
        <DocumentPaper fileId={file.id} />
      </div>
    </div>
  );
};

export default DocumentViewPage;