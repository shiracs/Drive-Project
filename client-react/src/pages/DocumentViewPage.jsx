import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';
import { DOC_BUTTONS } from '../consts/DocumentBottons';

const DocumentViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file;

  const [isEditing, setIsEditing] = useState(false);
  
  const paperRef = useRef();

  if (!file) {
    return (
      <div className="document-workspace">
        <div className="document-error">No file selected.</div>
      </div>
    );
  }

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
      {/* סרגל כותרת עליון */}
      <div className="document-header">
        
        {/* right group: back arrow and file name */}
        <div className="header-right-group">
          <button className="back-button" onClick={() => navigate(-1)}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>➔</span>
          </button>

          {/* file name as an interactive button */}
          <button 
            className="file-name-button" 
            onClick={() => console.log("Rename clicked")}
          >
            {file.name}
          </button>
        </div>
        
        {/* left group: edit/save buttons */}
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

      {/* white paper area */}
      <div className="document-workspace">
        <DocumentPaper 
          ref={paperRef} 
          fileId={file.id} 
          isEditing={isEditing} 
        />
      </div>
    </div>
  );
};

export default DocumentViewPage;