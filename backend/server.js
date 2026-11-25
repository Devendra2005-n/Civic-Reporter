process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Fix gRPC TLS issues for Firebase Admin SDK on local dev (Firestore uses gRPC, not http)
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA:HIGH+RSA:HIGH+DSS';

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import dns from "dns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

// Guard DNS override so it doesn't break container internal networking on cloud hosts
try {
  if (process.env.NODE_ENV !== "production") {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  }
} catch (e) {
  console.warn("DNS override skipped:", e.message);
}

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import complaintRoutes from "./routes/complaint.js";
import uploadRoutes from "./routes/upload.js";
import aiRoutes from "./routes/ai.js";
import authorityRoutes from "./routes/authority.js";
import userRoutes from "./routes/users.js";
import notificationRoutes from "./routes/notification.js";
import otpRoutes from "./routes/otp.js";
import locationRoutes from "./routes/location.js";
import duplicateRoutes from "./routes/duplicate.js";
import workerRoutes from "./routes/workers.js";

console.log("Starting server...");

// Connect DB
connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Explicit CORS middleware for all responses & preflights
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount routes on both /api/<path> and /<path> for full client compatibility
const routes = [
  { path: "ai", handler: aiRoutes },
  { path: "complaints", handler: complaintRoutes },
  { path: "upload", handler: uploadRoutes },
  { path: "authority", handler: authorityRoutes },
  { path: "users", handler: userRoutes },
  { path: "notifications", handler: notificationRoutes },
  { path: "otp", handler: otpRoutes },
  { path: "location", handler: locationRoutes },
  { path: "duplicates", handler: duplicateRoutes },
  { path: "workers", handler: workerRoutes },
];

routes.forEach(({ path, handler }) => {
  app.use(`/api/${path}`, handler);
  app.use(`/${path}`, handler);
});

app.get("/", (req, res) => {
  res.send("🚀 Backend is running...");
});

// Global error handler with CORS guarantees
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});