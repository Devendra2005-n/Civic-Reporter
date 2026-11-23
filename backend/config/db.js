import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://test:Dev%402005@smartapp.74zcgfi.mongodb.net/?appName=smartapp";
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Warning:", error.message);
    // Do NOT process.exit(1) - keep server running so port binding succeeds on cloud platforms (Render, etc.)
  }
};

export default connectDB;
