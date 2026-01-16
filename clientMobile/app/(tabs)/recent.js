import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RECENT_API_URL } from '../../consts/Urls';
import { getTokenHeader } from '../../utils/auth';
import FileGrid from '../../components/FileGrid';

export default function RecentPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentResources = useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getTokenHeader();
      const response = await fetch(RECENT_API_URL, {
        headers: {
          ...auth,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recent resources");

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
    fetchRecentResources();
  }, [fetchRecentResources]);

  const handleDeleteSuccess = (deletedId) => {
    setResources((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FileGrid
        resources={resources}
        loading={loading}
        title="עדכן לאחרונה"
        onDeleteSuccess={handleDeleteSuccess}
        onRefresh={fetchRecentResources}
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
