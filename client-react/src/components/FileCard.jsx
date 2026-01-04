import React from 'react';
import '../App.css'; 

const FileCard = ({ file, onNavigate }) => {
  // נתונים פיקטיביים לבדיקה (במידה ולא התקבל קובץ אמיתי)
  const mockFile = {
    id: '1',
    name: "מסמך אפיון מערכת.pdf",
    owner: "ישראל ישראלי",
    type: "FILE", 
    lastOpened: "נפתח: 14:30",
    previewText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
  };

  const currentFile = { ...mockFile, ...file };
  const isFolder = currentFile.type === 'FOLDER';
  const userInitial = currentFile.owner ? currentFile.owner.charAt(0) : '?';

  const handleClick = (e) => {
    // מניעת כניסה אם לוחצים על התפריט
    if (e.target.className.includes('menu-dots')) return;

    if (isFolder && onNavigate) {
      onNavigate(currentFile.id);
    }
  };

  // --- תצוגת תיקייה ---
  if (isFolder) {
    return (
      <div className="drive-folder-card" onClick={handleClick} title={currentFile.name}>
        {/* צד ימין: אייקון ושם */}
        <div className="folder-content-right">
          <span className="folder-icon">📁</span>
          <span className="folder-name">{currentFile.name}</span>
        </div>
        
        {/* צד שמאל: שלוש נקודות */}
        <div className="folder-menu-dots">⋮</div>
      </div>
    );
  }

  // --- תצוגת קובץ ---
  return (
    <div className="drive-file-card" onClick={handleClick}>
      {/* חלק עליון: תצוגה מקדימה (דף טקסט) */}
      <div className="file-preview-container">
        <div className="file-paper-preview">
           {/* מדמה טקסט בתוך הדף */}
           <div className="text-lines">
             <span className="line full"></span>
             <span className="line full"></span>
             <span className="line half"></span>
             <span className="line full"></span>
           </div>
           <div className="preview-text-content">
             {currentFile.previewText}
           </div>
        </div>
      </div>

      {/* חלק תחתון: פרטים */}
      <div className="file-info-area">
        <div className="file-header-row">
           <div className="file-icon-small">📄</div>
           <div className="file-name-text" title={currentFile.name}>{currentFile.name}</div>
        </div>
        
        <div className="file-footer-row">
            <span className="file-date">{currentFile.lastOpened}</span>
            <div className="user-avatar-circle" title={currentFile.owner}>
              {userInitial}
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileCard;