import { useState, useEffect, useCallback } from "react";
import { StyleSheet, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FileGrid from "./FileGrid";
import ImageModal from "./ImageModal";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { GENERAL } from "../consts/General";

export default function BaseFilePage({ apiUrl, title }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const fetchResources = useCallback(async (folderId) => {
    setLoading(true);
    try {
      let finalUrl = folderId ? `${apiUrl}?parentId=${folderId}` : apiUrl;

      const response = await fetchWithAuth(finalUrl);
      if (!response?.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error(`Fetch error for ${title}:`, err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, title]);

  useEffect(() => {
    fetchResources(parentId);
    const subscription = DeviceEventEmitter.addListener("refreshFiles", () => {
      fetchResources(parentId);
    });
    return () => subscription.remove();
  }, [parentId, fetchResources]);

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