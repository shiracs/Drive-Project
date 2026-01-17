import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RESOURCE_API_URL } from '../../consts/Urls';
import { getTokenHeader } from '../../utils/auth';

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
        <Text style={styles.loadingText}>טוען...</Text>
      </SafeAreaView>
    );
  }

  if (!file) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={styles.errorText}>הקובץ לא נמצא</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>חזור</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{file.name}</Text>
          <Text style={styles.fileType}>Type: {file.type}</Text>
          {file.createdAt && (
            <Text style={styles.fileDate}>
              Created: {new Date(file.createdAt).toLocaleDateString('he-IL')}
            </Text>
          )}
        </View>

        {file.type === 'IMAGE' && file.content && (
          <View style={styles.imageContainer}>
            <Text style={styles.previewLabel}>תצוגה מקדימה:</Text>
            {/* Image preview can be added here if needed */}
            <Text style={styles.contentPlaceholder}>[Image Preview]</Text>
          </View>
        )}

        {file.type === 'FILE' && file.content && (
          <View style={styles.contentContainer}>
            <Text style={styles.previewLabel}>תוכן:</Text>
            <Text style={styles.fileContent} numberOfLines={20}>
              {typeof file.content === 'string'
                ? file.content
                : JSON.stringify(file.content)}
            </Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  fileInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'right',
  },
  fileType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
    color: '#999',
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'right',
  },
  fileContent: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  contentPlaceholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 32,
  },
});
