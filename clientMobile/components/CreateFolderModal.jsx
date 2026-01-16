import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { RESOURCE_API_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import { CREATE_FOLDER } from '../consts/CreateFolder';

const CreateFolderModal = ({ visible, onClose, onSuccess, parentId = null }) => {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateFolder = async () => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      Alert.alert('שגיאה', CREATE_FOLDER.EMPTY_NAME_ERROR);
      return;
    }

    setLoading(true);

    try {
      const auth = await getTokenHeader();
      const response = await fetch(RESOURCE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth,
        },
        body: JSON.stringify({
          name: trimmedName,
          type: 'FOLDER',
          content: '',
          parentId: parentId,
        }),
      });

      if (response.ok) {
        const newFolder = await response.json();
        Alert.alert('הצלחה', CREATE_FOLDER.SUCCESS_MESSAGE);
        setFolderName('');
        onSuccess && onSuccess(newFolder);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('שגיאה', errorData.error || CREATE_FOLDER.ERROR_MESSAGE);
      }
    } catch (err) {
      Alert.alert('שגיאה', CREATE_FOLDER.ERROR_MESSAGE);
      console.error('Error creating folder:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{CREATE_FOLDER.DIALOG_TITLE}</Text>

          <TextInput
            style={styles.input}
            placeholder={CREATE_FOLDER.DIALOG_PLACEHOLDER}
            placeholderTextColor="#999"
            value={folderName}
            onChangeText={setFolderName}
            editable={!loading}
            maxLength={255}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {CREATE_FOLDER.CANCEL_BUTTON}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreateFolder}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'יוצר...' : CREATE_FOLDER.CREATE_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateFolderModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 20,
    textAlign: 'right',
  },
  input: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 0,
    textAlign: 'right',
    color: '#202124',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#1a73e8',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
