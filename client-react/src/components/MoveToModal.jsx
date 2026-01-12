import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { GENERAL } from '../consts/General';
import './styles/MoveToModal.css';

const MoveToModal = ({ fileId, currentName, onClose, onRefresh }) => {
  const [items, setItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState(GENERAL.ROOT);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [history, setHistory] = useState([]);
  const userId = localStorage.getItem("userId")

  useEffect(() => {
    fetchContent(currentFolderId);
  }, [currentFolderId]);

  const fetchContent = async (parentId) => {
    try {
      const url = `${API_BASE_URL}/files${parentId ? `?parentId=${parentId}` : ''}`;
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setItems(data.filter(i => i.type === 'FOLDER' && i.id !== fileId && i.ownerId===userId));
    } catch (err) {
      console.error("Failed to load folder content", err);
    }
  };

  const navigateTo = (folder) => {
    setHistory([...history, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
    setSelectedFolderId(folder.id); 
  };

  const goBack = () => {
    const newHistory = [...history];
    const prev = newHistory.pop();
    setHistory(newHistory);
    setCurrentFolderId(prev.id);
    setCurrentFolderName(prev.name);
    setSelectedFolderId(prev.id);
  };

  const handleConfirm = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/files/move/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newParentId: selectedFolderId })
    });

    if (response.ok) {
      onRefresh();
      onClose();
    }
  };

  return (
    <div className="move-modal-overlay" onClick={onClose}>
      <div className="move-modal-container t-bg-surface t-border" onClick={e => e.stopPropagation()}>
        <div className="move-modal-header t-border">
          <h5 className="t-text-main m-0">{`${GENERAL.MOVE} "${currentName}"`}</h5>
          <button className="btn-close-x t-text-sub" onClick={onClose}>✕</button>
        </div>
        
        <div className="move-modal-breadcrumb">
          {currentFolderId !== null && (
            <button className="back-button" onClick={goBack}>
              <span className="back-arrow"></span>
            </button>
          )}
          <span className="path-text t-text-main font-weight-bold">
            {currentFolderName}
          </span>
        </div>

        <div className="move-folder-list">
          {currentFolderId === null && (
            <div 
              className={`move-list-item t-text-main ${selectedFolderId === null ? 'selected-item' : ''}`}
              onClick={() => setSelectedFolderId(null)}
            >
              <span>🏠 {GENERAL.ROOT}</span>
            </div>
          )}

          {items.map(folder => (
            <div 
              key={folder.id} 
              className={`move-list-item t-text-main ${selectedFolderId === folder.id ? 'selected-item' : ''}`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span className="folder-label">📁 {folder.name}</span>
              <button 
                className="btn-open-folder" 
                onClick={(e) => { e.stopPropagation(); navigateTo(folder); }}
              >
                {GENERAL.OPEN}
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="empty-state t-text-sub">אין תיקיות שלך במיקום זה</div>
          )}
        </div>

        <div className="move-modal-actions t-border">
          <button className="btn-move-action btn-confirm" onClick={handleConfirm}>
            {GENERAL.CONFIRM_MOVE}
          </button>
          <button className="btn-move-action btn-cancel t-text-main t-border" onClick={onClose}>
            {GENERAL.CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveToModal;