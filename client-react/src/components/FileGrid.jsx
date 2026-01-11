import { useMemo, useState } from "react";
import { GENERAL } from "../consts/General";
import FileCard from "./FileCard";
import ImageModal from "./ImageModal";
import "./styles/FileGrid.css";

const FileGrid = ({
  resources,
  onNavigate,
  onBack,
  title,
  subTitle,
  showBackButton,
  loading,
  onDeleteSuccess,
  onRefresh,
}) => {
  const [selectedImageId, setSelectedImageId] = useState(null);

  const safeResources = Array.isArray(resources) ? resources : [];
  const folders = useMemo(
    () => safeResources.filter((r) => r.type === "FOLDER"),
    [safeResources]
  );
  const files = useMemo(
    () => safeResources.filter((r) => r.type === "FILE" || r.type === "IMAGE"),
    [safeResources]
  );

  if (loading && safeResources.length === 0)
    return <div className="p-5 t-text-main">{GENERAL.LOADING}</div>;
  return (
    <div
      className="file-page-container"
      style={{ padding: "20px 40px", direction: "rtl" }}
    >
      <div className="d-flex align-items-center gap-3 mb-4">
        {/* Header with optional back button */}
        {showBackButton && (
          <button className="back-button" onClick={onBack}>
            <span className="back-arrow"></span>
          </button>
        )}
        <h4 className="m-0 t-text-main">{title}</h4>
        <h6 className="m-0 t-text-main">{subTitle}</h6>
      </div>

      {resources.length === 0 && !loading ? (
        <div className="t-text-main">{GENERAL.NO_CONTENT}</div>
      ) : (
        <>
          {/* Folder area */}
          {folders.length > 0 && (
            <section className="drive-section mb-5">
              <h6 className="t-text-sub mb-3">{GENERAL.FOLDERS}</h6>
              <div className="drive-grid">
                {folders.map((folder) => (
                  <FileCard
                    key={folder.id}
                    file={folder}
                    onNavigate={onNavigate}
                    onDeleteSuccess={onDeleteSuccess}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>
            </section>
          )}

          {/* File & Image area */}
          {files.length > 0 && (
            <section className="drive-section">
              <h6 className="t-text-sub mb-3">{GENERAL.FILES}</h6>
              <div className="drive-grid">
                {files.map((file) => (
                  <FileCard
                    key={file.id+file.name}
                    file={file}
                    onOpenImage={setSelectedImageId}
                    onDeleteSuccess={onDeleteSuccess}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {/* Image Modal to view images */}
      {selectedImageId && (
        <ImageModal
          fileId={selectedImageId}
          onClose={() => {
            setSelectedImageId(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};
export default FileGrid;
