import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import FileUploader from './FileUploader';
import CreateFolderModal from './CreateFolderModal';
import { SIDEBAR_MENU } from '../consts/Sidebar';
import { RESOURCE_API_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';

const NewMenu = ({ onUpload, currentFolderId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => res(reader.result);
      reader.onerror = (e) => rej(e);
    });

  const createResource = async (name, type, content = "", parentId = null) => {
    try {
      const auth = await getTokenHeader();
      const response = await fetch(RESOURCE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
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
    setLoading(true);
    try {
      if (uploadData.isFolder) {
        const sortedFiles = [...uploadData.files].sort(
          (a, b) =>
            (a.webkitRelativePath?.split("/").length || 1) -
            (b.webkitRelativePath?.split("/").length || 1)
        );

        const folderIdMap = { "": currentFolderId };

        for (const file of sortedFiles) {
          const parts = (file.webkitRelativePath || file.name).split("/");
          const fileName = parts.pop();
          let runningPath = "";
          let lastParentId = currentFolderId;

          for (const folderName of parts) {
            const currentPath = runningPath
              ? `${runningPath}/${folderName}`
              : folderName;
            if (!folderIdMap[currentPath]) {
              const newFolder = await createResource(
                folderName,
                "FOLDER",
                "",
                lastParentId
              );
              folderIdMap[currentPath] = newFolder.id;
            }
            lastParentId = folderIdMap[currentPath];
            runningPath = currentPath;
          }

          const base64 = await fileToBase64(file);
          const isImage = file.type?.startsWith("image/") || false;
          const contentToSend = isImage ? base64.split(",")[1] : base64;
          const resourceType = isImage ? "IMAGE" : "FILE";
          await createResource(
            fileName,
            resourceType,
            contentToSend,
            lastParentId
          );
        }
      } else {
        const cleanBase64 =
          uploadData.base64.split(",")[1] || uploadData.base64;
        const resourceType = uploadData.type?.startsWith("image/")
          ? "IMAGE"
          : "FILE";

        await createResource(
          uploadData.name,
          resourceType,
          cleanBase64,
          currentFolderId
        );
      }
      Alert.alert('הצלחה', SIDEBAR_MENU.UPLOAD_SUCCESSFUL);
      setIsOpen(false);
      onUpload && onUpload();
    } catch (err) {
      console.error("Upload failed:", err);
      Alert.alert('שגיאה', SIDEBAR_MENU.UPLOAD_ERROR + " " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTextFile = async () => {
    setLoading(true);
    setIsOpen(false);
    try {
      await createResource(
        SIDEBAR_MENU.NEW_FILE_NAME,
        "FILE",
        "",
        currentFolderId
      );
      Alert.alert('הצלחה', 'קובץ חדש נוצר בהצלחה');
      onUpload && onUpload();
    } catch (error) {
      Alert.alert('שגיאה', SIDEBAR_MENU.CREATE_FILE_ERROR);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolderClick = () => {
    setIsOpen(false);
    setShowCreateFolderModal(true);
  };

  const handleFolderCreated = (newFolder) => {
    onUpload && onUpload();
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <Text style={styles.newButtonIcon}>➕</Text>
        <Text style={styles.newButtonText}>{SIDEBAR_MENU.NEW_BTN}</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={styles.menuContainer}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCreateTextFile}
              disabled={loading}
            >
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={styles.menuItemText}>
                {SIDEBAR_MENU.NEW_TXT_FILE}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCreateFolderClick}
              disabled={loading}
            >
              <Text style={styles.menuItemIcon}>📁</Text>
              <Text style={styles.menuItemText}>
                {SIDEBAR_MENU.CREATE_FOLDER}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <FileUploader
              onFileSelected={handleUpload}
              customLabel="הוסף קבצים"
            >
              <View style={styles.menuItem}>
                <Text style={styles.menuItemIcon}>📤</Text>
                <Text style={styles.menuItemText}>העלאת קבצים</Text>
              </View>
            </FileUploader>

            <FileUploader
              isDirectory={true}
              onFileSelected={handleUpload}
              customLabel="הוסף תיקייה"
            >
              <View style={styles.menuItem}>
                <Text style={styles.menuItemIcon}>📂</Text>
                <Text style={styles.menuItemText}>העלאת תיקייה</Text>
              </View>
            </FileUploader>
          </View>
        </TouchableOpacity>
      </Modal>

      <CreateFolderModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSuccess={handleFolderCreated}
        parentId={currentFolderId}
      />
    </View>
  );
};

export default NewMenu;

const styles = StyleSheet.create({
  newButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  newButtonIcon: {
    fontSize: 18,
    color: '#fff',
  },
  newButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemText: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 4,
  },
});
