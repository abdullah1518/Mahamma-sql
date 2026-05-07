import express from "express";
import {
  getProposalsByGig,
  getProposalById,
  createProposal,
  updateProposalStatus,
  deleteProposal,
} from "../controllers/proposalController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateProposal } from "../middleware/validateMiddleware.js";

const router = express.Router({ mergeParams: true });

router.route("/").get(protect, getProposalsByGig).post(protect, validateProposal, createProposal);

export const standaloneRouter = express.Router();
standaloneRouter
  .route("/:id")
  .get(protect, getProposalById)
  .delete(protect, deleteProposal);

standaloneRouter.put("/:id/status", protect, updateProposalStatus);

export default router;
