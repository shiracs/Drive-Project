import React, { useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { FILE } from "../consts/FilePage";

const FileUploader = ({
  onFileSelected,
  label = FILE.UPLOAD_FILE,
  isDirectory = false,
  children,
  customLabel = null
}) => {
  const handlePickFile = async () => {
    try {
      if (isDirectory) {
        Alert.alert(
          "Note",
          "Folder upload requires selecting files from a folder. Select multiple files from the same folder."
        );
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        multiple: !isDirectory,
        type: "*/*",
      });

      if (result.canceled) return;

      if (isDirectory) {
        const files = result.assets;
        if (files.length > 0) {
          const firstPath = files[0].name;
          const folderName = firstPath.split("/")[0] || "uploaded_folder";
          onFileSelected({
            name: folderName,
            files: files,
            isFolder: true,
          });
        }
      } else if (result.assets.length > 0) {
        const file = result.assets[0];
        const fileContent = await fetch(file.uri).then(res => res.blob());
        const reader = new FileReader();
        
        reader.onload = () => {
          onFileSelected({
            name: file.name,
            type: file.mimeType || "application/octet-stream",
            base64: reader.result,
            isFolder: false,
            uri: file.uri,
          });
        };
        
        reader.readAsDataURL(fileContent);
      }
    } catch (error) {
      console.error("File picker error:", error);
    }
  };

  if (children) {
    return (
      <TouchableOpacity onPress={handlePickFile}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePickFile}>
      <Text style={styles.buttonText}>{customLabel || label}</Text>
    </TouchableOpacity>
  );
};

export default FileUploader;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1a73e8",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
