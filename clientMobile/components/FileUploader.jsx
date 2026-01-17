import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy'; 

const FileUploader = ({ onFileSelected, children }) => {

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: "*/*",
      });

      if (result.canceled || !result.assets) return;

      const processedFiles = await Promise.all(result.assets.map(async (asset) => {
        const isImage = asset.mimeType?.startsWith("image/");
        
        try {
          let base64Result = "";

          if (isImage) {
            base64Result = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: 'base64',
            });
          } else {
            const rawText = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: 'utf8',
            });

            const bytes = new TextEncoder().encode(rawText);
            const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
            base64Result = btoa(binString);
          }

          return {
            name: asset.name,
            type: isImage ? "IMAGE" : "FILE",
            base64: base64Result,
          };
        } catch (readError) {
          console.error("Read file error:", readError);
          return null;
        }
      }));

      onFileSelected(processedFiles.filter(f => f !== null));
      
    } catch (error) {
      console.error("Picker error:", error);
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