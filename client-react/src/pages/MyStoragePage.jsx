import { useState, useEffect, useCallback } from 'react';
import { OWNED_API_URL } from '../consts/Urls';  
import { getTokenHeader } from '../utils/auth';
import FileGrid from '../components/FileGrid';
import { SIDEBAR_MENU } from '../consts/Sidebar';

const MyStoragePage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOwnedResources = useCallback(async () => {
        setLoading(true);
        try {
            const auth = getTokenHeader();
            const response = await fetch(OWNED_API_URL, { 
                headers: auth 
            });

            if (!response.ok) {
                throw new Error("Failed to fetch owned resources");
            }

            const data = await response.json();
            setResources(data);
        } catch (err) { 
            console.error("Error fetching my storage:", err); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchOwnedResources();
    }, [fetchOwnedResources]);

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            title={SIDEBAR_MENU.MY_STORAGE}
            showBackButton={false}
            onRefresh={fetchOwnedResources} 
        />
    );
};

export default MyStoragePage;