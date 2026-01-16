import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy'; 

const FileUploader = ({ onFileSelected, children }) => {

  const readFile = async (fileUri) => {
    try {
      return await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });
    } catch (e) {
      console.error("Read file error:", e);
      return "";
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: "*/*",
      });

      if (result.canceled || !result.assets) return;

      const processedFiles = await Promise.all(result.assets.map(async (asset) => {
        const base64Content = await readFile(asset.uri);
        return {
          name: asset.name,
          type: asset.mimeType?.startsWith("image/") ? "IMAGE" : "FILE",
          base64: base64Content,
        };
      }));

      // תמיד שולח מערך כדי שהלולאה ב-NewMenu תעבוד על כולם
      onFileSelected(processedFiles);
      
    } catch (error) {
      Alert.alert("שגיאה", "נכשל בבחירת קבצים");
    }
  };

  return (
    <TouchableOpacity onPress={handlePickFile} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
};

export default FileUploader;