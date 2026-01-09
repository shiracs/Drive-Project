import { useState, useEffect } from 'react';
import { SHARED_API_URL } from '../consts/Urls';  
import { getTokenHeader } from '../utils/auth';
import FileGrid from '../components/FileGrid';
import { SIDEBAR_MENU } from '../consts/Sidebar';

const SharedPage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchShared = async () => {
            setLoading(true);
            try {
                const auth = getTokenHeader();
                const response = await fetch(SHARED_API_URL, { headers: auth });
                const data = await response.json();
                setResources(data);
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchShared();
    }, []);

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            title={SIDEBAR_MENU.SHARED}
            showBackButton={false}
        />
    );
};

export default SharedPage;