import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../consts/Urls';
import FileGrid from '../components/FileGrid';
import { SEARCH } from '../consts/Search';
import { getTokenHeader } from '../';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [initialResults, setInitialResults] = useState([]);

    const fetchFolderContents = async (folderId, token) => {
        const response = await fetch(`${API_BASE_URL}/files?parentId=${folderId}`, {
            headers: { 'Authorization': token }
        });
        if (!response.ok) throw response;
        return response.json();
    };

    useEffect(() => {
        const doSearch = async () => {
            if (!query) return;
            const auth = getTokenHeader();
            const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`, {
                headers: auth
            });
            const data = await response.json();
            setInitialResults(data);
        };
        doSearch();
    }, [query]);

    return (
        <FileGrid 
            initialResources={initialResults} 
            fetchFolderContents={fetchFolderContents} 
            title={`${SEARCH.RESULTS} "${query}"`} 
        />
    );
};

export default SearchPage;