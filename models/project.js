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
    type:{
      type: String,
      enum: ["group", "personal"],
      default: "personal",
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
    teamSize:{
      type: Number,
      default: 1,
    },
    groupChat: {
      type: Types.ObjectId,
      ref: "Chat",
    },
    learnerId:{
      type: Types.ObjectId,
      ref: "Learner",
    },
  },
  {
    timestamps: true,
  }
);

export const Project =mongoose.models.Project || model("Project", schema);
