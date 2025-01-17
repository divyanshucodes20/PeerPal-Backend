import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    rent: {
        type: Number,
    },
    contactNumber: {
        type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Roommate =mongoose.models.Roommate || model("Roommate", schema);
