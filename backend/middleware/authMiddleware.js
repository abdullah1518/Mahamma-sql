import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const result = await pool.query("SELECT id, name, email, major, rating FROM student WHERE id = $1", [decoded.id]);
      
      if (result.rows.length === 0) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }
      
      req.user = result.rows[0];

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error("Not authorized, token failed"));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error("Not authorized, no token"));
  }
};
