import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Worker name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required for SMS assignment"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: [
        "Roads & Potholes",
        "Solid Waste Management",
        "Street Lighting & Electrical",
        "Water & Sewage",
        "Parks & Public Amenities",
        "General Municipal Department",
      ],
      default: "General Municipal Department",
    },
    age: {
      type: Number,
      min: 18,
      max: 75,
      required: [true, "Age is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Busy", "On-Leave"],
      default: "Active",
    },
    activeTasksCount: {
      type: Number,
      default: 0,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
