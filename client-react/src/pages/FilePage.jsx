import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import FileCard from '../components/FileCard';
import '../App.css'; 

const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderHistory, setFolderHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';

    // load files from server
    const fetchResources = async () => {
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
    };

    // call server whenever current folder changes
    useEffect(() => {
        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId]);

    // navigate into folder
    const handleNavigate = (folderId) => {
        setFolderHistory((prev) => [...prev, currentFolderId]); // save history
        setCurrentFolderId(folderId); // update current folder
    };

    // go back up one folder
    const handleGoBack = () => {
        if (folderHistory.length === 0) return; // can't go back if at root
        
        const newHistory = [...folderHistory];
        const prevFolderId = newHistory.pop(); // pop last folder
        
        setFolderHistory(newHistory);
        setCurrentFolderId(prevFolderId);
    };

    // logout user
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="file-page-container" style={{ padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* כותרת וכפתור התנתקות */}
            <header className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>האחסון של {username}</h2>
                    {currentFolderId && (
                        <button 
                            className="btn btn-outline-secondary btn-sm mt-2" 
                            onClick={handleGoBack}
                        >
                            ⬆ חזור תיקייה אחת למעלה
                        </button>
                    )}
                </div>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                    התנתק
                </button>
            </header>

            {/* error/loading states */}
            {loading && <div className="text-center">טוען...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* files display area */}
            <div className="d-flex flex-wrap" style={{ gap: '15px' }}>
                {!loading && resources.length === 0 && !error && (
                    <p className="text-muted">התיקייה ריקה.</p>
                )}

                {resources.map((file) => (
                    <FileCard 
                        key={file.id} 
                        file={file} 
                        onNavigate={handleNavigate} 
                    />
                ))}
            </div>
        </div>
    );
};

export default FilePage;