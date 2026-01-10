import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import { PERMISSIONS } from '../consts/Permissions';
import "../App.css";

const PermissionsResource = ({ resourceId, resourceName, editable = false }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [usersData, setUsersData] = useState({}); 
  
  // TODO: Future functionality - Add state for editing mode
  // const [showAddUserModal, setShowAddUserModal] = useState(false);
  // const [editingPermissionId, setEditingPermissionId] = useState(null); 

  useEffect(() => {
    if (!resourceId) return;

    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const auth = getTokenHeader();
        
        const response = await fetch(`${API_BASE_URL}/files/${resourceId}/permissions`, {
          method: 'GET',
          headers: auth
        });

        if (response.status === 403) {
          // User is not the owner - can't view permissions
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

        // שליפת פרטי משתמשים
        const userIds = [...new Set(data.map(p => p.userId))]; // רשימת משתמשים ייחודיים
        const usersMap = {};
        
        for (const userId of userIds) {
          try {
            const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
              method: 'GET',
              headers: auth
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              usersMap[userId] = userData;
            }
          } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err);
          }
        }
        
        setUsersData(usersMap);

      } catch (err) {
        console.error('Failed to fetch permissions:', err);
        setError(PERMISSIONS.ERROR_MESSAGE);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [resourceId]);

  const getRoleDisplay = (role) => {
    const roleMap = {
      'OWNER': PERMISSIONS.ROLE_OWNER,
      'WRITER': PERMISSIONS.ROLE_WRITER,
      'READER': PERMISSIONS.ROLE_READER
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      'OWNER': '#ff9800',
      'WRITER': '#2196f3',
      'READER': '#4caf50'
    };
    return colorMap[role] || '#757575';
  };

  if (loading) {
    return (
      <div className="permissions-container">
        <div className="permissions-header">
          <h3>{PERMISSIONS.HEADER_TITLE} {resourceName}</h3>
        </div>
        <div className="permissions-loading">{PERMISSIONS.LOADING_MESSAGE}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="permissions-container">
        <div className="permissions-header">
          <h3>{PERMISSIONS.HEADER_TITLE} {resourceName}</h3>
        </div>
        <div className="permissions-error">{error}</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="permissions-container">
        <div className="permissions-header">
          <h3>{PERMISSIONS.HEADER_TITLE} {resourceName}</h3>
        </div>
        <div className="permissions-info">{PERMISSIONS.NO_PERMISSION_MESSAGE}</div>
      </div>
    );
  }

  return (
    <div className="permissions-container">
      <div className="permissions-header">
        <h3>{PERMISSIONS.HEADER_TITLE} {resourceName}</h3>
        <span className="permissions-count">{permissions.length} {PERMISSIONS.PERMISSIONS_COUNT}</span>
      </div>
      
      {permissions.length === 0 ? (
        <div className="permissions-empty">{PERMISSIONS.EMPTY_MESSAGE}</div>
      ) : (
        <div className="permissions-list">
          {permissions.map((permission) => {
            const user = usersData[permission.userId];
            const userInitials = user?.username?.substring(0, 2).toUpperCase() || permission.userId.substring(0, 2).toUpperCase();
            const userDisplayName = user?.username || permission.userId;
            
            return (
              <div key={permission.id} className="permission-item">
                <div className="permission-user">
                  <div className="user-avatar">
                    {user?.profilePic ? (
                      <img 
                        src={user.profilePic} 
                        alt={userDisplayName}
                        className="user-avatar-image"
                      />
                    ) : (
                      <span className="user-avatar-initials">{userInitials}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-id">{userDisplayName}</div>
                  </div>
                </div>
                <div 
                  className="permission-role"
                  style={{ backgroundColor: getRoleColor(permission.role) }}
                >
                  {getRoleDisplay(permission.role)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PermissionsResource;
