import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    prizePerPerson: {
        type: Number,
        required: true,
    },
    seats: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    contactNumber:{
        type: Number,
    },
    members: [
        {
            type: Types.ObjectId,
            ref: "User",
        },
    ],
  },
  {
    timestamps: true,
  }
);

export const Ride =mongoose.models.Ride || model("Ride", schema);
