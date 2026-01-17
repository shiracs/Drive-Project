import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getTokenHeader } from '../utils/auth';
import { API_BASE_URL } from '../consts/Urls';

const MoveToModal = ({ fileId, currentName, onClose, onRefresh }) => {
  const [items, setItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('בעמוד הבית');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const headers = await getTokenHeader();
      // Get userId from localStorage equivalent (AsyncStorage in React Native)
      // For now, we'll fetch it from the API
      setUserId('current-user');
    };
    getUserId();
  }, []);

  const fetchContent = async (parentId) => {
    setLoading(true);
    try {
      const headers = await getTokenHeader();
      const url = `${API_BASE_URL}/files${
        parentId ? `?parentId=${parentId}` : ''
      }`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      // Filter only folders that are not the current file and owned by user
      const folders = data.filter(
        (item) =>
          item.type === 'FOLDER' &&
          item.id !== fileId
      );

      setItems(folders);
    } catch (err) {
      console.error('Failed to load folder content', err);
      Alert.alert('שגיאה', 'טעינת תיקיות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(currentFolderId);
  }, [currentFolderId]);

  const navigateTo = (folder) => {
    setHistory([...history, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
    setSelectedFolderId(folder.id);
  };

  const goBack = () => {
    const newHistory = [...history];
    const prev = newHistory.pop();
    setHistory(newHistory);
    setCurrentFolderId(prev.id);
    setCurrentFolderName(prev.name);
    setSelectedFolderId(prev.id);
  };

  const handleConfirm = async () => {
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/move/${fileId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newParentId: selectedFolderId }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'הקובץ הועבר בהצלחה');
        onRefresh();
        onClose();
      } else {
        Alert.alert('שגיאה', 'העברה נכשלה');
      }
    } catch (err) {
      console.error('Failed to move file:', err);
      Alert.alert('שגיאה', 'שגיאה בהעברת קובץ');
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>העברת "{currentName}"</Text>
          </View>

          {/* Breadcrumb */}
          <View style={styles.breadcrumb}>
            {currentFolderId !== null && (
              <TouchableOpacity
                onPress={goBack}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}> חזור{">"}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.pathText}>{currentFolderName}</Text>
          </View>

          {/* Folder List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a73e8" />
            </View>
          ) : (
            <ScrollView style={styles.folderList}>
              {currentFolderId === null && (
                <TouchableOpacity
                  style={[
                    styles.folderItem,
                    selectedFolderId === null &&
                      styles.selectedFolderItem,
                  ]}
                  onPress={() => setSelectedFolderId(null)}
                >
                  <View style={styles.folderItemContent}>
                    <Text style={styles.folderItemText}>🏠 בעמוד הבית</Text>
                  </View>
                </TouchableOpacity>
              )}

              {items.map((folder) => (
                <View
                  key={folder.id}
                  style={[
                    styles.folderItem,
                    selectedFolderId === folder.id &&
                      styles.selectedFolderItem,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.folderItemContent}
                    onPress={() => setSelectedFolderId(folder.id)}
                  >
                    <Text style={styles.folderItemText}>
                      📁 {folder.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => navigateTo(folder)}
                  >
                    <Text style={styles.openButtonText}>פתח</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {items.length === 0 && currentFolderId !== null && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    אין תיקיות בתיקייה זו
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={selectedFolderId === undefined}
            >
              <Text style={styles.actionButtonText}>העבר</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: '80%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    flex: 1,
    textAlign: 'right',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#5f6368',
  },
  breadcrumb: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    gap: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e8eaed',
    borderRadius: 4,
  },
  backButtonText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '500',
  },
  pathText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    textAlign: 'right',
    flex: 1,
  },
  folderList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  folderItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  selectedFolderItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1a73e8',
  },
  folderItemContent: {
    flex: 1,
  },
  folderItemText: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
  },
  openButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1a73e8',
    borderRadius: 4,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#5f6368',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
  },
  cancelButton: {
    backgroundColor: '#e8eaed',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#202124',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MoveToModal;
