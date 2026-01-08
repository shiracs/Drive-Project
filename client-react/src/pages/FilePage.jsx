import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import FileGrid from '../components/FileGrid';

const FilePage = () => {
    const [initialResources, setInitialResources] = useState([]);

    const fetchFolderContents = async (folderId, token) => {
        let url = `${API_BASE_URL}/files`;
        if (folderId) url += `?parentId=${folderId}`;
        
        const response = await fetch(url, { headers: { 'Authorization': token } });
        if (!response.ok) throw response; 
        return response.json();
    };

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        fetchFolderContents(null, token).then(setInitialResources).catch(console.error);
    }, []);

    return (
        <FileGrid 
            initialResources={initialResources} 
            fetchFolderContents={fetchFolderContents} 
            title="הקבצים שלי" 
        />
    );
};

export default FilePage;