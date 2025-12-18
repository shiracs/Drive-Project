// In-memory user storage
const users = [];

/**
 * User model to manage user data.
 */
const User = {
  // Check if a user with the given username exists
  exists: (username) => {
    return users.some((u) => u.username === username);
  },

  // create and store a new user
  create: (userData) => {
    users.push(userData);
    // TODO: get rid of this log before submission
    console.log("Current Users in Store:", users);
    return userData;
  },

  // Find a user by ID (username in this case)
  findById: (id) => {
    return users.find((u) => u.username === id);
  },

};

module.exports = User;
