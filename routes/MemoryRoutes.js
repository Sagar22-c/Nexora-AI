import express from "express";

import {
  getMemories,
  addMemory,
  updateMemory,
  deleteMemory,
} from "../controllers/MemoryController.js";

import {isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getMemories);

router.post("/", addMemory);

router.put("/:id", updateMemory);

router.delete("/:id", deleteMemory);

export default router;
