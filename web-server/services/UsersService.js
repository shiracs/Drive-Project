import User from "../models/User.js";

/**
 * Create and store a new user
 * @param {*} userData
 * @return the created user data
 */
const create = (userData) => {
    const user = new User(userData);
    user.save();
    return user;
};

/**
 * Find a user by ID
 * @param {*} id
 * @returns the user data or null if not found
 */
const findById = (id) => {
  return User.findById(id);
};

/**
 * Find a user by username
 * @param {*} username
 * @returns the user data or null if not found
 */
const findByUsername = (username) => {
  return User.findOne({ username });
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
