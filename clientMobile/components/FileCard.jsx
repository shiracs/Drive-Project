import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getTokenHeader } from '../utils/auth';
import { RESOURCE_API_URL, API_BASE_URL } from '../consts/Urls';
import PermissionsPage from './PermissionsPage';
import MoveToModal from './MoveToModal';

const FileCard = ({
  file,
  onNavigate,
  onOpenImage,
  onDeleteSuccess,
  onRefresh,
  isInsideContainer,
}) => {
  const { id, name, type, isStarred, isDeleted: isSoftDeleted, isSpam } = file;
  const router = useRouter();

  const isFolder = type === 'FOLDER';
  const isImage = type === 'IMAGE';

  const [fileContent, setFileContent] = useState('Loading...');
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(name);
  const [showMoveTo, setShowMoveTo] = useState(false);
  const [isStarredLocal, setIsStarredLocal] = useState(isStarred);

  // Fetch user role
  useEffect(() => {
    if (isDeleted || !id) return;

    const fetchUserRole = async () => {
      try {
        const headers = await getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}/my-role`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else if (response.status === 403) {
          setUserRole('READER');
        }
      } catch (err) {
        console.error('Failed to fetch user role', err);
        setUserRole('READER');
      }
    };

    fetchUserRole();
  }, [id, isDeleted]);

  // Load file preview
  useEffect(() => {
    if (isDeleted || isFolder || !id) return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchPreview = async () => {
      try {
        const headers = await getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          if (
            isImage &&
            (!data.content || data.content === '') &&
            retryCount < maxRetries
          ) {
            retryCount++;
            setTimeout(() => {
              if (isMounted) fetchPreview();
            }, 500 * retryCount);
            return;
          }
          setFileContent(data.content ? data.content : '');
        }
      } catch (err) {
        console.error('Failed to load preview', err);
        if (isMounted && retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchPreview();
          }, 500 * retryCount);
        } else if (isMounted) {
          setFileContent('Error loading preview');
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [id, isFolder, isDeleted, isImage, type]);

  const handleCardPress = () => {
    if (isFolder && onNavigate) {
      onNavigate(id);
    } else if (isImage) {
      onOpenImage(id);
    } else {
      router.push(`/(tabs)/files/${id}`);
    }
  };

  const getPreviewSrc = () => {
    if (
      !fileContent ||
      fileContent === '' ||
      fileContent === 'Loading...' ||
      fileContent.includes('Error')
    ) {
      return null;
    }
    if (fileContent.startsWith('data:')) return fileContent;
    return `data:image/png;base64,${fileContent}`;
  };

  const previewSrc = isImage ? getPreviewSrc() : null;

  const handleDelete = async () => {
    setShowMenu(false);
    const deleteUrl = isSoftDeleted
      ? `${RESOURCE_API_URL}/permanent-delete/${id}`
      : `${RESOURCE_API_URL}/${id}`;

    Alert.alert('מחיקה', `האם אתה בטוח שברצונך למחוק את ${name}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getTokenHeader();
            const response = await fetch(deleteUrl, {
              method: 'DELETE',
              headers,
            });
            if (response.ok) {
              setIsDeleted(true);
              onDeleteSuccess && onDeleteSuccess(id);
              onRefresh && onRefresh();
            }
          } catch (err) {
            console.error('Delete failed', err);
            Alert.alert('שגיאה', 'מחיקה נכשלה');
          }
        },
      },
    ]);
  };

  const handleStarToggle = async () => {
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/star/${id}`, {
        method: 'PATCH',
        headers,
      });
      if (response.ok) {
        setIsStarredLocal(!isStarredLocal);
        onRefresh && onRefresh();
      }
    } catch (err) {
      console.error('Star toggle failed', err);
    }
  };

  const handleRestore = async () => {
    setShowMenu(false);
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/restore/${id}`, {
        method: 'POST',
        headers,
      });
      if (response.ok) {
        onRefresh && onRefresh();
      }
    } catch (err) {
      console.error('Restore failed', err);
      Alert.alert('שגיאה', 'שחזור נכשל');
    }
  };

  const handleSpamToggle = async () => {
    setShowMenu(false);
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/spam/${id}`, {
        method: 'PATCH',
        headers,
      });
      if (response.ok) {
        onRefresh && onRefresh();
      }
    } catch (err) {
      console.error('Spam toggle failed', err);
      Alert.alert('שגיאה', 'הדיווח כספאם נכשל');
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === name) {
      setShowRename(false);
      return;
    }

    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        file.name = newName;
        setShowRename(false);
        onRefresh && onRefresh();
      }
    } catch (err) {
      console.error('Rename failed', err);
      Alert.alert('שגיאה', 'שינוי שם נכשל');
    }
  };

  const canEdit = userRole === 'OWNER' || userRole === 'WRITER';
  const isOwner = userRole === 'OWNER';

  if (isDeleted) return null;

  if (isFolder) {
    return (
      <View style={styles.folderCardWrapper}>
        <TouchableOpacity
          style={styles.folderCard}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.folderContent}>
            <Text style={styles.folderIcon}>📁</Text>
            <Text style={styles.folderName} numberOfLines={2}>
              {name}
            </Text>
          </View>
          <View style={styles.folderActions}>
            <TouchableOpacity onPress={handleStarToggle}>
              <Text style={styles.starIcon}>
                {isStarredLocal ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={styles.menuButton}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {showMenu && (
          <View style={styles.actionMenu}>
            {isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleRestore}
                  disabled={isInsideContainer}
                >
                  <Text style={styles.menuItemText}>♻️ שחזור</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && !isOwner && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSpamToggle}
                  disabled={isSpam && isInsideContainer}
                >
                  <Text style={styles.menuItemText}>
                    ⚠️ {isSpam ? 'לא ספאם' : 'דווח כספאם'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOwner && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowPermissions(true);
                  }}
                  disabled={!isOwner}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !isOwner && styles.menuItemTextDisabled,
                    ]}
                  >
                    👥 הרשאות
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !canEdit && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowRename(true);
                  }}
                  disabled={!canEdit}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !canEdit && styles.menuItemTextDisabled,
                    ]}
                  >
                    ✏️ שינוי שם
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.menuItem,
                (!isOwner || (isSoftDeleted && isInsideContainer)) &&
                  styles.menuItemDisabled,
              ]}
              onPress={handleDelete}
              disabled={!isOwner}
            >
              <Text
                style={[
                  styles.menuItemText,
                  styles.menuItemDelete,
                  (!isOwner || (isSoftDeleted && isInsideContainer)) &&
                    styles.menuItemTextDisabled,
                ]}
              >
                🗑️ {isSoftDeleted ? 'מחיקה קבועה' : 'מחיקה'}
              </Text>
            </TouchableOpacity>

            {!isSoftDeleted && !isSpam && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOwner && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowMoveTo(true);
                  }}
                  disabled={!isOwner}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !isOwner && styles.menuItemTextDisabled,
                    ]}
                  >
                    📂 העברה
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  // File/Image Card
  return (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.previewContainer}>
        {isImage ? (
          previewSrc ? (
            <Image
              source={{ uri: previewSrc }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>🖼️</Text>
            </View>
          )
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>📄</Text>
          </View>
        )}
      </View>

      <View style={styles.fileInfoArea}>
        <View style={styles.fileHeader}>
          <View style={styles.fileNameContainer}>
            <Text style={styles.fileIcon}>{isImage ? '🖼️' : '📄'}</Text>
            <Text style={styles.fileName} numberOfLines={2}>
              {name}
            </Text>
          </View>
          <View style={styles.fileActions}>
            <TouchableOpacity onPress={handleStarToggle}>
              <Text style={styles.starIcon}>
                {isStarredLocal ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={styles.menuButton}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showMenu && (
          <View style={styles.actionMenu}>
            {isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleRestore}
                  disabled={isInsideContainer}
                >
                  <Text style={styles.menuItemText}>♻️ שחזור</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && !isOwner && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSpamToggle}
                  disabled={isSpam && isInsideContainer}
                >
                  <Text style={styles.menuItemText}>
                    ⚠️ {isSpam ? 'לא ספאם' : 'דווח כספאם'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOwner && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowPermissions(true);
                  }}
                  disabled={!isOwner}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !isOwner && styles.menuItemTextDisabled,
                    ]}
                  >
                    👥 הרשאות
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {!isSoftDeleted && (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !canEdit && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowRename(true);
                  }}
                  disabled={!canEdit}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !canEdit && styles.menuItemTextDisabled,
                    ]}
                  >
                    ✏️ שינוי שם
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.menuItem,
                (!isOwner || (isSoftDeleted && isInsideContainer)) &&
                  styles.menuItemDisabled,
              ]}
              onPress={handleDelete}
              disabled={!isOwner}
            >
              <Text
                style={[
                  styles.menuItemText,
                  styles.menuItemDelete,
                  (!isOwner || (isSoftDeleted && isInsideContainer)) &&
                    styles.menuItemTextDisabled,
                ]}
              >
                🗑️ {isSoftDeleted ? 'מחיקה קבועה' : 'מחיקה'}
              </Text>
            </TouchableOpacity>

            {!isSoftDeleted && !isSpam && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOwner && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    setShowMoveTo(true);
                  }}
                  disabled={!isOwner}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !isOwner && styles.menuItemTextDisabled,
                    ]}
                  >
                    📂 העברה
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Rename Modal */}
      <Modal visible={showRename} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שינוי שם</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="שם חדש"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRename(false);
                  setNewName(name);
                }}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRename}
              >
                <Text style={styles.modalButtonText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={showPermissions} transparent animationType="slide">
        <View style={styles.permissionsModalContainer}>
          <ScrollView style={styles.permissionsModal}>
            <View style={styles.permissionsHeader}>
              <Text style={styles.permissionsTitle}>הרשאות - {name}</Text>
              <TouchableOpacity
                onPress={() => setShowPermissions(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <PermissionsPage resourceId={id} resourceName={name} />
          </ScrollView>
        </View>
      </Modal>

      {/* Move To Modal */}
      {showMoveTo && (
        <MoveToModal
          fileId={id}
          currentName={name}
          onClose={() => setShowMoveTo(false)}
          onRefresh={onRefresh}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Folder Card Styles
  folderCardWrapper: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  folderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // File Card Styles
  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  previewContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8eaed',
  },
  previewPlaceholderText: {
    fontSize: 40,
  },
  fileInfoArea: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fileNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 0,
  },
  fileIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#202124',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Common Styles
  starIcon: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 18,
    color: '#5f6368',
  },
  actionMenu: {
    marginTop: 0,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e8eaed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: 13,
    color: '#202124',
    textAlign: 'right',
  },
  menuItemTextDisabled: {
    color: '#9aa0a6',
  },
  menuItemDelete: {
    color: '#d32f2f',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 12,
    textAlign: 'right',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 14,
    color: '#202124',
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e8eaed',
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  permissionsModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  permissionsModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  permissionsHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#5f6368',
  },
});

export default FileCard;
