import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, DeviceEventEmitter, TextInput, TouchableOpacity, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../consts/Urls";
import FileGrid from "../../components/FileGrid";
import ImageModal from "../../components/ImageModal";
import { GENERAL } from "../../consts/General";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

const SearchPage = () => {
    const { q: initialQuery, folderId } = useLocalSearchParams();
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = useState(initialQuery || "");
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState(null);

    const loadData = useCallback(async (queryToUse, currentFolderId) => {
        if (!queryToUse && !currentFolderId) {
            setResources([]);
            return;
        }

        setLoading(true);
        try {
            let data;
            if (currentFolderId) {
                const response = await fetchWithAuth(`${API_BASE_URL}/files?parentId=${currentFolderId}`);
                data = await response.json();
            } else if (queryToUse) {
                const response = await fetchWithAuth(`${API_BASE_URL}/search/${encodeURIComponent(queryToUse)}`);
                data = await response.json();
            }
            setResources(data || []);
        } catch (err) {
            console.error("Search error:", err);
            setResources([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(initialQuery, folderId);
        
        const subscription = DeviceEventEmitter.addListener('refreshFiles', () => {
            loadData(searchQuery, folderId);
        });
        return () => subscription.remove();
    }, [initialQuery, folderId, loadData]);

    const handleSearchSubmit = () => {
        router.setParams({ q: searchQuery, folderId: undefined });
        loadData(searchQuery, null);
    };

    const handleDeleteSuccess = (deletedId) => {
        setResources((prev) => prev.filter((item) => item.id !== deletedId));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={"חפש ב-Drive..."}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit} 
                    returnKeyType="search"
                    placeholderTextColor="#5f6368"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {setSearchQuery(""); setResources([]);}}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FileGrid 
                resources={resources} 
                loading={loading}
                title={folderId ? GENERAL.GO_BACK : (initialQuery ? `תוצאות חיפוש עבור "${initialQuery}"` : "חיפוש")} 
                onNavigate={(id) => router.setParams({ q: searchQuery, folderId: id })}
                onBack={() => router.back()}
                showBackButton={!!folderId} 
                onDeleteSuccess={handleDeleteSuccess}
                onRefresh={() => loadData(searchQuery, folderId)}
                onOpenImage={(id) => setSelectedImageId(id)}
            />

            {selectedImageId && (
                <ImageModal 
                    imageId={selectedImageId} 
                    onClose={() => setSelectedImageId(null)} 
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    searchBarContainer: {
        flexDirection: 'row-reverse', 
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 24,
        height: 48,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        textAlign: 'right', 
        color: '#202124',
        paddingVertical: 8,
    },
    clearText: {
        fontSize: 18,
        color: '#5f6368',
        marginLeft: 8,
        padding: 4,
    }
});

export default SearchPage;