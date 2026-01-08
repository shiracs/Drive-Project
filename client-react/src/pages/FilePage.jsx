import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import FileGrid from '../pages/FileGrid';
import '../App.css'; 
  
const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderHistory, setFolderHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    
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

    return (
        <FileGrid 
        resources={resources} 
        title={"הקבצים שלי"}
        onNavigate={handleNavigate}
        onBack={handleGoBack} 
        showBackButton={folderHistory.length > 0} 
    />
    );
};


export default FilePage;