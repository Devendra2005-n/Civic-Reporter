process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Fix gRPC TLS issues for Firebase Admin SDK on local dev (Firestore uses gRPC, not http)
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA:HIGH+RSA:HIGH+DSS';
import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "dns";
import complaintRoutes from "./routes/complaint.js";
import uploadRoutes from "./routes/upload.js";
import aiRoutes from "./routes/ai.js";
import authorityRoutes from "./routes/authority.js";
import userRoutes from "./routes/users.js";
import notificationRoutes from "./routes/notification.js";
import otpRoutes from "./routes/otp.js";
import locationRoutes from "./routes/location.js";
import duplicateRoutes from "./routes/duplicate.js";

// Load env first (handled via import 'dotenv/config' at top)
dns.setServers(["1.1.1.1","8.8.8.8"]);

console.log("Starting server...");

// Connect DB
connectDB();

const app = express();

app.use(cors());
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
];

routes.forEach(({ path, handler }) => {
  app.use(`/api/${path}`, handler);
  app.use(`/${path}`, handler);
});

app.get("/", (req, res) => {
  res.send("🚀 Backend is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});