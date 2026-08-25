import Memory from "../models/Memory.js";

// ==========================================
// GET MEMORY PAGE
// ==========================================

export const getMemories = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const memories = await Memory.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    res.render("memory", {
      memories,
    });
  } catch (error) {
    console.error("GET MEMORIES ERROR:", error);
    res.status(500).send("Server error");
  }
};

// ==========================================
// ADD MEMORY
// ==========================================

export const addMemory = async (req, res) => {
  try {
    const { key, value } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }

    if (!key?.trim() || !value?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Key and value are required",
      });
    }

    const memory = await Memory.create({
      userId,
      key: key.trim().toLowerCase(),
      value: value.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Memory added successfully",
      memory,
    });
  } catch (error) {
    console.error("ADD MEMORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE MEMORY
// ==========================================

export const updateMemory = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }

    const { key, value } = req.body;

    if (!key?.trim() || !value?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Key and value are required",
      });
    }

    const memory = await Memory.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: userId,
      },
      {
        key: key.trim().toLowerCase(),
        value: value.trim(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    res.json({
      success: true,
      message: "Memory updated successfully",
      memory,
    });
  } catch (error) {
    console.error("UPDATE MEMORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE MEMORY
// ==========================================

export const deleteMemory = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }

    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      userId: userId,
    });

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    res.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("DELETE MEMORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
