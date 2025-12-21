import { v4 as uuid } from "uuid";
// !Volatile user storage for now
const users = [];

/**
 * Check if a user with the given username exists
 * @param {string} username
 * @return {boolean} true if user exists, false otherwise
 */
const exists = (username) => {
  return users.some((u) => u.username === username);
};

/**
 * Create and store a new user
 * @param {*} userData
 * @return the created user data
 */
const create = (userData) => {
  const newUser = {
    id: uuid(),
    ...userData,
  };
  users.push(newUser);
  console.log("Current Users in Store:", users);
  return newUser;
};

/**
 * Find a user by ID
 * @param {*} id
 * @returns the user data or null if not found
 */
const findById = (id) => {
  return users.find((u) => u.id === id);
};

/**
 * Find a user by username
 * @param {*} username
 * @returns the user data or null if not found
 */
const findByUsername = (username) => {
  return users.find((u) => u.username === username);
};

/**
 * Check if userId is valid
 * @param {*} userId 
 * @returns 
 */
const checkUnauthorized = (userId) => {
  return !userId || !findById(userId);
};

export default { exists, create, findById, findByUsername, checkUnauthorized };
