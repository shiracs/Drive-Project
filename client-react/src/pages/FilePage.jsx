import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import FileCard from '../components/FileCard'; // הנחה שהקומפוננט קיים בתיקייה זו

const FilePage = () => {
    const [resources, setResources] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null); // null מסמל את תיקיית השורש
    const [folderHistory, setFolderHistory] = useState([]); // מעקב אחרי היסטוריית התיקיות לניווט אחורה
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // פונקציה לטעינת הקבצים והתיקיות
    const fetchResources = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('לא נמצא משתמש מחובר. אנא התחבר מחדש.');
                setLoading(false);
                return;
            }

            // בניית ה-URL: אם יש ID של תיקייה, מוסיפים אותו כפרמטר, אחרת טוענים את השורש
            // הערה: אנו מסתמכים על הראוט ב-web-server/routes/api.js
            // router.get('/files', ResourceController.getUserResourcesInDir);
            let url = `${API_BASE_URL}/files`;
            if (currentFolderId) {
                url += `?parentId=${currentFolderId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('שגיאה בטעינת הקבצים');
            }

            const data = await response.json();
            setResources(data); // עדכון רשימת הקבצים
        } catch (err) {
            console.error(err);
            setError('אירעה שגיאה בטעינת הקבצים.');
        } finally {
            setLoading(false);
        }
    };

    // הפעלת הטעינה בכל פעם שמשנים תיקייה
    useEffect(() => {
        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId]);

    // טיפול בכניסה לתיקייה
    const handleNavigate = (folderId) => {
        setFolderHistory((prev) => [...prev, currentFolderId]); // שמירת המיקום הנוכחי בהיסטוריה
        setCurrentFolderId(folderId); // מעבר לתיקייה החדשה
    };

    // טיפול בחזרה אחורה
    const handleGoBack = () => {
        if (folderHistory.length === 0) return;
        
        const prevHistory = [...folderHistory];
        const prevFolderId = prevHistory.pop(); // שליפת התיקייה האחרונה
        
        setFolderHistory(prevHistory);
        setCurrentFolderId(prevFolderId);
    };

    return (
        <div className="file-page-container" style={{ padding: '20px' }}>
            <h1>הקבצים שלי</h1>

            {/* כפתור חזרה למעלה אם אנחנו לא בתיקיית השורש */}
            {currentFolderId && (
                <button 
                    onClick={handleGoBack} 
                    style={{ marginBottom: '20px', padding: '5px 10px', cursor: 'pointer' }}
                >
                    ⬅ חזור לתיקייה הקודמת
                </button>
            )}

            {loading && <p>טוען קבצים...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && resources.length === 0 && (
                <p>התיקייה ריקה.</p>
            )}

            <div className="files-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {resources.map((resource) => (
                    <FileCard 
                        key={resource.id} 
                        file={resource} 
                        onNavigate={handleNavigate} // מעבירים פונקציה לטיפול בלחיצה על תיקייה
                    />
                ))}
            </div>
        </div>
    );
};

export default FilePage;