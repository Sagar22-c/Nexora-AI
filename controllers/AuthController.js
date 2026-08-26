import bcrypt from "bcrypt";

import User from "../models/User.js";

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

    // Check required fields
    if (!name || !email || !password || !confirmPassword) {
      console.log("❌ Missing fields");

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");

      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
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

    // Hash password
    console.log("3️⃣ Hashing password...");

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("4️⃣ Password hashed");

    // Create user directly
    console.log("5️⃣ Creating user...");

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log("6️⃣ User created:", user._id);

    console.log("========== SIGNUP SUCCESS ==========");

    // Redirect to login
    res.redirect("/login");
  } catch (error) {
    console.error("========== SIGNUP ERROR ==========");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
  try {
    console.log("========== LOGIN START ==========");

    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    console.log("1️⃣ Finding user...");

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Check user
    if (!user) {
      console.log("❌ User not found");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("2️⃣ User found");

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("❌ Wrong password");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("3️⃣ Password correct");

    // Create session
    req.session.userId = user._id.toString();

    console.log("4️⃣ Session created");

    console.log("========== LOGIN SUCCESS ==========");

    // Redirect to chat
    res.redirect("/chat");
  } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);

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
      console.error("LOGOUT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    console.log("✅ User logged out");

    res.redirect("/login");
  });
};
