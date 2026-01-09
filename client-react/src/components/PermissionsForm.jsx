import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from '../utils/auth';
import './PermissionsResource.css';

const PermissionsResource = ({ resourceId, resourceName }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

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
          setError('רק הבעלים יכול לצפות ברשימת ההרשאות');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPermissions(data);
        setIsOwner(true);

      } catch (err) {
        console.error('Failed to fetch permissions:', err);
        setError('שגיאה בטעינת הרשאות');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [resourceId]);

  const getRoleDisplay = (role) => {
    const roleMap = {
      'OWNER': 'בעלים',
      'WRITER': 'עורך',
      'READER': 'קורא'
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
          <h3> {resourceName} הרשאןת עבור</h3>
        </div>
        <div className="permissions-loading">טוען הרשאות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="permissions-container">
        <div className="permissions-header">
          <h3>{resourceName} הרשאות עבור </h3>
        </div>
        <div className="permissions-error">{error}</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="permissions-container">
        <div className="permissions-header">
          <h3>הרשאות עבור: {resourceName}</h3>
        </div>
        <div className="permissions-info">אין לך הרשאה לצפות ברשימת ההרשאות</div>
      </div>
    );
  }

  return (
    <div className="permissions-container">
      <div className="permissions-header">
        <h3>{resourceName} הרשאות עבור </h3>
        <span className="permissions-count">{permissions.length} הרשאות</span>
      </div>
      
      {permissions.length === 0 ? (
        <div className="permissions-empty">אין הרשאות להצגה</div>
      ) : (
        <div className="permissions-list">
          {permissions.map((permission) => (
            <div key={permission.id} className="permission-item">
              <div className="permission-user">
                <div className="user-avatar">
                  {permission.userId.substring(0, 2).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-id">{permission.userId}</div>
                  <div className="resource-id">{permission.resourceId} תיאור הקובץ</div>
                </div>
              </div>
              <div 
                className="permission-role"
                style={{ backgroundColor: getRoleColor(permission.role) }}
              >
                {getRoleDisplay(permission.role)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PermissionsResource;
