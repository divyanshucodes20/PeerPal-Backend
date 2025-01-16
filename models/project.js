import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    goals: [
      {
        type: Types.ObjectId,
        ref: "Goal",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Project =mongoose.models.Project || model("Project", schema);
