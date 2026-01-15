import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RESOURCE_API_URL } from '../../consts/Urls';
import { getTokenHeader } from '../../utils/auth';
import { GENERAL } from '../../consts/General';
import FileGrid from '../../components/FileGrid';

export default function FilePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState(null);

  const fetchResources = useCallback(
    async (folderId) => {
      setLoading(true);
      try {
        let finalUrl = folderId
          ? `${RESOURCE_API_URL}?parentId=${folderId}`
          : RESOURCE_API_URL;

        const auth = await getTokenHeader();
        
        const response = await fetch(finalUrl, {
          headers: {
            ...auth,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch resources");

        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResources(parentId);
  }, [parentId, fetchResources]);

  const handleDeleteSuccess = (deletedId) => {
    setResources((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const displayTitle = parentId ? GENERAL.GO_BACK : GENERAL.MY_FILES;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FileGrid
        resources={resources}
        loading={loading}
        title={displayTitle}
        onNavigate={(id) => setParentId(id)}
        onBack={() => setParentId(null)}
        showBackButton={!!parentId}
        onDeleteSuccess={handleDeleteSuccess}
        onRefresh={() => fetchResources(parentId)}
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