import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';

const { width, height } = Dimensions.get('window');

export default function ImageModal({ imageId, onClose }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageId) return;

    const fetchImageFullContent = async () => {
      setLoading(true);
      try {
        const headers = await getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${imageId}`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content.startsWith('data:') 
            ? data.content 
            : `data:image/png;base64,${data.content}`;
          
          setImageUri(content);
        }
      } catch (err) {
        console.error('Failed to load full image:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImageFullContent();
  }, [imageId]);

  return (
    <Modal
      visible={!!imageId}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          ) : (
            <Text style={styles.errorText}>לא ניתן לטעון את התמונה</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    width: width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});