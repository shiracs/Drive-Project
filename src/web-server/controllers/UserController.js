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

module.exports = { registerUser };
