import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    project: {
        type: Types.ObjectId,
        ref: "Project",
    },
    completed: {
        type: Boolean,
        default: false,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
   assignedTo:[
        {
            type:Types.ObjectId,
            ref:"User",
        }
   ],
  },
  {
    timestamps: true,
  }
);

export const Goal =mongoose.models.Goal || model("Goal", schema);
