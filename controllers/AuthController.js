import bcrypt from "bcrypt";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// ==========================================
// SIGNUP PAGE
// ==========================================

export const getSignup = (req, res) => {
  res.render("signup");
};

// ==========================================
// LOGIN PAGE
// ==========================================

export const getLogin = (req, res) => {
  res.render("login");
};

// ==========================================
// SIGNUP
// ==========================================

export const signup = async (req, res) => {
  try {
    console.log("========== SIGNUP START ==========");
    console.log("BODY RECEIVED:", {
      name: req.body.name,
      email: req.body.email,
      hasPassword: !!req.body.password,
      hasConfirmPassword: !!req.body.confirmPassword,
    });

    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      console.log("❌ Missing fields");

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      return res.status(400).send("Passwords do not match.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log("1️⃣ Checking MongoDB for existing user...");

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    console.log("2️⃣ MongoDB query completed");

    if (existingUser) {
      console.log("❌ Email already exists");

      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    console.log("3️⃣ Hashing password...");

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("4️⃣ Password hashed");

    req.session.signupData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    };

    console.log("5️⃣ Signup data stored in session");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 2 * 60 * 1000;

    console.log("6️⃣ OTP generated");

    console.log("7️⃣ Sending email to:", normalizedEmail);

    await sendEmail(
      normalizedEmail,
      "Nexora AI - Email Verification",
      `Your Nexora AI verification OTP is ${otp}. It is valid for 2 minutes.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto;">
          <h2>Welcome to Nexora AI</h2>
          <p>Use the OTP below to verify your email address:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This OTP is valid for 2 minutes.</p>
        </div>
      `,
    );

    console.log("8️⃣ EMAIL SENT SUCCESSFULLY");

    res.redirect("/verifyOTP");

  } catch (error) {
    console.error("========== SIGNUP ERROR ==========");
    console.error(error);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);

    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};

// ==========================================
// VERIFY OTP PAGE
// ==========================================

export const getVerifyOtpPage = (req, res) => {
  res.render("verifyOTP");
};

// ==========================================
// VERIFY OTP
// ==========================================

export const verifyOtp = async (req, res) => {
  try {
    const signupData = req.session.signupData;

    if (!signupData) {
      return res.send("Signup session expired. Please signup again.");
    }

    if (!req.session.otp || !req.session.otpExpiry) {
      return res.send("OTP not found. Please signup again.");
    }

    // Check expiry
    if (Date.now() > req.session.otpExpiry) {
      req.session.otp = undefined;
      req.session.otpExpiry = undefined;

      return res.send("OTP has expired. Please signup again.");
    }

    const enteredOtp = req.body.otp?.trim();

    if (enteredOtp !== req.session.otp) {
      return res.send("Invalid OTP.");
    }

    // Double-check email
    const existingUser = await User.findOne({
      email: signupData.email,
    });

    if (existingUser) {
      return res.send("Email already registered.");
    }

    // Create verified user
    const user = await User.create({
      name: signupData.name,
      email: signupData.email,
      password: signupData.password,
      isVerified: true,
    });

    // Send welcome email
    await sendEmail(
      user.email,
      "Welcome to Nexora AI ✦",
      `Welcome to Nexora AI, ${user.name}!

Your account has been successfully verified and created.

You can now log in and start using Nexora AI.

Thank you for joining us!`,
      `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 560px;
        margin: 0 auto;
        color: #111827;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
      ">
        <div style="
          padding: 28px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        ">
          <h1 style="margin: 0;">✦ Nexora AI</h1>
          <p style="margin: 8px 0 0;">
            Your personal AI assistant
          </p>
        </div>

        <div style="padding: 32px;">
          <h2 style="margin-top: 0;">
            Welcome, ${user.name}! 👋
          </h2>

          <p style="line-height: 1.7;">
            Your email has been successfully verified and your
            Nexora AI account has been created.
          </p>

          <p style="line-height: 1.7;">
            You can now log in and start chatting with Nexora AI.
          </p>

          <div style="
            margin-top: 24px;
            padding: 16px;
            background: #f6f7ff;
            border-radius: 10px;
          ">
            <strong>Account:</strong> ${user.email}
          </div>
        </div>

        <div style="
          padding: 18px 32px;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          text-align: center;
        ">
          © 2026 Nexora AI
        </div>
      </div>
      `,
    );

    // Clear OTP/signup session data
    req.session.signupData = undefined;
    req.session.otp = undefined;
    req.session.otpExpiry = undefined;

    res.redirect("/login");
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).send("Failed to verify OTP.");
  }
};
// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    // IMPORTANT: Check user BEFORE accessing user.isVerified
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    req.session.userId = user._id.toString();

    res.redirect("/chat");
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.redirect("/login");
  });
};
