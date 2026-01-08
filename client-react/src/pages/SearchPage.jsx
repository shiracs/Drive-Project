import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../consts/Urls";
import FileGrid from "../components/FileGrid";
import { SEARCH } from "../consts/Search";
import { GENERAL } from "../consts/General";
import { getTokenHeader } from "../utils/auth";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // get search query and current folderId from URL
    const query = searchParams.get('q');
    const currentFolderId = searchParams.get('folderId'); 
    
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    // load data every time query or folderId changes
    const loadData = useCallback(async () => {
        setLoading(true);
        const auth = getTokenHeader();
        try {
            let data;
            if (currentFolderId) {
                // if we want to see contents of a specific folder from the search results
                const response = await fetch(`${API_BASE_URL}/files?parentId=${currentFolderId}`, { headers: auth });
                data = await response.json();
            } else if (query) {
                // we are on the main search results page
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

    return (
        <FileGrid 
            resources={resources} 
            loading={loading}
            onNavigate={(folderId) => setSearchParams({ q: query, folderId })}
            onBack={() => navigate(-1)}
            // show the back button only if we are inside a folder = currentFolderId has a value
            showBackButton={!!currentFolderId} 
            title={currentFolderId ? GENERAL.GO_BACK : `${SEARCH.RESULTS} "${query}"`} 
        />
    );
};

export default SearchPage;