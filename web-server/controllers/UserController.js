import UsersService from "../services/UsersService.js";
import jwt from "jsonwebtoken";
const key = process.env.JWT_SECRET || "fallback_key_for_local_dev";

/**
 * Register a new user
 * @param {*} req
 * @param {*} res
 * @returns the new user data or error message
 */
const registerUser = async(req, res) => {
  const { username, password, fullName, profilePic } = req.body;

  // Basic validation
  if (!username || !password || !fullName || !profilePic) {
    return res.status(400).json({
      error: "Username, password, fullName and profilePic are required",
    });
  }

  const isLengthOK = password.length >= 8 && password.length <= 16;
  const hasLetter = /\p{L}/u.test(password); 
  const hasNumber = /[0-9]/.test(password);

  if (!isLengthOK || !hasLetter || !hasNumber) {
    return res.status(400).json({
      error: "Password must be 8-16 characters long and contain at least one letter and one number",
    });
  }

  // Check if user already exists
  const usedName = await UsersService.findByUsername(username);
  if (usedName) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Create new user through UserModel
  const newUser = await UsersService.create({
    username,
    password,
    fullName,
    profilePic,
  });

  const token = jwt.sign({ username: newUser.username, id: newUser.id }, key);
  res.status(201).json({
    username: newUser.username,
    token: token,
    profilePic: newUser.profilePic,
    id: newUser.id
  });
};

/**
 * Get user by UUID
 * @param {*} req
 * @param {*} res
 * @returns the user data or error message
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  // Find user by ID
  const user = await UsersService.findById(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // return the user data without the password
  const userObject = user.toJSON();
  const { password: _, ...userResponse } = userObject;
  res.status(200).json(userResponse);
};

/**
 * Get user by username
 * @param {*} req
 * @param {*} res
 * @returns the user data or error message
 */
const getUserByUsername = async (req, res) => {
  const { username } = req.params;

  // Find user by username
  const user = await UsersService.findByUsername(username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // return the user data without the password
  const userObject = user.toJSON();
  const { password: _, ...userResponse } = userObject;  
  res.status(200).json(userResponse);
};

/**
 * Generate a token for a user
 * @param {*} req
 * @param {*} res
 * @returns the token or error message
 */
const generateToken = async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const user = await UsersService.findByUsername(username);
  if (user && user.password === password) {
    const userObject = user.toJSON();
    // create a token
    const data = { username: userObject.username, id: userObject.id };
    const token = jwt.sign(data, key);

    res.status(200).json({
      token: token,
      username: userObject.username,
      profilePic: userObject.profilePic,
      id: userObject.id
    });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
};

/**
 * Get current user info (requires authentication)
 * @param {*} req
 * @param {*} res
 * @returns the current user data
 */
const getCurrentUser = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await UsersService.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // return the user data without the password
  const userObject = user.toJSON();
  const { password: _, ...userResponse } = userObject
  res.status(200).json(userResponse);
};

export default { registerUser, getUserById, getUserByUsername, generateToken, getCurrentUser };
