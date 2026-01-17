import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  DeviceEventEmitter,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RESOURCE_API_URL, API_BASE_URL } from "../consts/Urls";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import PermissionsPage from "./PermissionsPage";
import MoveToModal from "./MoveToModal";

const FileCard = ({ file, onNavigate, onOpenImage, onRefresh }) => {
  const { id, name, type, isStarred, isDeleted: isSoftDeleted, isSpam } = file;
  const router = useRouter();

  const isFolder = type === "FOLDER";
  const isImage = type === "IMAGE";

  const [fileContent, setFileContent] = useState("Loading...");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(name);
  const [showMoveTo, setShowMoveTo] = useState(false);
  const [isStarredLocal, setIsStarredLocal] = useState(isStarred);

  const handleActionSuccess = () => {
    setShowMenu(false);
    DeviceEventEmitter.emit("refreshFiles");
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    if (isDeleted || !id) return;
    const fetchUserRole = async () => {
      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/files/${id}/my-role`
        );
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (err) {
        setUserRole("READER");
      }
    };
    fetchUserRole();
  }, [id, isDeleted]);

  useEffect(() => {
    if (isDeleted || isFolder || !id) return;
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setFileContent(data.content || "");
        }
      } catch (err) {
        if (isMounted) setFileContent("Error");
      }
    };
    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [id, isFolder, isDeleted]);

  const handleCardPress = () => {
    if (isFolder && onNavigate) {
      onNavigate(id);
    } else if (isImage && onOpenImage) {
      onOpenImage(id);
    } else {
      router.push(`/(tabs)/files/${id}`);
    }
  };

  const handleStarToggle = async () => {
    try {
      const response = await fetchWithAuth(`${RESOURCE_API_URL}/star/${id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        setIsStarredLocal(!isStarredLocal);
        handleActionSuccess();
      }
    } catch (err) {
      console.error("Star toggle failed", err);
    }
  };

  const handleRestore = async () => {
    setShowMenu(false);
    try {
      const response = await fetchWithAuth(
        `${RESOURCE_API_URL}/restore/${id}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        Alert.alert("הצלחה", "הקובץ שוחזר בהצלחה");
        handleActionSuccess();
      }
    } catch (err) {
      Alert.alert("שגיאה", "שחזור נכשל");
    }
  };

  const handleSpamToggle = async () => {
    setShowMenu(false);
    try {
      const response = await fetchWithAuth(`${RESOURCE_API_URL}/spam/${id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        const message = isSpam ? "הקובץ הוסר מרשימת הספאם" : "הקובץ דווח כספאם";
        Alert.alert("הצלחה", message);
        handleActionSuccess();
      }
    } catch (err) {
      Alert.alert("שגיאה", "שינוי מצב ספאם נכשל");
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    const deleteUrl = isSoftDeleted
      ? `${RESOURCE_API_URL}/permanent-delete/${id}`
      : `${RESOURCE_API_URL}/${id}`;

    Alert.alert("מחיקה", `האם למחוק את ${name}?`, [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetchWithAuth(deleteUrl, {
              method: "DELETE",
            });
            if (response.ok) {
              setIsDeleted(true);
              handleActionSuccess();
            }
          } catch (err) {
            Alert.alert("שגיאה", "מחיקה נכשלה");
          }
        },
      },
    ]);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === name) {
      setShowRename(false);
      return;
    }
    try {
      const response = await fetchWithAuth(`${RESOURCE_API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        setShowRename(false);
        handleActionSuccess();
      }
    } catch (err) {
      Alert.alert("שגיאה", "שינוי שם נכשל");
    }
  };

  const handleMenuOpen = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get("window").width;
        const screenHeight = Dimensions.get("window").height;
        const menuWidth = 200;
        const menuHeight = isSoftDeleted ? 120 : isOwner ? 280 : 320;

        let leftPosition = x - menuWidth + width;
        if (leftPosition < 10) {
          leftPosition = 10;
        }

        let topPosition = y + height;
        if (topPosition + menuHeight > screenHeight - 10) {
          topPosition = y - menuHeight;
        }

        setMenuPosition({
          top: topPosition,
          left: leftPosition,
        });
        setShowMenu(true);
      });
    }
  };

  const decodePreviewText = (str) => {
  if (!str || str === 'Loading...') return str;
  try {
    const cleanStr = str.replace(/[\s\n\r]/g, "");
    const binString = atob(cleanStr);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    return str;
  }
};

  const canEdit = userRole === "OWNER" || userRole === "WRITER";
  const isOwner = userRole === "OWNER";

  if (isDeleted) return null;

  return (
    <View style={isFolder ? styles.folderCardWrapper : styles.fileCard}>
      <TouchableOpacity
        style={isFolder ? styles.folderCard : styles.cardContent}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {!isFolder && (
          <TouchableOpacity
            style={styles.floatingStar}
            onPress={handleStarToggle}
          >
            <MaterialCommunityIcons
              name={isStarredLocal ? "star" : "star-outline"}
              size={18}
              color={isStarredLocal ? "#FBBC04" : "#bdc1c6"}
            />
          </TouchableOpacity>
        )}

        {!isFolder && (
          <View style={styles.previewContainer}>
            {isImage && fileContent && fileContent !== "Loading..." ? (
              <Image
                source={{
                  uri: fileContent.startsWith("data:")
                    ? fileContent
                    : `data:image/png;base64,${fileContent}`,
                }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.textPreviewWrapper}>
                <Text style={styles.textPreviewContent} numberOfLines={8}>
                  {fileContent === "Loading..." ? "טוען..." : decodePreviewText(fileContent)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.floatingStar}
              onPress={handleStarToggle}
            >
              <MaterialCommunityIcons
                name={isStarredLocal ? "star" : "star-outline"}
                size={18}
                color={isStarredLocal ? "#FBBC04" : "#bdc1c6"}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={isFolder ? styles.folderContent : styles.fileInfoArea}>
          <View style={styles.fileHeader}>
            <View style={styles.fileNameContainer}>
              <MaterialCommunityIcons
                name={isFolder ? "folder" : isImage ? "image" : "file-document"}
                size={22}
                color={isFolder ? "#5f6368" : "#1a73e8"}
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {name}
              </Text>
            </View>

            <View style={styles.fileActions}>
              {isFolder && (
                <TouchableOpacity
                  onPress={handleStarToggle}
                  style={styles.inlineStar}
                >
                  <MaterialCommunityIcons
                    name={isStarredLocal ? "star" : "star-outline"}
                    size={18}
                    color={isStarredLocal ? "#FBBC04" : "#bdc1c6"}
                  />
                </TouchableOpacity>
              )}

              <View>
                <TouchableOpacity
                  ref={menuButtonRef}
                  onPress={handleMenuOpen}
                  style={styles.menuButton}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color="#5f6368"
                  />
                </TouchableOpacity>

                <Modal
                  visible={showMenu}
                  transparent={true}
                  animationType="none"
                  onRequestClose={() => setShowMenu(false)}
                >
                  <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                  >
                    <View
                      style={[
                        styles.floatingMenu,
                        {
                          position: "absolute",
                          top: menuPosition.top,
                          left: menuPosition.left,
                        },
                      ]}
                      onStartShouldSetResponder={() => true}
                    >
                      {isSoftDeleted ? (
                        <>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleRestore}
                          >
                            <MaterialCommunityIcons
                              name="restore"
                              size={20}
                              color="#5f6368"
                            />
                            <Text style={styles.menuItemText}>שחזור</Text>
                          </TouchableOpacity>

                          <View style={styles.menuDivider} />

                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleDelete}
                            disabled={!isOwner}
                          >
                            <MaterialCommunityIcons
                              name="delete-forever"
                              size={20}
                              color={isOwner ? "#d32f2f" : "#ffc9c9"}
                            />
                            <Text
                              style={[
                                styles.menuItemText,
                                styles.menuItemDelete,
                                !isOwner && styles.disabledTextDelete,
                              ]}
                            >
                              מחיקה סופית
                            </Text>
                            {!isOwner && (
                              <MaterialCommunityIcons
                                name="lock-outline"
                                size={16}
                                color="#ffc9c9"
                              />
                            )}
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          {!isOwner && (
                            <>
                              <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleSpamToggle}
                              >
                                <MaterialCommunityIcons
                                  name={
                                    isSpam
                                      ? "check-circle-outline"
                                      : "alert-circle-outline"
                                  }
                                  size={20}
                                  color="#5f6368"
                                />
                                <Text style={styles.menuItemText}>
                                  {isSpam ? "לא ספאם" : "דווח כספאם"}
                                </Text>
                              </TouchableOpacity>
                              <View style={styles.menuDivider} />
                            </>
                          )}

                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              if (isOwner) {
                                setShowMenu(false);
                                setShowPermissions(true);
                              }
                            }}
                            activeOpacity={isOwner ? 0.7 : 1}
                            disabled={!isOwner}
                          >
                            <MaterialCommunityIcons
                              name="account-plus-outline"
                              size={20}
                              color={isOwner ? "#5f6368" : "#d0d0d0"}
                            />
                            <Text
                              style={[
                                styles.menuItemText,
                                !isOwner && styles.disabledText,
                              ]}
                            >
                              הרשאות
                            </Text>
                            {!isOwner && (
                              <MaterialCommunityIcons
                                name="lock-outline"
                                size={16}
                                color="#d0d0d0"
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              if (canEdit) {
                                setShowMenu(false);
                                setShowRename(true);
                              }
                            }}
                            activeOpacity={canEdit ? 0.7 : 1}
                            disabled={!canEdit}
                          >
                            <MaterialCommunityIcons
                              name="pencil-outline"
                              size={20}
                              color={canEdit ? "#5f6368" : "#d0d0d0"}
                            />
                            <Text
                              style={[
                                styles.menuItemText,
                                !canEdit && styles.disabledText,
                              ]}
                            >
                              שינוי שם
                            </Text>
                            {!canEdit && (
                              <MaterialCommunityIcons
                                name="lock-outline"
                                size={16}
                                color="#d0d0d0"
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              if (isOwner) {
                                setShowMenu(false);
                                setShowMoveTo(true);
                              }
                            }}
                            activeOpacity={isOwner ? 0.7 : 1}
                            disabled={!isOwner}
                          >
                            <MaterialCommunityIcons
                              name="folder-move-outline"
                              size={20}
                              color={isOwner ? "#5f6368" : "#d0d0d0"}
                            />
                            <Text
                              style={[
                                styles.menuItemText,
                                !isOwner && styles.disabledText,
                              ]}
                            >
                              העברה
                            </Text>
                            {!isOwner && (
                              <MaterialCommunityIcons
                                name="lock-outline"
                                size={16}
                                color="#d0d0d0"
                              />
                            )}
                          </TouchableOpacity>

                          <View style={styles.menuDivider} />

                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              if (isOwner) {
                                handleDelete();
                              }
                            }}
                            activeOpacity={isOwner ? 0.7 : 1}
                            disabled={!isOwner}
                          >
                            <MaterialCommunityIcons
                              name="delete-outline"
                              size={20}
                              color={isOwner ? "#d32f2f" : "#ffc9c9"}
                            />
                            <Text
                              style={[
                                styles.menuItemText,
                                styles.menuItemDelete,
                                !isOwner && styles.disabledTextDelete,
                              ]}
                            >
                              מחיקה
                            </Text>
                            {!isOwner && (
                              <MaterialCommunityIcons
                                name="lock-outline"
                                size={16}
                                color="#ffc9c9"
                              />
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={showRename} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שינוי שם</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRename}
              >
                <Text style={styles.modalButtonText}>שמור</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRename(false)}
              >
                <Text style={styles.modalButtonTextBlue}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPermissions} transparent animationType="slide">
        <View style={styles.permissionsModalContainer}>
          <View style={styles.permissionsHeader}>
            <TouchableOpacity
              onPress={() => setShowPermissions(false)}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#5f6368" />
            </TouchableOpacity>
            <Text style={styles.permissionsTitle}>הרשאות: {name}</Text>
          </View>
          <PermissionsPage resourceId={id} resourceName={name} />
        </View>
      </Modal>

      {showMoveTo && (
        <MoveToModal
          fileId={id}
          currentName={name}
          onClose={() => setShowMoveTo(false)}
          onRefresh={handleActionSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  folderCardWrapper: { marginHorizontal: 12, marginBottom: 12 },
  folderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8eaed",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
  },
  folderContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
  },
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e8eaed",
    elevation: 1,
    overflow: "visible",
    position: "relative",
  },
  floatingStar: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    padding: 2,
  },
  inlineStar: { paddingHorizontal: 8 },
  cardContent: { width: "100%" },
  previewContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  fileInfoArea: { padding: 12 },
  fileHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileNameContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  fileName: { fontSize: 14, color: "#202124", flex: 1, textAlign: "right" },
  fileActions: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  menuButton: { padding: 4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  floatingMenu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 200,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: "#3c4043",
    textAlign: "right",
    flex: 1,
  },
  disabledText: {
    color: "#d0d0d0",
  },
  menuItemDelete: {
    color: "#d32f2f",
  },
  disabledTextDelete: {
    color: "#ffc9c9",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e8eaed",
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 28,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "right",
    color: "#202124",
  },
  modalInput: {
    backgroundColor: "#f1f3f4",
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
    textAlign: "right",
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-start", gap: 12 },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  confirmButton: { backgroundColor: "#1a73e8" },
  cancelButton: { backgroundColor: "transparent" },
  modalButtonText: { color: "#fff", fontWeight: "500" },
  modalButtonTextBlue: { color: "#1a73e8", fontWeight: "500" },
  permissionsModalContainer: { flex: 1, backgroundColor: "#fff" },
  permissionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  permissionsTitle: { fontSize: 18, fontWeight: "500", color: "#202124" },
  closeButton: { padding: 4 },
  textPreviewWrapper: {
    padding: 12,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  textPreviewContent: {
    fontSize: 11,
    color: '#5f6368',
    textAlign: 'right',
    lineHeight: 16,
  },
});

export default FileCard;
