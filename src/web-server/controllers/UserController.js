const User = require("../models/UserModel");

/**
 * Register a new user
 * @param {*} req 
 * @param {*} res 
 * @returns the new user data or error message
 */
const registerUser = (req, res) => {
  const { username, password, fullName, profilePic } = req.body;

  // Basic validation
  if (!username || !password || !fullName || !profilePic) {
    return res.status(400).json({
      error: "Username, password, fullName and profilePic are required",
    });
  }

  // Check if user already exists
  if (User.exists(username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Create new user through UserModel
  const newUser = User.create({
    username,
    password,
    fullName,
    profilePic,
  });

  // return the user data that was created without the password
  const { password: _, ...userResponse } = newUser;
  res.status(201).json(userResponse);
};

const getUserById = (req, res) => {
  const { id } = req.params;

  // Basic validation
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Find user by ID
  const user = User.findById(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // return the user data without the password
  const { password: _, ...userResponse } = user;
  res.status(200).json(userResponse);
};

const generateToken = (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // TODO: Authenticate user
  const user = User.findById(username);
  if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

  res.json({ id: user.username });
};

module.exports = { registerUser, getUserById, generateToken };