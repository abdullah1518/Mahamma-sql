import pool from "../config/db.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  try {
    const { Email, Password } = req.body;

    const result = await pool.query("SELECT * FROM student WHERE email = $1", [Email]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(Password, user.password_hash))) {
      res.json({
        id: user.id,
        Name: user.name,
        Email: user.email,
        Major: user.major,
        token: generateToken(user.id),
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { Name, Email, Password, Major } = req.body;

    const userExists = await pool.query("SELECT id FROM student WHERE email = $1", [Email]);

    if (userExists.rows.length > 0) {
      res.status(400);
      throw new Error("Student already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(Password, salt);

    const result = await pool.query(
      "INSERT INTO student (name, email, password_hash, major) VALUES ($1, $2, $3, $4) RETURNING id, name, email, major",
      [Name, Email, passwordHash, Major || ""]
    );
    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      Name: user.name,
      Email: user.email,
      Major: user.major,
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, email, major, rating FROM student WHERE id = $1", [req.user.id]);
    const user = result.rows[0];

    if (user) {
      res.json({
        id: user.id,
        Name: user.name,
        Email: user.email,
        Major: user.major,
        Rating: user.rating,
      });
    } else {
      res.status(404);
      throw new Error("Student not found");
    }
  } catch (error) {
    next(error);
  }
};
