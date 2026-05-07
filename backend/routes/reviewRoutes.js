import express from "express";
import {
  getReviewsByStudent,
  createReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateReview } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.get("/student/:studentId", getReviewsByStudent);
router.post("/", protect, validateReview, createReview);

export default router;
