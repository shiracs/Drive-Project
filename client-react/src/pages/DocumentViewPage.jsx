import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';
import { DOC_BUTTONS } from '../consts/DocumentBottons';

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get file from state, but don't crash if it's missing
  const file = location.state?.file;
  const [isEditing, setIsEditing] = useState(false);
  const paperRef = useRef();

  const handleSave = async () => {
    if (paperRef.current) {
      await paperRef.current.saveToServer();
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (paperRef.current) {
      paperRef.current.cancelChanges();
      setIsEditing(false);
    }
  };

  return (
    <div className="document-view-container">
      <div className="document-header">
        
        {/* Right group: contains the navigation and file identification */}
        <div className="header-right-group">
          {/* Back button: positioned far right due to CSS row-reverse */}
          <button className="back-button" onClick={() => navigate(-1)}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>➔</span>
          </button>

          {/* File name: interactive button for potential rename actions */}
          <button 
            className="file-name-button" 
            onClick={() => console.log("Rename clicked")}
          >
            {file?.name || "Loading..."}
          </button>
        </div>
        
        {/* Left group: contains action buttons for editing and saving */}
        <div className="header-left-group">
          {!isEditing ? (
            <button 
              className="edit-button" 
              onClick={() => setIsEditing(true)}
            >
              {DOC_BUTTONS.EDIT}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="edit-button" 
                style={{ backgroundColor: '#34a853' }} 
                onClick={handleSave}
              >
                {DOC_BUTTONS.SAVE}
              </button>
              <button 
                className="edit-button" 
                style={{ backgroundColor: '#ea4335' }} 
                onClick={handleCancel}
              >
                {DOC_BUTTONS.CANCEL}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main workspace: renders the document content area */}
      <div className="document-workspace">
        <DocumentPaper 
          ref={paperRef} 
          fileId={id}
          isEditing={isEditing} 
        />
      </div>
    </div>
  );
};

export default DocumentViewPage;