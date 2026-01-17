import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Alert, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { Buffer } from 'buffer'; // חובה לטיפול מלא בתוכן ללא חיתוך
import FileUploader from './FileUploader';
import CreateFolderModal from './CreateFolderModal';
import { SIDEBAR_MENU } from '../consts/Sidebar';
import { RESOURCE_API_URL } from '../consts/Urls';
import { fetchWithAuth } from '../utils/fetchWithAuth'; 

const NewMenu = ({ onUpload, currentFolderId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const createResource = async (name, type, content = "", parentId = null) => {
    try {
      const response = await fetchWithAuth(RESOURCE_API_URL, {
        method: "POST",
        body: JSON.stringify({ name, type, content, parentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Create resource error:", error);
      throw error;
    }
  };

  const handleUpload = async (uploadData) => {
  const files = Array.isArray(uploadData) ? uploadData : 
                (uploadData.files ? uploadData.files : [uploadData]);

  if (!files || files.length === 0) return;

  setLoading(true);
  setIsOpen(false);

  try {
    for (const file of files) {
      let contentToSend = file.base64; 

      await createResource(file.name, file.type, contentToSend, currentFolderId);
    }

    Alert.alert('הצלחה', `הועלו ${files.length} קבצים בהצלחה`);
    DeviceEventEmitter.emit('refreshFiles');
    if (onUpload) onUpload();
    
  } catch (err) {
    console.error("Upload failed:", err);
    Alert.alert('שגיאה', 'חלק מהקבצים לא הועלו: ' + err.message);
  } finally {
    setLoading(false);
  }
};
  const handleCreateTextFile = async () => {
    setLoading(true);
    setIsOpen(false);
    try {
      await createResource(SIDEBAR_MENU.NEW_FILE_NAME || "קובץ חדש.txt", "FILE", "", currentFolderId);
      Alert.alert('הצלחה', 'קובץ טקסט נוצר בהצלחה');
      DeviceEventEmitter.emit('refreshFiles');
      if (onUpload) onUpload();
    } catch (error) {
      Alert.alert('שגיאה', 'יצירת קובץ נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.newButton} onPress={() => setIsOpen(!isOpen)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.newButtonIcon}>➕</Text>
            <Text style={styles.newButtonText}>{SIDEBAR_MENU.NEW_BTN || "חדש"}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCreateTextFile}>
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={styles.menuItemText}>קובץ טקסט חדש</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsOpen(false); setShowCreateFolderModal(true); }}>
              <Text style={styles.menuItemIcon}>📁</Text>
              <Text style={styles.menuItemText}>תיקייה חדשה</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <FileUploader onFileSelected={handleUpload} isDirectory={true}>
              <View style={styles.menuItem}>
                <Text style={styles.menuItemIcon}>📤</Text>
                <Text style={styles.menuItemText}>העלאת קבצים / תיקייה</Text>
              </View>
            </FileUploader>
          </View>
        </TouchableOpacity>
      </Modal>

      <CreateFolderModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSuccess={() => { DeviceEventEmitter.emit('refreshFiles'); if (onUpload) onUpload(); }}
        parentId={currentFolderId}
      />
    </View>
  );
};

export default NewMenu;

const styles = StyleSheet.create({
  newButton: { backgroundColor: '#1a73e8', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, marginHorizontal: 10, marginVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4, gap: 10 },
  newButtonIcon: { fontSize: 18, color: '#fff' },
  newButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, minWidth: 250, elevation: 10 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 15 },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { fontSize: 16, color: '#3c4043', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e8eaed', marginVertical: 5 },
});