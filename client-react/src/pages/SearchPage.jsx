import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../consts/Urls";
import FileGrid from "../components/FileGrid";
import { SEARCH } from "../consts/Search";
import { getTokenHeader } from "../utils/auth";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // שליפת הפרמטרים מה-URL
    const query = searchParams.get('q');
    const currentFolderId = searchParams.get('folderId'); // ה-ID של התיקייה שבה אנחנו "מטיילים" כרגע
    
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    // פונקציית טעינה: אם יש folderId טוענים תיקייה, אם אין - מבצעים חיפוש ראשוני
    const loadData = useCallback(async () => {
        setLoading(true);
        const auth = getTokenHeader();
        try {
            let data;
            if (currentFolderId) {
                // אנחנו בתוך תיקייה שהגענו אליה מהחיפוש
                const response = await fetch(`${API_BASE_URL}/files?parentId=${currentFolderId}`, { headers: auth });
                data = await response.json();
            } else if (query) {
                // אנחנו בדף תוצאות החיפוש הראשי
                const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`, { headers: auth });
                data = await response.json();
            }
            setResources(data || []);
        } catch (err) {
            console.error("Search/Navigation error:", err);
        } finally {
            setLoading(false);
        }
    }, [query, currentFolderId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNavigate = (folderId) => {
        // מעדכנים את ה-URL: שומרים על ה-q הקיים ומוסיפים/מעדכנים את ה-folderId
        setSearchParams({ q: query, folderId: folderId });
    };

    const handleBack = () => {
        // חוזר צעד אחד אחורה בהיסטוריה (בין תיקיות או חזרה לקובץ)
        navigate(-1);
    };

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            onNavigate={handleNavigate}
            onBack={handleBack}
            // מציגים חץ חזור אם אנחנו בתוך תיקייה (folderId קיים)
            showBackButton={!!currentFolderId} 
            title={currentFolderId ? "תוכן תיקייה" : `${SEARCH.RESULTS} "${query}"`} 
        />
    );
};

export default SearchPage;