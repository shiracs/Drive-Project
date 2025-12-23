export const FILE_TYPE = {
  FILE: "FILE",
  FOLDER: "FOLDER",
};

export const isValidFileType = (type) => {
  return Object.values(FILE_TYPE).includes(type);
}
