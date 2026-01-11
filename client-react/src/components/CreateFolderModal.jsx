import { useState } from 'react';
import { RESOURCE_API_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import { CREATE_FOLDER } from '../consts/CreateFolder';
import './styles/CreateFolderModal.css';

const CreateFolderModal = ({ onClose, onSuccess, parentId = null }) => {
  const [folderName, setFolderName] = useState('');

  const handleCreateFolder = async () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      alert(CREATE_FOLDER.EMPTY_NAME_ERROR);
      return;
    }

    try {
      const auth = getTokenHeader();
      const response = await fetch(RESOURCE_API_URL, {
        method: 'POST',
        headers: {
          ...auth,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: trimmedName,
          type: 'FOLDER',
          content: '',
          parentId: parentId
        })
      });

      if (response.ok) {
        const newFolder = await response.json();
        onSuccess && onSuccess(newFolder);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || CREATE_FOLDER.ERROR_MESSAGE);
      }
    } catch (err) {
      alert(CREATE_FOLDER.ERROR_MESSAGE);
    }
  };

  return (
    <div className="create-folder-overlay" onClick={onClose}>
      <div className="create-folder-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-folder-container">
          <div className="create-folder-header">
            <h3>{CREATE_FOLDER.DIALOG_TITLE}</h3>
          </div>
          <div className="create-folder-body">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={CREATE_FOLDER.DIALOG_PLACEHOLDER}
              className="create-folder-input"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <div className="create-folder-buttons">
            <button
              onClick={onClose}
              className="create-folder-cancel-button"
            >
              {CREATE_FOLDER.CANCEL_BUTTON}
            </button>
            <button
              onClick={handleCreateFolder}
              className="create-folder-create-button"
            >
              {CREATE_FOLDER.CREATE_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
