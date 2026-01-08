import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { GENERAL } from '../consts/General';

const ImageModal = ({ fileId, onClose }) => {
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
                    headers: { 'Authorization': token }
                });
                const data = await response.json();
                setImageData(data);
            } catch (err) {
                console.error("Error loading image", err);
            } finally {
                setLoading(false);
            }
        };

        if (fileId) fetchImage();

        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [fileId, onClose]);

    if (!fileId) return null;

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <div className="viewer-header" onClick={e => e.stopPropagation()}>
                <div className="header-left">
                    <button className="icon-btn close-btn" onClick={onClose}>✕</button>
                    <span className="viewer-filename">{imageData?.name || GENERAL.LOADING}</span>
                </div>
                <div className="header-right">
                    {imageData?.content && (
                        <a href={imageData.content} download={imageData.name} className="icon-btn">⬇</a>
                    )}
                </div>
            </div>

            <div className="viewer-body">
                {loading ? (
                    <div className="t-text-main">{GENERAL.LOADING}</div>
                ) : (
                    <div className="image-wrapper" onClick={e => e.stopPropagation()}>
                        <img src={imageData?.content} alt="" className="full-res-image" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageModal;