import React, { useState, useMemo, useEffect } from "react";
import FileCard from "./FileCard";
import ImageModal from "./ImageModal";
import { GENERAL } from "../consts/General";

const FileGrid = ({ initialResources, fetchFolderContents, title: initialTitle }) => {
  const [resources, setResources] = useState(initialResources);
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Reset resources and history when initialResources change
  useEffect(() => {
    setResources(initialResources);
    setHistory([]);
  }, [initialResources]);

  const handleNavigate = async (folderId) => {
    setLoading(true);
    try {
      const newData = await fetchFolderContents(folderId);
      setHistory((prev) => [...prev, resources]);
      setResources(newData);
    } catch (err) {
      console.error("Navigation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prevResources = history[history.length - 1];
    setResources(prevResources);
    setHistory((prev) => prev.slice(0, -1));
  };

  const folders = useMemo(() => resources.filter((r) => r.type === "FOLDER"), [resources]);
  const files = useMemo(() => resources.filter((r) => r.type === "FILE" || r.type === "IMAGE"), [resources]);

  if (loading && resources.length === 0) return <div className="p-5 t-text-main">{GENERAL.LOADING}</div>;

  return (
    <div className="file-page-container" style={{ padding: "20px 40px", direction: "rtl" }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        {history.length > 0 && (
          <button onClick={handleBack} className="btn btn-outline-secondary rounded-circle" title="חזור"> ⬅ </button>
        )}
        <h4 className="m-0 t-text-main">{history.length > 0 ? "תוכן תיקייה" : initialTitle}</h4>
      </div>

      {resources.length === 0 ? (
        <div className="t-text-main">{GENERAL.NO_CONTENT}</div>
      ) : (
        <>
        {/* Folders */}
          {folders.length > 0 && (
            <section className="drive-section mb-5">
              <h6 className="t-text-sub mb-3">{GENERAL.FOLDERS}</h6>
              <div className="drive-grid">
                {folders.map((folder) => (
                  <FileCard key={folder.id} file={folder} onNavigate={handleNavigate} />
                ))}
              </div>
            </section>
          )}

        {/* Files */}
          {files.length > 0 && (
            <section className="drive-section">
              <h6 className="t-text-sub mb-3">{GENERAL.FILES}</h6>
              <div className="drive-grid">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} onOpenImage={(id) => setSelectedImageId(id)} />
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