import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import "../config/cloudinary.js"; // Ensure cloudinary is configured (sets cloud_name, api_key, api_secret)

const router = express.Router();

// Use memory storage — no temp files (safe for Render/serverless ephemeral FS)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload a Buffer to Cloudinary via stream (no extra packages needed)
const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "civic-reporter", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    res.json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ message: "Failed to upload image: " + error.message });
  }
});

export default router;