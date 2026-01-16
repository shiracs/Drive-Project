import { v4 as uuid } from "uuid";
// !Volatile user storage for now
const USERS = [
  {
    id: "1",
    username: "admin",
    password: "111",
    fullName: "admino ll",
    profilePic: "hh",
  },
  {
    id: "2",
    username: "b",
    password: "111",
    fullName: "bebe ll",
    profilePic: "bbb",
  },
];

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
  USERS.push(newUser);
  return newUser;
};

/**
 * Find a user by ID
 * @param {*} id
 * @returns the user data or null if not found
 */
const findById = (id) => {
  return USERS.find((u) => u.id === id);
};

/**
 * Find a user by username
 * @param {*} username
 * @returns the user data or null if not found
 */
const findByUsername = (username) => {
  return USERS.find((u) => u.username === username);
};

/**
 * Check if userId is valid
 * @param {*} userId
 * @returns
 */
const isValidId = (userId) => {
  return userId && findById(userId);
};

export default { create, findById, findByUsername, isValidId };
