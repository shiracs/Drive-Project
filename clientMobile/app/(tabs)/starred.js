import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STARRED_API_URL } from '../../consts/Urls';
import { getTokenHeader } from '../../utils/auth';
import FileGrid from '../../components/FileGrid';

export default function StarredPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStarredResources = useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getTokenHeader();
      const response = await fetch(STARRED_API_URL, {
        headers: {
          ...auth,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch starred resources");

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
      fetchStarredResources();
  
      const subscription = DeviceEventEmitter.addListener("refreshFiles", () => {
        fetchStarredResources();
      });
  
      return () => subscription.remove();
    }, [fetchStarredResources]);

  const handleDeleteSuccess = (deletedId) => {
    setResources((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FileGrid
        resources={resources}
        loading={loading}
        title="מסומן בכוכב"
        onDeleteSuccess={handleDeleteSuccess}
        onRefresh={fetchStarredResources}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
