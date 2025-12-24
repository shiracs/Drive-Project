export const RESOURCE_TYPE = {
  FILE: "FILE",
  FOLDER: "FOLDER",
};

export const isValidResourceType = (type) => {
  return Object.values(RESOURCE_TYPE).includes(type);
}
