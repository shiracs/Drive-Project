export const REASOURCE_TYPE = {
  FILE: "FILE",
  FOLDER: "FOLDER",
};

export const isValidResourceType = (type) => {
  return Object.values(REASOURCE_TYPE).includes(type);
}
