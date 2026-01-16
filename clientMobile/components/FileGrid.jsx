import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GENERAL } from "../consts/General";
import FileCard from "./FileCard";

const FileGrid = ({
  resources,
  onNavigate,
  onBack,
  title,
  subTitle,
  showBackButton,
  loading,
  onDeleteSuccess,
  onRefresh,
  onOpenImage
}) => {
  const safeResources = useMemo(
    () => Array.isArray(resources) ? resources : [],
    [resources]
  );
  
  const folders = useMemo(
    () => safeResources.filter((r) => r.type === "FOLDER"),
    [safeResources]
  );
  const files = useMemo(
    () => safeResources.filter((r) => r.type === "FILE" || r.type === "IMAGE"),
    [safeResources]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {Boolean(subTitle) && <Text style={styles.subTitle}>{subTitle}</Text>}
      </View>
    </View>
  );

  const renderFolders = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{GENERAL.FOLDERS}</Text>
      {folders.map((folder) => (
        <FileCard
          key={folder.id}
          file={folder}
          onNavigate={onNavigate}
          onDeleteSuccess={onDeleteSuccess}
          onRefresh={onRefresh}
          onOpenImage={onOpenImage}
        />
      ))}
    </View>
  );

  const renderFiles = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{GENERAL.FILES}</Text>
      {files.map((file) => (
        <FileCard
          key={file.id + file.name}
          file={file}
          onDeleteSuccess={onDeleteSuccess}
          onRefresh={onRefresh}
          onOpenImage={onOpenImage}
        />
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading && safeResources.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>{GENERAL.LOADING}</Text>
        </View>
      );
    }

    if (safeResources.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noContentText}>{GENERAL.NO_CONTENT}</Text>
        </View>
      );
    }

    return (
      <View>
        {folders.length > 0 && renderFolders()}
        {files.length > 0 && renderFiles()}
      </View>
    );
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      onMomentumScrollEnd={() => {
        if (onRefresh) onRefresh();
      }}
    >
      {renderHeader()}
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1a73e8",
    fontWeight: "500",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: "#5f6368",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5f6368",
    marginBottom: 12,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#5f6368",
  },
  noContentText: {
    fontSize: 16,
    color: "#5f6368",
  },
});

export default FileGrid;
