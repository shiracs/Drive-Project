export const ROLES = {
  OWNER: "OWNER",
  WRITER: "WRITER",
  READER: "READER",
};

export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
}
