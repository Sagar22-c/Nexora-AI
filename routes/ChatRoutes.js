import express from "express";

import {
  getChatPage,
  sendMessage,
  getChats,
  getSingleChat,
  deleteChat,
} from "../controllers/ChatController.js";

import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getChatPage);

router.post("/api", sendMessage);

router.get("/history", getChats);

router.get("/history/:id", getSingleChat);

router.delete("/history/:id", deleteChat);

export default router;
