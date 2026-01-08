import React, { useMemo, useState } from "react";
import { GENERAL } from "../consts/General";
import FileCard from "./FileCard";
import ImageModal from "./ImageModal";  

const FileGrid = ({ resources, onNavigate, onBack, title, showBackButton, loading }) => {
  const [selectedImageId, setSelectedImageId] = useState(null);

  const folders = useMemo(() => resources.filter((r) => r.type === "FOLDER"), [resources]);
  const files = useMemo(() => resources.filter((r) => r.type === "FILE" || r.type === "IMAGE"), [resources]);

  if (loading && resources.length === 0) return <div className="p-5 t-text-main">{GENERAL.LOADING}</div>;

  return (
    <div className="file-page-container" style={{ padding: "20px 40px", direction: "rtl" }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        {showBackButton && (
          <button className="back-button" onClick={onBack}><span className="back-arrow"></span></button>
        )}
        <h4 className="m-0 t-text-main">{title}</h4>
      </div>

      {resources.length === 0 && !loading ? (
        <div className="t-text-main">{GENERAL.NO_CONTENT}</div>
      ) : (
        <>
          {folders.length > 0 && (
            <section className="drive-section mb-5">
              <h6 className="t-text-sub mb-3">{GENERAL.FOLDERS}</h6>
              <div className="drive-grid">
                {folders.map((folder) => (
                  <FileCard key={folder.id} file={folder} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}

          {files.length > 0 && (
            <section className="drive-section">
              <h6 className="t-text-sub mb-3">{GENERAL.FILES}</h6>
              <div className="drive-grid">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} onOpenImage={setSelectedImageId} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {selectedImageId && <ImageModal fileId={selectedImageId} onClose={() => setSelectedImageId(null)} />}
    </div>
  );
};
export default FileGrid;