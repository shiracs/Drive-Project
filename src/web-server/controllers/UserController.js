import UserModel from "../models/UserModel.js";
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
  if (UserModel.exists(username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Create new user through UserModel
  const newUser = UserModel.create({
    username,
    password,
    fullName,
    profilePic,
  });

  // return the user data that was created without the password
  const { password: _, ...userResponse } = newUser;
  res.status(201).json(userResponse);
};

/**
 * Get user by UUID
 * @param {*} req 
 * @param {*} res 
 * @returns the user data or error message
 */
const getUserById = (req, res) => {
  const { id } = req.params;

  // Find user by ID
  const user = UserModel.findById(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // return the user data without the password
  const { password: _, ...userResponse } = user;
  res.status(200).json(userResponse);
};

/**
 * Generate a token for a user
 * @param {*} req 
 * @param {*} res 
 * @returns the token or error message
 */
const generateToken = (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Find user by username and validate password
  const user = UserModel.findByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // The token is simply the user ID for now
  res.status(200).json({ id: user.id });
};

export default { registerUser, getUserById, generateToken };