import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../consts/Urls';  
import { getTokenHeader } from '../utils/auth';
import FileGrid from '../components/FileGrid';


const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // שליפת התיקייה מה-URL
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

    // רץ בכל פעם שה-URL משתנה (כולל כשחוזרים אחורה בדפדפן!)
    useEffect(() => {
        fetchResources(folderId);
    }, [folderId, fetchResources]);

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            title={folderId ? "תוכן תיקייה" : "הקבצים שלי"}
            onNavigate={(id) => setSearchParams({ folderId: id })}
            onBack={() => navigate(-1)} // חוזר צעד אחד אחורה בהיסטוריה של ה-URL
            showBackButton={!!folderId}
        />
    );
};

export default FilePage;