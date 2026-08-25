import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    key: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

memorySchema.index({ userId: 1, key: 1 }, { unique: true });

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;
