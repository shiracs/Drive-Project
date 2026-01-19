import { useState, useCallback } from "react";
import { StyleSheet, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import FileGrid from "./FileGrid";
import ImageModal from "./ImageModal";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { GENERAL } from "../consts/General";
import { RESOURCE_API_URL } from "../consts/Urls";

export default function BaseFilePage({ apiUrl, title }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  

  const fetchResources = useCallback(async (currentFolderId) => {
    setLoading(true);
    try {
      const isStarredPage = title === "מסומן בכוכב" || apiUrl.includes("starred");
      const isTrashPage = title === "אשפה" || apiUrl.includes("trash");
      const isSpamPage = title === "ספאם" || apiUrl.includes("spam");

      let urlToUse = apiUrl;
      if (currentFolderId && isStarredPage) {
        urlToUse = RESOURCE_API_URL;
      }

      let finalUrl = currentFolderId ? `${urlToUse}?parentId=${currentFolderId}` : urlToUse;
      if (currentFolderId && urlToUse.includes('?')) {
         finalUrl = `${urlToUse}&parentId=${currentFolderId}`;
      }

      const response = await fetchWithAuth(finalUrl);
      if (!response?.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();

      let filteredData = data;
      
      if (Array.isArray(data)) {
        if (!isTrashPage) {
            filteredData = filteredData.filter(item => !item.isDeleted);
        }

        if (!isSpamPage && !isTrashPage) {
            filteredData = filteredData.filter(item => !item.isSpam);
        }
        
        if (isStarredPage && !currentFolderId) {
             filteredData = filteredData.filter(item => item.isStarred);
        }
        
      }

      setResources(filteredData);

    } catch (err) {
      console.error(`Fetch error for ${title}:`, err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, title]);

  useFocusEffect(
    useCallback(() => {
      fetchResources(parentId);

      const subscription = DeviceEventEmitter.addListener("refreshFiles", () => {
        fetchResources(parentId);
      });

      return () => {
        subscription.remove();
      };
    }, [parentId, fetchResources])
  );

  const handleDeleteSuccess = (deletedId) => {
    setResources((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const displayTitle = parentId ? GENERAL.GO_BACK : title;
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <FileGrid
        resources={resources}
        loading={loading}
        title={displayTitle}
        onNavigate={(id) => setParentId(id)} 
        onBack={() => setParentId(null)}
        showBackButton={!!parentId}
        onDeleteSuccess={handleDeleteSuccess}
        onRefresh={() => fetchResources(parentId)}
        onOpenImage={(id) => setSelectedImageId(id)}
      />
      {Boolean(selectedImageId) && (
        <ImageModal
          imageId={selectedImageId}
          onClose={() => setSelectedImageId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
});