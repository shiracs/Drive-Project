import { PERMISSIONS } from '../consts/Permissions';

export const getRoleDisplay = (role) => {
  const roleMap = {
    'OWNER': PERMISSIONS.ROLE_OWNER,
    'WRITER': PERMISSIONS.ROLE_WRITER,
    'READER': PERMISSIONS.ROLE_READER
  };
  return roleMap[role] || role;
};

export const getRoleColor = (role) => {
  const colorMap = {
    'OWNER': '#ff9800',
    'WRITER': '#2196f3',
    'READER': '#4caf50'
  };
  return colorMap[role] || '#757575';
};
