import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import crypto from "crypto";
import sharp from "sharp";
import Complaint from "../models/Complaint.js";
import admin from "../config/firebaseAdmin.js";
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

// Helper: generate normalized perceptual fingerprint from image buffer
const getImageFingerprint = async (buffer) => {
  try {
    const normalized = await sharp(buffer)
      .resize(16, 16, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
    return crypto.createHash("md5").update(normalized).digest("hex");
  } catch (err) {
    console.warn("⚠️ Failed to generate image fingerprint:", err.message);
    return "";
  }
};

// POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // 1. Calculate SHA-256 raw hash and perceptual fingerprint
    const imageHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const imageFingerprint = await getImageFingerprint(req.file.buffer);

    // 2. Identify user from request body or Authorization Bearer token
    let effectiveEmail = (req.body.userEmail || "").trim().toLowerCase();
    let effectiveUid = (req.body.userId || "").trim();

    if ((!effectiveEmail || !effectiveUid) && req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        if (!effectiveEmail && decoded.email) effectiveEmail = decoded.email.trim().toLowerCase();
        if (!effectiveUid && decoded.uid) effectiveUid = decoded.uid;
      } catch (authErr) {
        console.warn("⚠️ Upload auth token check warning:", authErr.message);
      }
    }

    // 3. Duplicate image check by user email or user ID
    const userFilters = [];
    if (effectiveEmail) {
      userFilters.push({ userEmail: { $regex: new RegExp(`^${effectiveEmail}$`, "i") } });
    }
    if (effectiveUid && effectiveUid !== "anonymous") {
      userFilters.push({ userId: effectiveUid });
    }

    if (userFilters.length > 0) {
      const matchCriteria = [{ imageHash }];
      if (imageFingerprint) {
        matchCriteria.push({ imageFingerprint });
      }

      const existingComplaint = await Complaint.findOne({
        $and: [
          { $or: userFilters },
          { $or: matchCriteria },
        ],
      });

      if (existingComplaint) {
        console.log(`🚫 DUPLICATE IMAGE BLOCKED for user ${effectiveEmail || effectiveUid}! Existing complaint: ${existingComplaint._id}`);
        return res.status(409).json({
          message: "You have already submitted a complaint with this exact image. Duplicate image uploads are not permitted.",
          duplicateImage: true,
          existingComplaintId: existingComplaint._id,
          problemType: existingComplaint.problemType,
          status: existingComplaint.status,
          createdAt: existingComplaint.createdAt,
        });
      }
    }

    // 4. Upload to Cloudinary
    const result = await uploadBufferToCloudinary(req.file.buffer);

    res.json({
      imageUrl: result.secure_url,
      imageHash,
      imageFingerprint,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ message: "Failed to upload image: " + error.message });
  }
});

export default router;