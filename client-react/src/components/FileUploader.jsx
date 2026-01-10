import React, { useRef } from "react";
import { FILE } from "../consts/FilePage";
import './styles/FileUploader.css';

const FileUploader = ({
  onFileSelected,
  accept = "*/*",
  label = FILE.UPLOAD_FILE,
  customItem,
  isDirectory = false,
}) => {
  const inputRef = useRef(null);

  const triggerPicker = (e) => {
    e.stopPropagation();
    inputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isDirectory) {
      const filesArray = Array.from(files);
      const folderName = filesArray[0].webkitRelativePath.split("/")[0];
      onFileSelected({ name: folderName, files: filesArray, isFolder: true });
    } else {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onFileSelected({
          name: file.name,
          type: file.type,
          base64: reader.result,
          isFolder: false,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        hidden
        {...(isDirectory ? { webkitdirectory: "", directory: "" } : {})}
      />
      {customItem ? (
        <div onClick={triggerPicker} style={{ cursor: "pointer" }}>
          {customItem}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerPicker}
          className="btn btn-outline-primary btn-sm"
        >
          {label}
        </button>
      )}
    </>
  );
};

export default FileUploader;
