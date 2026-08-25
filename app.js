import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import session from "express-session";

import AuthRoutes from "./routes/AuthRoutes.js";
import ChatRoutes from "./routes/ChatRoutes.js";
import MemoryRoutes from "./routes/MemoryRoutes.js";

const app = express();

// ==========================================
// EJS
// ==========================================

app.set("view engine", "ejs");
app.set("views", "./views");

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

// ==========================================
// SESSION
// ==========================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "nexora-secret-key",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// ==========================================
// MONGODB
// ==========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/", AuthRoutes);

// ==========================================
// AUTH PAGES
// ==========================================

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// ==========================================
// CHAT ROUTES
// ==========================================

app.use("/chat", ChatRoutes);

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.redirect("/login");
});

// ==========================================
// MEMORY
// ==========================================

app.use("/memory", MemoryRoutes);

// ==========================================
// TEST
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Nexora server is working",
  });
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
