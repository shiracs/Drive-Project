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
  DeviceEventEmitter // חשוב מאוד לייבוא עבור הריענון
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

  // פונקציית עזר לריענון אחרי פעולות
  const handleActionSuccess = () => {
    setShowMenu(false);
    DeviceEventEmitter.emit('refreshFiles'); 
    if (onRefresh) onRefresh();
  };

  // משיכת התפקיד של המשתמש (Owner/Reader/Writer)
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

  // משיכת תצוגה מקדימה (Preview)
  useEffect(() => {
    if (isDeleted || isFolder || !id) return;
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        const headers = await getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (isMounted) setFileContent(data.content || '');
      } catch (err) {
        if (isMounted) setFileContent('Error');
      }
    };
    fetchPreview();
    return () => { isMounted = false; };
  }, [id, isFolder, isDeleted]);

  const handleCardPress = () => {
    if (isFolder && onNavigate) {
      onNavigate(id);
    } else if (isImage && onOpenImage) {
      onOpenImage(id);
    } else {
      router.push(`/(tabs)/files/${id}`);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    const deleteUrl = isSoftDeleted
      ? `${RESOURCE_API_URL}/permanent-delete/${id}`
      : `${RESOURCE_API_URL}/${id}`;

    Alert.alert('מחיקה', `האם למחוק את ${name}?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: async () => {
          try {
            const headers = await getTokenHeader();
            const response = await fetch(deleteUrl, { method: 'DELETE', headers });
            if (response.ok) {
              setIsDeleted(true);
              handleActionSuccess();
            }
          } catch (err) { Alert.alert('שגיאה', 'מחיקה נכשלה'); }
      }},
    ]);
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
        setShowRename(false);
        handleActionSuccess();
      }
    } catch (err) { Alert.alert('שגיאה', 'שינוי שם נכשל'); }
  };

  const handleStarToggle = async () => {
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/star/${id}`, { method: 'PATCH', headers });
      if (response.ok) {
        setIsStarredLocal(!isStarredLocal);
        handleActionSuccess();
      }
    } catch (err) { console.error('Star toggle failed', err); }
  };

  const canEdit = userRole === 'OWNER' || userRole === 'WRITER';
  const isOwner = userRole === 'OWNER';

  if (isDeleted) return null;

  // פונקציה לרינדור תפריט הפעולות (משותף)
  const renderActionMenu = () => (
    <View style={styles.actionMenu}>
      {!isSoftDeleted && (
        <>
          <TouchableOpacity 
            style={[styles.menuItem, !isOwner && styles.menuItemDisabled]} 
            onPress={() => { setShowMenu(false); setShowPermissions(true); }}
            disabled={!isOwner}
          >
            <Text style={[styles.menuItemText, !isOwner && styles.menuItemTextDisabled]}>👥 הרשאות</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity 
            style={[styles.menuItem, !canEdit && styles.menuItemDisabled]} 
            onPress={() => { setShowMenu(false); setShowRename(true); }}
            disabled={!canEdit}
          >
            <Text style={[styles.menuItemText, !canEdit && styles.menuItemTextDisabled]}>✏️ שינוי שם</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity 
            style={[styles.menuItem, !isOwner && styles.menuItemDisabled]} 
            onPress={() => { setShowMenu(false); setShowMoveTo(true); }}
            disabled={!isOwner}
          >
            <Text style={[styles.menuItemText, !isOwner && styles.menuItemTextDisabled]}>📂 העברה</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
        </>
      )}
      <TouchableOpacity style={styles.menuItem} onPress={handleDelete} disabled={!isOwner}>
        <Text style={[styles.menuItemText, styles.menuItemDelete, !isOwner && styles.menuItemTextDisabled]}>
          🗑️ {isSoftDeleted ? 'מחיקה קבועה' : 'מחיקה'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={isFolder ? styles.folderCardWrapper : styles.fileCard}>
      <TouchableOpacity style={isFolder ? styles.folderCard : styles.cardContent} onPress={handleCardPress} activeOpacity={0.7}>
        
        {!isFolder && (
          <View style={styles.previewContainer}>
            {isImage && fileContent && fileContent !== 'Loading...' ? (
              <Image source={{ uri: fileContent.startsWith('data:') ? fileContent : `data:image/png;base64,${fileContent}` }} style={styles.previewImage} />
            ) : (
              <Text style={styles.previewPlaceholderText}>{isImage ? '🖼️' : '📄'}</Text>
            )}
          </View>
        )}

        <View style={isFolder ? styles.folderContent : styles.fileInfoArea}>
          <View style={styles.fileHeader}>
            <View style={styles.fileNameContainer}>
              <Text style={styles.fileIcon}>{isFolder ? '📁' : (isImage ? '🖼️' : '📄')}</Text>
              <Text style={styles.fileName} numberOfLines={isFolder ? 1 : 2}>{name}</Text>
            </View>
            <View style={styles.fileActions}>
              <TouchableOpacity onPress={handleStarToggle}>
                <Text style={styles.starIcon}>{isStarredLocal ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuButton}>
                <Text style={styles.menuIcon}>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {showMenu && renderActionMenu()}

     <Modal visible={showRename} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שינוי שם</Text>
            <TextInput style={styles.modalInput} value={newName} onChangeText={setNewName} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowRename(false)}>
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleRename}>
                <Text style={styles.modalButtonText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPermissions} transparent animationType="slide">
        <View style={styles.permissionsModalContainer}>
          <View style={styles.permissionsHeader}>
            <Text style={styles.permissionsTitle}>הרשאות - {name}</Text>
            <TouchableOpacity onPress={() => setShowPermissions(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <PermissionsPage resourceId={id} resourceName={name} />
        </View>
      </Modal>

      {Boolean(showMoveTo) && (
        <MoveToModal fileId={id} currentName={name} onClose={() => setShowMoveTo(false)} onRefresh={handleActionSuccess} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  folderCardWrapper: { marginHorizontal: 12, marginBottom: 12 },
  folderCard: { 
    backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e8eaed',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2
  },
  folderContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileCard: { 
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, marginHorizontal: 12, 
    borderWidth: 1, borderColor: '#e8eaed', elevation: 2, overflow: 'hidden' 
  },
  cardContent: { width: '100%' },
  previewContainer: { width: '100%', height: 120, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewPlaceholderText: { fontSize: 40 },
  fileInfoArea: { padding: 12, borderTopWidth: 1, borderTopColor: '#e8eaed' },
  fileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fileNameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileIcon: { fontSize: 20, marginRight: 8 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#202124', flex: 1, textAlign: 'right' },
  fileActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starIcon: { fontSize: 18 },
  menuIcon: { fontSize: 20, color: '#5f6368', paddingHorizontal: 4 },
  actionMenu: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, borderRadius: 4, borderWidth: 1, borderColor: '#e8eaed', elevation: 3 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 14, color: '#202124', textAlign: 'right' },
  menuItemDelete: { color: '#d32f2f' },
  menuItemDisabled: { opacity: 0.4 },
  divider: { height: 1, backgroundColor: '#e8eaed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 8, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'right' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 4, marginBottom: 15, textAlign: 'right' },
  modalButtons: { flexDirection: 'row-reverse', gap: 10 },
  modalButton: { padding: 10, borderRadius: 4, flex: 1, alignItems: 'center' },
  confirmButton: { backgroundColor: '#1a73e8' },
  cancelButton: { backgroundColor: '#e8eaed' },
  modalButtonText: { color: '#fff', fontWeight: '500' },
  permissionsModalContainer: { flex: 1, backgroundColor: '#fff' },
  permissionsHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  permissionsTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButtonText: { fontSize: 22, color: '#5f6368' }
});

export default FileCard;