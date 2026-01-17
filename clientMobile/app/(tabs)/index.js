import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RESOURCE_API_URL } from "../../consts/Urls";
import { getTokenHeader } from "../../utils/auth";
import { GENERAL } from "../../consts/General";
import FileGrid from "../../components/FileGrid";
import ImageModal from "../../components/ImageModal";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export default function FilePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const fetchResources = useCallback(async (folderId) => {
    setLoading(true);
    try {
      let finalUrl = folderId
        ? `${RESOURCE_API_URL}?parentId=${folderId}`
        : RESOURCE_API_URL;

      const response = await fetchWithAuth(finalUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response?.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err instanceof SyntaxError) {
        console.error("Invalid JSON response from server");
      }
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const displayTitle = parentId ? GENERAL.GO_BACK : GENERAL.MY_FILES;

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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});
