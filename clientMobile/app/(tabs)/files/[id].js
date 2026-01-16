import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RESOURCE_API_URL } from '../../../consts/Urls';
import { getTokenHeader } from '../../../utils/auth';

export default function FilePage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchFileDetails();
    }
  }, [id]);

  const fetchFileDetails = async () => {
    setLoading(true);
    try {
      const auth = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/${id}`, {
        headers: {
          ...auth,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file details");
      }

      const data = await response.json();
      setFile(data);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err instanceof SyntaxError) {
        console.error("Invalid JSON response from server");
      }
      Alert.alert("Error", "Failed to load file details");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!file) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>הקובץ לא נמצא</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>חזור</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{file.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.fileInfoCard}>
          <Text style={styles.fileName}>{file.name}</Text>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>סוג:</Text>
            <Text style={styles.metadataValue}>{file.type}</Text>
          </View>
          {file.createdAt && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>תאריך יצירה:</Text>
              <Text style={styles.metadataValue}>
                {new Date(file.createdAt).toLocaleDateString('he-IL')}
              </Text>
            </View>
          )}
          {file.updatedAt && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>עדכון אחרון:</Text>
              <Text style={styles.metadataValue}>
                {new Date(file.updatedAt).toLocaleDateString('he-IL')}
              </Text>
            </View>
          )}
        </View>

        {(file.type === 'IMAGE' || file.type === 'FILE') && file.content && (
          <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>תצוגה מקדימה</Text>
            {file.type === 'IMAGE' ? (
              <View style={styles.imagePreview}>
                <Text style={styles.previewPlaceholder}>🖼️ תמונה</Text>
              </View>
            ) : (
              <Text style={styles.fileContent} numberOfLines={30}>
                {typeof file.content === 'string'
                  ? file.content.length > 500
                    ? file.content.substring(0, 500) + '...'
                    : file.content
                  : JSON.stringify(file.content)}
              </Text>
            )}
          </View>
        )}

        {!file.content && (
          <View style={styles.contentCard}>
            <Text style={styles.emptyStateText}>אין תוכן להצגה</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  backIcon: {
    fontSize: 24,
    color: '#202124',
    width: 32,
    textAlign: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 16,
    textAlign: 'right',
  },
  metadataRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5f6368',
  },
  metadataValue: {
    fontSize: 13,
    color: '#202124',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 12,
    textAlign: 'right',
  },
  fileContent: {
    fontSize: 12,
    color: '#3c4043',
    fontFamily: 'monospace',
    lineHeight: 18,
    textAlign: 'right',
  },
  imagePreview: {
    height: 200,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholder: {
    fontSize: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#1a73e8',
    borderRadius: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
