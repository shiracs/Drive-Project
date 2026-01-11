import { useState } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import { RENAME } from '../consts/Rename';
import './styles/UpdateName.css';

const UpdateName = ({ fileId, fileName, onClose, onSuccess }) => {
  const [newName, setNewName] = useState(fileName);

  const handleUpdateName = async () => {
    if (!newName || newName.trim() === '') {
      alert(RENAME.EMPTY_NAME_ERROR);
      return;
    }

    try {
      const auth = getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          ...auth,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (response.ok || response.status === 204) {
        onSuccess && onSuccess(newName.trim());
        onClose();
        window.location.reload();
      } else {
        alert(RENAME.ERROR_MESSAGE);
      }
    } catch (err) {
      console.error("Rename failed", err);
      alert(RENAME.ERROR_MESSAGE);
    }
  };

  return (
    <div className="permissions-modal-overlay" onClick={onClose}>
      <div className="permissions-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="permissions-modal-close" onClick={onClose}>✕</button>
        <div className="permissions-container">
          <div className="permissions-header">
            <h3>{RENAME.DIALOG_TITLE}</h3>
          </div>
          <div className="rename-content">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={RENAME.DIALOG_PLACEHOLDER}
              className="rename-input"
              onKeyPress={(e) => e.key === 'Enter' && handleUpdateName()}
            />
            <div className="rename-buttons-container">
              <button
                onClick={onClose}
                className="rename-cancel-button"
              >
                {RENAME.CANCEL_BUTTON}
              </button>
              <button
                onClick={handleUpdateName}
                className="rename-save-button"
              >
                {RENAME.SAVE_BUTTON}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateName;
