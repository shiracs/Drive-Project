import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../consts/Urls';  
import { getTokenHeader } from '../utils/auth';
import FileGrid from '../components/FileGrid';
import { GENERAL } from '../consts/General';


const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // get folderId from URL params
    const folderId = searchParams.get('folderId');

    const fetchResources = useCallback(async (id) => {
        setLoading(true);
        try {
            const auth = getTokenHeader();
            let url = `${API_BASE_URL}/files`;
            if (id) url += `?parentId=${id}`;
            
            const response = await fetch(url, { headers: auth });
            const data = await response.json();
            setResources(data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, []);

    // this effect runs every time folderId changes, to reload the appropriate files
    useEffect(() => {
        fetchResources(folderId);
    }, [folderId, fetchResources]);

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            title={folderId ? GENERAL.GO_BACK : GENERAL.MY_FILES}
            onNavigate={(id) => setSearchParams({ folderId: id })}
            onBack={() => navigate(-1)}
            showBackButton={!!folderId}
        />
    );
};

export default FilePage;