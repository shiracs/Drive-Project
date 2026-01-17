import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  DeviceEventEmitter,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL, RESOURCE_API_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const { width, height } = Dimensions.get("window");

export default function ImageModal({ imageId, onClose }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!imageId) return;
    fetchImageFullContent();
    fetchUserRole();
  }, [imageId]);

  const fetchUserRole = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/files/${imageId}/my-role`
      );
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
    }
  };

  const fetchImageFullContent = async () => {
    setLoading(true);
    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${imageId}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content.startsWith("data:")
          ? data.content
          : `data:image/png;base64,${data.content}`;

        setImageUri(content);
      }
    } catch (err) {
      console.error("Failed to load full image:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      updateImageOnServer(
        asset.base64,
        asset.fileName || `image_${Date.now()}.png`
      );
    }
  };

  const updateImageOnServer = async (base64Content, newName) => {
    setSaving(true);
    try {
      const response = await fetchWithAuth(`${RESOURCE_API_URL}/${imageId}`, {
        method: "PATCH",
        body: JSON.stringify({
          content: base64Content,
          name: newName, 
        }),
      });

      if (response.ok) {
        setImageUri(`data:image/png;base64,${base64Content}`);
        DeviceEventEmitter.emit("refreshFiles");
        Alert.alert("הצלחה", "התמונה והשם עודכנו בהצלחה");
      }
    } catch (err) {
      Alert.alert("שגיאה", "העדכון נכשל");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = userRole === "OWNER" || userRole === "WRITER";

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
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              {canEdit && (
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={handleImagePick}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.changeImageText}>החלף תמונה</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
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
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  closeText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  contentContainer: {
    width: width,
    height: height * 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "90%", height: "70%" },
  errorText: { color: "#fff", fontSize: 16 },
  changeImageButton: {
    marginTop: 30,
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  changeImageText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
