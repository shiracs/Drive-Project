import React, { useState, useEffect } from "react";
import { RESOURCE_API_URL, API_BASE_URL } from "../consts/Urls";
import FileUploader from "./FileUploader";
import { GENERAL } from "../consts/General";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import './styles/ImageModal.css';

const ImageModal = ({ fileId, onClose }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchImage = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/files/${fileId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
      
        if ((!data.content || data.content === "") && retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchImage();
          }, 500 * retryCount);
          return;
        }
        
        if (isMounted) {
          if (data.content && !data.content.startsWith("data:")) {
            data.content = `data:image/png;base64,${data.content}`;
          }
          setImageData(data);
        }
      } catch (err) {
        console.error("Error loading image", err);
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchImage();
          }, 500 * retryCount);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (fileId) fetchImage();

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [fileId, onClose]);

  const handleImageUpdate = async (fileData) => {
    try {
      const cleanBase64 = fileData.base64.split(",")[1];

      const response = await fetchWithAuth(`${RESOURCE_API_URL}/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fileData.name,
          content: cleanBase64,
        }),
      });

      if (response.ok) {
        setImageData((prev) => ({
          ...prev,
          content: fileData.base64,
          name: fileData.name,
        }));
        alert("התמונה עודכנה בהצלחה!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "שגיאה בעדכון");
      }
    } catch (err) {
      alert("שגיאה: " + err.message);
    }
  };
  if (!fileId) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="viewer-header" onClick={(e) => e.stopPropagation()}>
        <div className="header-left">
          <button className="icon-btn close-btn" onClick={onClose}>
            ✕
          </button>
          <span className="viewer-filename">
            {imageData?.name || GENERAL.LOADING}
          </span>
        </div>
        <FileUploader
          onFileSelected={handleImageUpdate}
          accept="image/*"
          label="החלף תמונה"
        />
        <div className="header-right">
          {imageData?.content && (
            <a
              href={imageData.content}
              download={imageData.name}
              className="icon-btn"
            >
              ⬇
            </a>
          )}
        </div>
      </div>

      <div className="viewer-body">
        {loading ? (
          <div className="t-text-main">{GENERAL.LOADING}</div>
        ) : (
          <div className="image-wrapper" onClick={(e) => e.stopPropagation()}>
            <img src={imageData?.content} alt="" className="full-res-image" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
