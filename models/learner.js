import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    decription: {
        type: String,
        required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    teamSize: {
      type: Number,
    },
    isProject: {
        type: Boolean,
        default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Learner =mongoose.models.Learner || model("Learner", schema);
