import express from "express";
import {
  getContracts,
  getContractById,
  createContract,
  updateContractStatus,
} from "../controllers/contractController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getContracts).post(protect, createContract);
router.route("/:id").get(protect, getContractById);
router.route("/:id/status").put(protect, updateContractStatus);

export default router;
