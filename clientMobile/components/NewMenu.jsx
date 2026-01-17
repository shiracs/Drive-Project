import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Alert, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
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
      if (!response.ok) throw new Error("Server error");
      return await response.json();
    } catch (error) { throw error; }
  };

  const handleUpload = async (uploadData) => {
    const files = Array.isArray(uploadData) ? uploadData : [uploadData];
    if (!files.length) return;
    setLoading(true);
    setIsOpen(false);
    try {
      for (const file of files) {
        await createResource(file.name, file.type, file.base64, currentFolderId);
      }
      DeviceEventEmitter.emit('refreshFiles');
      if (onUpload) onUpload();
    } catch (err) {
      Alert.alert('שגיאה', 'העלאה נכשלה');
    } finally { setLoading(false); }
  };

  const handleCreateTextFile = async () => {
    setLoading(true);
    setIsOpen(false);
    try {
      await createResource(SIDEBAR_MENU.NEW_FILE_NAME || "קובץ חדש.txt", "FILE", "", currentFolderId);
      DeviceEventEmitter.emit('refreshFiles');
      if (onUpload) onUpload();
    } catch (error) { Alert.alert('שגיאה', 'יצירת קובץ נכשלה'); }
    finally { setLoading(false); }
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.newButton} 
        onPress={() => setIsOpen(!isOpen)} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#1a73e8" /> : (
          <>
            <View style={styles.plusIconContainer}>
               <MaterialCommunityIcons name="plus" size={32} color="#1a73e8" />
            </View>
            <Text style={styles.newButtonText}>{SIDEBAR_MENU.NEW_BTN || "חדש"}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCreateTextFile}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#5f6368" />
              <Text style={styles.menuItemText}>קובץ טקסט חדש</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsOpen(false); setShowCreateFolderModal(true); }}>
              <MaterialCommunityIcons name="folder-plus-outline" size={24} color="#5f6368" />
              <Text style={styles.menuItemText}>תיקייה חדשה</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <FileUploader onFileSelected={handleUpload} isDirectory={true}>
              <View style={styles.menuItem}>
                <MaterialCommunityIcons name="upload-outline" size={24} color="#5f6368" />
                <Text style={styles.menuItemText}>העלאת קבצים</Text>
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
  newButton: { 
    backgroundColor: '#fff', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 16,
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 6, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 150,
    alignSelf: 'center',
    margin: 10,
    gap: 8
  },
  plusIconContainer: {
    marginRight: -4,
  },
  newButtonText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#1f1f1f',
    fontFamily: 'sans-serif-medium' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 8, 
    minWidth: 200, 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  menuItem: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    gap: 15 
  },
  menuItemText: { 
    fontSize: 14, 
    color: '#3c4043', 
    fontWeight: '400' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#e8eaed', 
    marginVertical: 4 
  },
});