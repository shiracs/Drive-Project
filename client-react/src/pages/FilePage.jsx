import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import FileCard from '../components/FileCard';
import { UI_TEXT } from '../consts/FilePage';
import '../App.css'; 
  
const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderHistory, setFolderHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';
    
    const fetchResources = useCallback(async () => {
        setLoading(true);
        setError('');
        
        // check authentication token 
        const token = localStorage.getItem('userToken');
        
        // if no token, redirect to login
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // build URL with current folder if applicable
            let url = `${API_BASE_URL}/files`;
            if (currentFolderId) {
                url += `?parentId=${currentFolderId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token 
                }
            });

            if (response.status === 401 || response.status === 403) {
                // unauthorized, redirect to login
                localStorage.removeItem('userToken');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const data = await response.json();
            setResources(data);

        } catch (err) {
            console.error(err);
            setError('Error loading files. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, navigate]);

    // call server whenever current folder changes
    useEffect(() => {
        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId]);

    // navigate into folder
    const handleNavigate = (folderId) => {
        setFolderHistory((prev) => [...prev, currentFolderId]); 
        setCurrentFolderId(folderId);
    };

    // go back up one folder
    const handleGoBack = () => {
        if (folderHistory.length === 0) return;
        
        const newHistory = [...folderHistory];
        const prevFolderId = newHistory.pop();
        
        setFolderHistory(newHistory);
        setCurrentFolderId(prevFolderId);
    };

    // logout user
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const folders = useMemo(() => resources.filter(r => r.type === 'FOLDER'), [resources]);
    const files = useMemo(() => resources.filter(r => r.type === 'FILE'), [resources]);

    return (
        <div className="file-page-container" style={{ padding: '20px 40px', backgroundColor: '#f8f9fa', minHeight: '100vh', direction: 'rtl' }}>
        
        {/* go back button */}
        {folderHistory.length > 0 && (
        <div className="back-button-container">
            <button 
                onClick={handleGoBack}
                className="back-button"
            >
                <span>⬅️</span> {UI_TEXT.BACK_BUTTON}
            </button>
        </div>
        )}
    
        {/* file zone header */}
        {folders.length > 0 && (
            <section className="drive-section">
                <div className="drive-grid">
                    {folders.map(folder => (
                        <FileCard 
                            key={folder.id} 
                            file={folder} 
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            </section>
        )}

        {/* file zone files - always below folders */}
        {files.length > 0 && (
            <section className="drive-section" style={{ marginTop: '20px' }}>
                <div className="drive-grid">
                    {files.map(file => (
                        <FileCard 
                            key={file.id} 
                            file={file} 
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            </section>
        )}
        {/* when no files or folders */}
        {!loading && resources.length === 0 && (
            <div className="empty-folder-message">
                {UI_TEXT.EMPTY_FOLDER}
            </div>
        )}
        </div>
    );
};


export default FilePage;