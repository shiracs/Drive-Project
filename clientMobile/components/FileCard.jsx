import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { API_BASE_URL, RESOURCE_API_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import { DELETE } from "../consts/Delete";

const FileCard = ({
  file,
  onNavigate,
  onDeleteSuccess,
  onRefresh,
}) => {
  const { id, name, type, isStarred, isDeleted: isSoftDeleted } = file;

  const isFolder = type === "FOLDER";
  const isImage = type === "IMAGE";

  const [fileContent, setFileContent] = useState("");
  const [userRole, setUserRole] = useState(null);

  // Fetch user role for this file/folder
  useEffect(() => {
    if (isSoftDeleted || !id) return;

    const fetchUserRole = async () => {
      try {
        const auth = await getTokenHeader();
        const response = await fetch(
          `${API_BASE_URL}/files/${id}/my-role`,
          { 
            method: "GET",
            headers: {
              ...auth,
              "Content-Type": "application/json",
            }
          }
        );

        if (response.ok) {
          const role = await response.json();
          setUserRole(role.role);
        } else {
          setUserRole("READER");
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
        setUserRole("READER");
      }
    };

    fetchUserRole();
  }, [id, isSoftDeleted]);

  // Load preview content for files
  useEffect(() => {
    if (isSoftDeleted || isFolder || !id) return;

    let isMounted = true;

    const fetchPreview = async () => {
      try {
        const auth = await getTokenHeader();
        const response = await fetch(`${API_BASE_URL}/files/${id}`, {
          method: "GET",
          headers: {
            ...auth,
            "Content-Type": "application/json",
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (isMounted) {
          setFileContent(data.content ? data.content : "");
        }
      } catch (err) {
        console.error("Failed to load preview", err);
        if (isMounted) {
          setFileContent("");
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [id, isFolder, isSoftDeleted]);

  const handlePress = () => {
    if (isFolder && onNavigate) {
      onNavigate(id);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "מחיקה",
      `${DELETE.CONFIRM_MESSAGE} ${name}?`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            const deleteUrl = isSoftDeleted
              ? `${RESOURCE_API_URL}/permanent-delete/${id}`
              : `${RESOURCE_API_URL}/${id}`;

            try {
              const auth = await getTokenHeader();
              const response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                  ...auth,
                  "Content-Type": "application/json",
                }
              });
              if (response.ok) {
                onDeleteSuccess && onDeleteSuccess(id);
                onRefresh && onRefresh();
              }
            } catch (err) {
              console.error("Delete failed", err);
              Alert.alert("שגיאה", "מחיקה נכשלה");
            }
          },
        },
      ]
    );
  };

  const handleStarToggle = async () => {
    try {
      const auth = await getTokenHeader();
      const response = await fetch(`${RESOURCE_API_URL}/star/${id}`, {
        method: "PATCH",
        headers: {
          ...auth,
          "Content-Type": "application/json",
        }
      });
      if (response.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Star toggle failed", err);
    }
  };

  const getPreviewSrc = () => {
    if (!fileContent || fileContent === "") {
      return null;
    }
    if (fileContent.startsWith("data:")) return fileContent;
    return `data:image/png;base64,${fileContent}`;
  };

  const previewSrc = isImage ? getPreviewSrc() : null;
  const canEdit = userRole === "OWNER" || userRole === "WRITER";
  const isOwner = userRole === "OWNER";

  if (isFolder) {
    return (
      <TouchableOpacity 
        style={styles.folderCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.folderContent}>
          <Text style={styles.folderEmoji}>📁</Text>
          <Text style={styles.folderName} numberOfLines={2}>{name}</Text>
        </View>
        <View style={styles.folderActions}>
          <TouchableOpacity onPress={handleStarToggle} style={styles.starButton}>
            <Text>{isStarred ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.fileCard}>
      <View style={styles.filePreviewContainer}>
        {isImage && previewSrc ? (
          <Image
            source={{ uri: previewSrc }}
            style={styles.filePreview}
          />
        ) : (
          <View style={styles.fileIconContainer}>
            <Text style={styles.fileIcon}>{isImage ? "🖼️" : "📄"}</Text>
          </View>
        )}
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>{name}</Text>
        <View style={styles.fileActions}>
          <TouchableOpacity onPress={handleStarToggle} style={styles.starButton}>
            <Text>{isStarred ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  folderCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  folderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  folderEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
  },
  folderActions: {
    flexDirection: "row",
    gap: 8,
  },
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filePreviewContainer: {
    height: 150,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  filePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fileIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fileIcon: {
    fontSize: 48,
  },
  fileInfo: {
    padding: 12,
    backgroundColor: "#fff",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 8,
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
});

export default FileCard;
