import React, { useState, useMemo } from "react";
import FileCard from "../components/FileCard";
import ImageModal from "../components/ImageModal";

const FileGrid = ({ resources, onNavigate, onBack, title, showBackButton }) => {
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Get folders and files separately
  const folders = useMemo(
    () => resources.filter((r) => r.type === "FOLDER"),
    [resources]
  );
  const files = useMemo(
    () => resources.filter((r) => r.type === "FILE" || r.type === "IMAGE"),
    [resources]
  );

  return (
    <div
      className="file-page-container"
      style={{ padding: "20px 40px", direction: "rtl" }}
    >
      <div className="d-flex align-items-center gap-3 mb-4">
        {showBackButton && (
          <button
            onClick={onBack}
            className="btn btn-outline-secondary rounded-circle"
            title="חזור"
          >
            ⬅
          </button>
        )}
        {title && <h4 className="m-0 t-text-main">{title}</h4>}
      </div>

      {resources.length === 0 ? (
        <div className="t-text-main">אין פריטים להצגה.</div>
      ) : (
        <>
          {folders.length > 0 && (
            <section className="drive-section mb-5">
              <h6 className="t-text-sub mb-3">תיקיות</h6>
              <div className="drive-grid">
                {folders.map((folder) => (
                  <FileCard
                    key={folder.id}
                    file={folder}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          )}

          {files.length > 0 && (
            <section className="drive-section">
              <h6 className="t-text-sub mb-3">קבצים</h6>
              <div className="drive-grid">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onOpenImage={(id) => setSelectedImageId(id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {selectedImageId && (
        <ImageModal
          fileId={selectedImageId}
          onClose={() => setSelectedImageId(null)}
        />
      )}
    </div>
  );
};

export default FileGrid;
