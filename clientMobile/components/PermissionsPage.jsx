import { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { getTokenHeader } from '../utils/auth';
import { API_BASE_URL } from '../consts/Urls';

const PermissionsPage = ({ resourceId, resourceName, onClose }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('READER');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${resourceId}/permissions`, {
        headers,
      });

      if (response.status === 403) {
        setIsOwner(false);
        setError('אין לך הרשאה לראות הרשאות');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPermissions(data);
      setIsOwner(true);

      const userIds = [...new Set(data.map((p) => p.userId))];

      const userPromises = userIds.map(async (userId) => {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers,
          });
          return userResponse.ok ? await userResponse.json() : null;
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
          return null;
        }
      });

      const usersResults = await Promise.all(userPromises);
      const usersMap = {};
      usersResults.forEach((user) => {
        if (user) usersMap[user.id] = user;
      });

      setUsersData(usersMap);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('שגיאה בטעינת הרשאות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resourceId) return;
    fetchPermissions();
  }, [resourceId]);

  const handleAddUser = async () => {
    if (!newUsername.trim()) {
      Alert.alert('שגיאה', 'הזן שם משתמש');
      return;
    }

    setActionLoading(true);

    try {
      const headers = await getTokenHeader();
      const response = await fetch(`${API_BASE_URL}/files/${resourceId}/permissions`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert('שגיאה', data.error || 'הוספת משתמש נכשלה');
        return;
      }

      setNewUsername('');
      setNewUserRole('READER');
      setShowAddUserModal(false);
      await fetchPermissions();
    } catch (err) {
      console.error('Failed to add user:', err);
      Alert.alert('שגיאה', 'שגיאה בהוספת משתמש');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (permissionId, newRole) => {
    try {
      const headers = await getTokenHeader();
      const response = await fetch(
        `${API_BASE_URL}/files/${resourceId}/permissions/${permissionId}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        await fetchPermissions();
        setShowRoleMenu(false);
      } else {
        Alert.alert('שגיאה', 'שינוי הרשאה נכשל');
      }
    } catch (err) {
      console.error('Failed to change role:', err);
      Alert.alert('שגיאה', 'שגיאה בשינוי הרשאה');
    }
  };

  const handleRemovePermission = (permissionId) => {
    Alert.alert('הסרת הרשאה', 'האם אתה בטוח?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסר',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getTokenHeader();
            const response = await fetch(
              `${API_BASE_URL}/files/${resourceId}/permissions/${permissionId}`,
              { method: 'DELETE', headers }
            );

            if (response.ok) {
              await fetchPermissions();
            } else {
              Alert.alert('שגיאה', 'הסרת הרשאה נכשלה');
            }
          } catch (err) {
            console.error('Failed to remove permission:', err);
            Alert.alert('שגיאה', 'שגיאה בהסרת הרשאה');
          }
        },
      },
    ]);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'OWNER':
        return '#d32f2f';
      case 'WRITER':
        return '#1a73e8';
      case 'READER':
        return '#5f6368';
      default:
        return '#999';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'OWNER':
        return 'בעלים';
      case 'WRITER':
        return 'עורך';
      case 'READER':
        return 'מצפה';
      default:
        return role;
    }
  };

  if (loading && permissions.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>טוען הרשאות...</Text>
      </View>
    );
  }

  if (error && !isOwner) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
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

        <Text style={styles.sectionTitle}>משתמשים עם גישה:</Text>

        {permissions.length === 0 ? (
          <Text style={styles.emptyText}>אין משתמשים</Text>
        ) : (
          permissions.map((permission) => {
            const user = usersData[permission.userId];
            const userInitials =
              user?.username?.slice(0, 2).toUpperCase() ||
              permission.userId.slice(0, 2).toUpperCase();
            const userDisplayName = user?.username || permission.userId;

            return (
              <View key={permission.id} style={styles.permissionItem}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userInitials}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{userDisplayName}</Text>
                    <Text style={styles.userId}>{permission.userId}</Text>
                  </View>
                </View>

                {isOwner && permission.role !== 'OWNER' ? (
                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => {
                      setSelectedPermissionId(permission.id);
                      setShowRoleMenu(!showRoleMenu);
                    }}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        { color: getRoleColor(permission.role) },
                      ]}
                    >
                      {getRoleLabel(permission.role)}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[
                      styles.roleText,
                      { color: getRoleColor(permission.role) },
                    ]}
                  >
                    {getRoleLabel(permission.role)}
                  </Text>
                )}

                {showRoleMenu && selectedPermissionId === permission.id && (
                  <View style={styles.roleMenu}>
                    {['READER', 'WRITER'].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={styles.roleMenuItem}
                        onPress={() =>
                          handleChangeRole(permission.id, role)
                        }
                      >
                        <Text style={styles.roleMenuItemText}>
                          {getRoleLabel(role)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.roleMenuItem, styles.deleteMenuItem]}
                      onPress={() =>
                        handleRemovePermission(permission.id)
                      }
                    >
                      <Text style={styles.deleteMenuItemText}>הסר הרשאה</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={showAddUserModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>הוסף משתמש</Text>

            <TextInput
              style={styles.input}
              placeholder="שם משתמש"
              placeholderTextColor="#999"
              value={newUsername}
              onChangeText={setNewUsername}
            />

            <Text style={styles.roleLabel}>בחר הרשאה:</Text>
            <View style={styles.roleButtons}>
              {['READER', 'WRITER'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOptionButton,
                    newUserRole === role &&
                      styles.roleOptionButtonActive,
                  ]}
                  onPress={() => setNewUserRole(role)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      newUserRole === role &&
                        styles.roleOptionTextActive,
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  addUserButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addUserButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 12,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: '#9aa0a6',
    textAlign: 'center',
    marginVertical: 24,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    textAlign: 'right',
  },
  userId: {
    fontSize: 12,
    color: '#9aa0a6',
    textAlign: 'right',
    marginTop: 2,
  },
  roleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#e8eaed',
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 6,
  },
  roleMenu: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e8eaed',
    overflow: 'hidden',
  },
  roleMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  deleteMenuItem: {
    backgroundColor: '#fff',
  },
  roleMenuItemText: {
    fontSize: 13,
    color: '#202124',
    textAlign: 'right',
  },
  deleteMenuItemText: {
    fontSize: 13,
    color: '#d32f2f',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 20,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 14,
    color: '#202124',
    textAlign: 'right',
    backgroundColor: '#f8f9fa',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 10,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 20,
  },
  roleOptionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleOptionButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#202124',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3f4',
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default PermissionsPage;
