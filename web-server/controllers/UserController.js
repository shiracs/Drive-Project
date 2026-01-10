import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";
const key = process.env.JWT_SECRET || "fallback_key_for_local_dev";

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
  if (UserModel.findByUsername(username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Create new user through UserModel
  const newUser = UserModel.create({
    username,
    password,
    fullName,
    profilePic,
  });

  const token = jwt.sign({ username: newUser.username, id: newUser.id }, key);
  res.status(201).json({
    username: newUser.username,
    token: token,
  });
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
 * Get user by username
 * @param {*} req
 * @param {*} res
 * @returns the user data or error message
 */
const getUserByUsername = (req, res) => {
  const { username } = req.params;

  // Find user by username
  const user = UserModel.findByUsername(username);
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
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const user = UserModel.findByUsername(username);
  if (user && user.password === password) {
    // create a token
    const data = { username: user.username, id: user.id };
    const token = jwt.sign(data, key);

    res.status(200).json({
      token: token,
      username: user.username,
    });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
};

export default { registerUser, getUserById, getUserByUsername, generateToken };
