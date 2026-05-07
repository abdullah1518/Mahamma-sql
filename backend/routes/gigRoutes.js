import express from "express";
import {
  getGigs,
  getGigById,
  createGig,
  updateGig,
  deleteGig,
} from "../controllers/gigController.js";
import { protect } from "../middleware/authMiddleware.js";
// roleMiddleware relies on User model, but we don't have roles in Phase 2 student table. 
// So we will just use protect.

import proposalRouter from "./proposalRoutes.js";

const router = express.Router();

router.route("/").get(getGigs).post(protect, createGig);
router
  .route("/:id")
  .get(getGigById)
  .put(protect, updateGig)
  .delete(protect, deleteGig);

router.use("/:gigId/proposals", proposalRouter);

export default router;
