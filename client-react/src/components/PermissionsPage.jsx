import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { PERMISSIONS } from '../consts/Permissions';
import { getRoleDisplay, getRoleColor } from '../enums/PermissionEnum';
import './styles/PermissionsPage.css';
import ProfilePic from './ProfilePic';

const PermissionsPage = ({ resourceId, resourceName, editable = false }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [usersData, setUsersData] = useState({}); 
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('READER');
  const [actionLoading, setActionLoading] = useState(false);

  // Memoize permission items to avoid recalculating on every render
  const permissionItems = useMemo(() => {
    return permissions.map((permission) => {
      const user = usersData[permission.userId];
      const userInitials = user?.username?.slice(0, 2).toUpperCase() || 
                          permission.userId.slice(0, 2).toUpperCase();
      const userDisplayName = user?.username || permission.userId;
      
      return {
        id: permission.id,
        userId: permission.userId,
        role: permission.role,
        user,
        userInitials,
        userDisplayName
      };
    });
  }, [permissions, usersData]);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/files/${resourceId}/permissions`);

      if (response.status === 403) {
        setIsOwner(false);
        setError(PERMISSIONS.FORBIDDEN_MESSAGE);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPermissions(data);
      setIsOwner(true);

      const userIds = [...new Set(data.map(p => p.userId))];
      
      // Fetch all users in parallel for better performance
      const userPromises = userIds.map(async (userId) => {
        try {
          const userResponse = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`);
          return userResponse.ok ? await userResponse.json() : null;
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
          return null;
        }
      });

      const usersResults = await Promise.all(userPromises);
      const usersMap = {};
      usersResults.forEach(user => {
        if (user) usersMap[user.id] = user;
      });
      
      setUsersData(usersMap);

    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError(PERMISSIONS.ERROR_MESSAGE);
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
      alert(PERMISSIONS.ADD_USER_ERROR_EMPTY);
      return;
    }

    if (newUsername === localStorage.getItem("username")) {
      alert(PERMISSIONS.YOU_ARE_OWNER);
      return;
    }

    setActionLoading(true);
    try {
      let targetUserId = null;
      try {
        const userResponse = await fetchWithAuth(`${API_BASE_URL}/users/username/${newUsername.trim()}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          targetUserId = userData.id;
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
      
      if (!targetUserId) {
        alert(PERMISSIONS.USER_NOT_FOUND_HINT);
        setActionLoading(false);
        return;
      }
      
      const response = await fetchWithAuth(`${API_BASE_URL}/files/${resourceId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId: targetUserId,
          role: newUserRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || PERMISSIONS.ADD_USER_ERROR);
      }

      setNewUsername('');
      setNewUserRole('READER');
      setShowAddUserModal(false);
      
      await fetchPermissions();

    } catch (err) {
      console.error('Failed to add user:', err);
      alert(err.message || PERMISSIONS.ADD_USER_ERROR);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (permissionId, currentRole) => {
    const nextRole = currentRole === 'READER' ? 'WRITER' : 'READER';

    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/files/${resourceId}/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: nextRole })
      });

      if (!response.ok) {
        throw new Error(PERMISSIONS.CHANGE_ROLE_ERROR);
      }

      await fetchPermissions();

    } catch (err) {
      console.error('Failed to change role:', err);
      alert(PERMISSIONS.CHANGE_ROLE_ERROR);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId, userId) => {
    const user = usersData[userId];
    const userName = user?.username || userId;
    
    if (!window.confirm(`${PERMISSIONS.DELETE_PERMISSION_CONFIRM} ${userName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/files/${resourceId}/permissions/${permissionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(PERMISSIONS.DELETE_PERMISSION_ERROR);
      }

      await fetchPermissions();

    } catch (err) {
      console.error('Failed to delete permission:', err);
      alert(PERMISSIONS.DELETE_PERMISSION_ERROR);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="permissions-container">
      <div className="permissions-header">
        <h3>{PERMISSIONS.HEADER_TITLE} {resourceName}</h3>
        {!loading && !error && isOwner && (
          <div className="permissions-header-actions">
            <span className="permissions-count">{permissions.length} {PERMISSIONS.PERMISSIONS_COUNT}</span>
            <button 
              className="add-user-button"
              onClick={() => setShowAddUserModal(true)}
              disabled={actionLoading}
            >
              + {PERMISSIONS.ADD_USER_BUTTON}
            </button>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="permissions-loading">{PERMISSIONS.LOADING_MESSAGE}</div>
      )}

      {error && (
        <div className="permissions-error">{error}</div>
      )}

      {!loading && !error && !isOwner && (
        <div className="permissions-info">{PERMISSIONS.NO_PERMISSION_MESSAGE}</div>
      )}

      {!loading && !error && isOwner && permissionItems.length === 0 && (
        <div className="permissions-empty">{PERMISSIONS.EMPTY_MESSAGE}</div>
      )}

      {!loading && !error && isOwner && permissionItems.length > 0 && (
        <div className="permissions-list">
          {permissionItems.map((item) => (
              <div key={item.id} className="permission-item">
                <div className="permission-user">
                    <ProfilePic 
                      profilePic={item.user.profilePic} 
                      displayName={item.userDisplayName} 
                      initials={item.userInitials} 
                    />
                  <div className="user-info">
                    <div className="user-id">{item.userDisplayName}</div>
                  </div>
                </div>
                <div className="permission-actions">
                  {item.role === 'OWNER' ? (
                    <div
                      className="permission-role-badge"
                      style={{ backgroundColor: getRoleColor(item.role) }}
                    >
                      {getRoleDisplay(item.role)}
                    </div>
                  ) : (
                    <>
                      <button
                        className="permission-role-button"
                        style={{ backgroundColor: getRoleColor(item.role) }}
                        onClick={() => handleChangeRole(item.id, item.role)}
                        disabled={actionLoading}
                        title={PERMISSIONS.CHANGE_ROLE_TOOLTIP}
                      >
                        {getRoleDisplay(item.role)}
                      </button>
                      <button
                        className="permission-delete-button"
                        onClick={() => handleDeletePermission(item.id, item.userId)}
                        disabled={actionLoading}
                        title={PERMISSIONS.DELETE_PERMISSION_TOOLTIP}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="add-user-modal">
          <div className="add-user-modal-content">
            <h4>{PERMISSIONS.ADD_USER_MODAL_TITLE}</h4>
            <input
              type="text"
              className="add-user-input"
              placeholder={PERMISSIONS.ADD_USER_PLACEHOLDER}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={actionLoading}
            />
            <select
              className="add-user-role-select"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              disabled={actionLoading}
            >
              <option value="READER">{PERMISSIONS.ROLE_READER}</option>
              <option value="WRITER">{PERMISSIONS.ROLE_WRITER}</option>
            </select>
            <div className="add-user-modal-buttons">
              <button
                className="add-user-cancel-button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUsername('');
                  setNewUserRole('READER');
                }}
                disabled={actionLoading}
              >
                {PERMISSIONS.CANCEL_BUTTON}
              </button>
              <button
                className="add-user-confirm-button"
                onClick={handleAddUser}
                disabled={actionLoading}
              >
                {actionLoading ? PERMISSIONS.LOADING_BUTTON : PERMISSIONS.ADD_BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
