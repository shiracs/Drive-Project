import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { API_BASE_URL } from "../consts/Urls";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PermissionsPage = ({ resourceId, resourceName }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserRole, setNewUserRole] = useState("READER");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const fetchPermissions = async () => {
    if (!resourceId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/files/${resourceId}/permissions`
      );

      if (response.status === 403) {
        setIsOwner(false);
        setError("אין לך הרשאה לנהל הרשאות לפריט זה");
        return;
      }

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setPermissions(data);
      setIsOwner(true);

      const userIds = [
        ...new Set(data.map((p) => p.userId).filter((id) => id)),
      ];
      const usersMap = {};

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userResponse = await fetchWithAuth(
              `${API_BASE_URL}/users/${userId}`
            );
            if (userResponse.ok) {
              const userData = await userResponse.json();
              usersMap[userId] = userData;
            }
          } catch (e) {
            console.error("Error fetching user data:", e);
          }
        })
      );

      setUsersData(usersMap);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      setError("שגיאה בטעינת הרשאות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [resourceId]);

  const handleAddUser = async () => {
    if (!newUsername.trim()) {
      alert("לא הכנסת שם משתמש לתת לו הראשה");
      return;
    }

    if (newUsername === (await AsyncStorage.getItem("userId"))) {
      alert(PERMISSIONS.YOU_ARE_OWNER);
      return;
    }

    setActionLoading(true);
    try {
      let targetUserId = null;
      try {
        const userResponse = await fetchWithAuth(
          `${API_BASE_URL}/users/username/${newUsername.trim()}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          targetUserId = userData.id;
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }

      if (!targetUserId) {
        alert("משתמש לא נמצא");
        setActionLoading(false);
        return;
      }

      const response = await fetchWithAuth(
        `${API_BASE_URL}/files/${resourceId}/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId: targetUserId,
            role: newUserRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאהה");
      }

      setNewUsername("");
      setNewUserRole("READER");
      setShowAddUserModal(false);

      await fetchPermissions();
    } catch (err) {
      console.error("Failed to add user:", err);
      alert(err.message || "שגיאהה");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "OWNER":
        return "בעלים";
      case "WRITER":
        return "עריכה";
      case "READER":
        return "קריאה";
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    if (role === "OWNER") return "#d32f2f";
    if (role === "WRITER") return "#1a73e8";
    return "#5f6368";
  };

  if (loading && permissions.length === 0) {
    return (
      <ActivityIndicator
        size="large"
        color="#1a73e8"
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {isOwner && (
          <TouchableOpacity
            style={styles.addUserButton}
            onPress={() => setShowAddUserModal(true)}
          >
            <Text style={styles.addUserButtonText}>+ הוסף משתמש</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>למי יש גישה:</Text>

        {permissions.map((permission) => {
          const user = usersData[permission.userId];

          // תיקון קריטי: הגנה מפני Undefined לפני הרצת slice
          const userDisplayName =
            user?.username ||
            permission.username ||
            permission.userName ||
            String(permission.userId || "משתמש");
          const userInitials = userDisplayName
            ? userDisplayName.slice(0, 2).toUpperCase()
            : "??";

          return (
            <View key={permission.id} style={styles.permissionItem}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{userDisplayName}</Text>
                  <Text style={styles.userId}>
                    {permission.role === "OWNER"
                      ? "בעלים"
                      :  ""}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.roleText,
                  { color: getRoleColor(permission.role) },
                ]}
              >
                {getRoleLabel(permission.role)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* מודל הוספת משתמש */}
      <Modal visible={showAddUserModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>הוספת משתמש</Text>
            <TextInput
              style={styles.input}
              placeholder="שם משתמש"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <Text style={styles.roleLabel}>תפקיד:</Text>
            <View style={styles.roleButtons}>
              {["READER", "WRITER"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOptionButton,
                    newUserRole === role && styles.roleOptionButtonActive,
                  ]}
                  onPress={() => setNewUserRole(role)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      newUserRole === role && styles.roleOptionTextActive,
                    ]}
                  >
                    {getRoleLabel(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddUserModal(false)}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddUser}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>הוסף</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 16 },
  addUserButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  addUserButtonText: { color: "#fff", fontWeight: "bold" },
  sectionTitle: {
    fontSize: 14,
    color: "#5f6368",
    marginBottom: 12,
    textAlign: "right",
  },
  permissionItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: { flexDirection: "row-reverse", alignItems: "center", flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  userDetails: { flex: 1 },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    color: "#202124",
  },
  userId: { fontSize: 11, color: "#70757a", textAlign: "right" },
  roleText: { fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlign: "right",
    color: "#202124",
  },
  roleLabel: {
    textAlign: "right",
    marginBottom: 8,
    color: "#5f6368",
    fontWeight: "600",
  },
  roleButtons: { flexDirection: "row-reverse", gap: 8, marginBottom: 24 },
  roleOptionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  roleOptionButtonActive: {
    backgroundColor: "#e8f0fe",
    borderColor: "#1a73e8",
  },
  roleOptionText: { color: "#3c4043" },
  roleOptionTextActive: { color: "#1a73e8", fontWeight: "bold" },
  modalButtons: { flexDirection: "row-reverse", gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: "#f1f3f4" },
  confirmButton: { backgroundColor: "#1a73e8" },
  modalButtonText: { fontWeight: "bold", color: "#3c4043" },
});

export default PermissionsPage;
