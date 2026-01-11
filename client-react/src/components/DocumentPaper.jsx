import './styles/DocumentPaper.css';

const DocumentPaper = ({ content, setContent, isEditing }) => {
  return (
    <div className="document-paper">
      <div className="document-body">
        {isEditing ? (
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
};

export default DocumentPaper;