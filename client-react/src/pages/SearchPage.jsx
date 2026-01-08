import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import FileGrid from '../pages/FileGrid';
import { SEARCH } from '../consts/Search';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    
    const [currentResources, setCurrentResources] = useState([]);
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Fetch folder content by ID
    const fetchFolderContent = useCallback(async (folderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/files?parentId=${folderId}`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            setCurrentResources(data);
        } catch (err) {
            console.error("Failed to fetch folder content", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial search effect
    useEffect(() => {
        const fetchInitialSearch = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': token }
                });
                const data = await response.json();
                setCurrentResources(data);
                setHistory([]); 
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialSearch();
    }, [query]);

    const handleNavigate = (folderId) => {
        setHistory(prev => [...prev, currentResources]);
        fetchFolderContent(folderId);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        
        const newHistory = [...history];
        const lastResults = newHistory.pop();
        
        setHistory(newHistory);
        setCurrentResources(lastResults);
    };

    if (loading && currentResources.length === 0) return <div className="p-5">טוען תוצאות...</div>;

    return (
        <FileGrid 
            resources={currentResources}
            title={`${SEARCH.RESULTS} "${query}"`}
            onNavigate={handleNavigate} 
            onBack={handleBack}
            showBackButton={history.length > 0}
        />
    );
};

export default SearchPage;