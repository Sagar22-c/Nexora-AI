import Chat from "../models/Chat.js";
import Memory from "../models/Memory.js";

import { askAIStream, extractMemories } from "../utils/ai.js";

export const getChatPage = async (req, res) => {
  try {
    res.render("chat");
  } catch (error) {
    console.error("CHAT PAGE ERROR:", error);
    res.status(500).send("Server error");
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { messages, chatId } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "Messages are required",
      });
    }

    // =========================================
    // GET USER MEMORIES
    // =========================================

    const memories = await Memory.find({ userId });

    // =========================================
    // START NVIDIA STREAM
    // =========================================

    const stream = await askAIStream(messages, memories);

    // =========================================
    // SSE HEADERS
    // =========================================

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let answer = "";

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    // =========================================
    // READ NVIDIA STREAM
    // =========================================

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split("\n\n");

      buffer = events.pop() || "";

      for (const event of events) {
        const lines = event.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) {
            continue;
          }

          const data = line.replace(/^data:\s*/, "").trim();

          if (!data || data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              answer += content;

              res.write(
                `data: ${JSON.stringify({
                  type: "chunk",
                  content,
                })}\n\n`,
              );
            }
          } catch (error) {
            console.error("STREAM PARSE ERROR:", data);
          }
        }
      }
    }

    // =========================================
    // EXTRACT MEMORIES
    // =========================================

    try {
      const latestUserMessage = messages
        .filter((message) => message.role === "user")
        .at(-1);

      const newMemories = latestUserMessage
        ? await extractMemories([latestUserMessage])
        : [];

      for (const memory of newMemories) {
        if (!memory?.key || !memory?.value) {
          continue;
        }

        const key = String(memory.key).trim().toLowerCase();

        const value = String(memory.value).trim();

        if (!key || !value) {
          continue;
        }

        await Memory.findOneAndUpdate(
          {
            userId,
            key,
          },
          {
            userId,
            key,
            value,
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          },
        );
      }

      console.log("MEMORIES EXTRACTED:", newMemories);
    } catch (memoryError) {
      // Memory failure should NOT break the chat
      console.error("MEMORY EXTRACTION ERROR:", memoryError);
    }

    // =========================================
    // FIND EXISTING CHAT
    // =========================================

    let chat = null;

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId,
      });
    }

    // =========================================
    // CREATE NEW CHAT
    // =========================================

    if (!chat) {
      const firstMessage = messages.find((message) => message.role === "user");

      const title =
        firstMessage?.content?.split(" ").slice(0, 6).join(" ") || "New Chat";

      chat = await Chat.create({
        userId,
        title,
        messages: [
          ...messages,
          {
            role: "assistant",
            content: answer,
          },
        ],
      });
    }

    // =========================================
    // UPDATE EXISTING CHAT
    // =========================================
    else {
      chat.messages = [
        ...messages,
        {
          role: "assistant",
          content: answer,
        },
      ];

      await chat.save();
    }

    // =========================================
    // SEND CHAT ID
    // =========================================

    res.write(
      `data: ${JSON.stringify({
        type: "done",
        chatId: chat._id.toString(),
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error("CHAT STREAM ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: error.message,
      })}\n\n`,
    );

    res.end();
  }
};

// =========================================
// GET ALL CHATS
// =========================================

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.session.userId,
    }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("GET CHATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// GET SINGLE CHAT
// =========================================

export const getSingleChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("GET SINGLE CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// DELETE CHAT
// =========================================

export const deleteChat = async (req, res) => {
  try {
    await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    res.json({
      success: true,
      message: "Chat deleted",
    });
  } catch (error) {
    console.error("DELETE CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
