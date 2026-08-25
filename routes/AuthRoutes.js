import express from "express";

import {
  signup,
  login,
  logout,
  getVerifyOtpPage,
  verifyOtp,
} from "../controllers/AuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/verifyOTP", getVerifyOtpPage);
router.post("/verifyOTP", verifyOtp);

router.get("/logout", logout);

export default router;
