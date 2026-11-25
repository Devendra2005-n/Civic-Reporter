import express from "express";
import Worker from "../models/Worker.js";
import Complaint from "../models/Complaint.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { sendWorkerAssignmentSMS } from "../services/smsService.js";

const router = express.Router();

// 🚀 1. GET ALL WORKERS (Admin Only, filterable by department & city)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { department, city, status } = req.query;
    const filter = {};

    if (department && department !== "all") {
      filter.department = department;
    }
    if (city && city !== "all") {
      filter.city = new RegExp(`^${city}$`, "i");
    }
    if (status && status !== "all") {
      filter.status = status;
    }

    const workers = await Worker.find(filter).sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    console.error("GET /api/workers error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 🚀 2. CREATE A NEW WORKER (Admin Only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, phone, department, age, city } = req.body;

    if (!name || !phone || !department || !age || !city) {
      return res.status(400).json({
        message: "All fields are required: name, phone, department, age, city",
      });
    }

    // Clean phone number (ensure at least 10 digits)
    const cleanPhone = String(phone).replace(/[^0-9]/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit mobile number for SMS dispatch",
      });
    }

    // Check if worker with exact phone already exists
    const existing = await Worker.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({
        message: `A worker with phone ${cleanPhone} already exists (${existing.name})`,
      });
    }

    const worker = new Worker({
      name: name.trim(),
      phone: cleanPhone,
      department,
      age: Number(age),
      city: city.trim(),
      status: "Active",
    });

    await worker.save();
    res.status(201).json({
      message: "Worker registered successfully",
      worker,
    });
  } catch (error) {
    console.error("POST /api/workers error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 🚀 3. UPDATE WORKER STATUS (Admin Only)
router.patch("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Busy", "On-Leave"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.json({ message: `Status updated to ${status}`, worker });
  } catch (error) {
    console.error("PATCH /api/workers/:id/status error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 🚀 4. DELETE WORKER (Admin Only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/workers/:id error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 🚀 5. ASSIGN COMPLAINT TO WORKER & DISPATCH SMS (Admin Only)
router.post("/assign/:complaintId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ message: "Worker ID is required" });
    }

    const [worker, complaint] = await Promise.all([
      Worker.findById(workerId),
      Complaint.findById(complaintId),
    ]);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Update Complaint
    complaint.status = "Assigned";
    complaint.assignedWorker = worker._id;
    complaint.assignedWorkerName = worker.name;
    complaint.assignedWorkerPhone = worker.phone;
    complaint.assignedAt = new Date();

    complaint.timeline.push({
      status: "Assigned",
      updatedBy: req.user?.name || "Admin",
      remarks: `Assigned to ${worker.name} (${worker.department}) - SMS dispatched to +91 ${worker.phone}`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Increment Worker's active tasks
    worker.activeTasksCount = (worker.activeTasksCount || 0) + 1;
    await worker.save();

    // Send SMS via Fast2SMS service
    const smsResult = await sendWorkerAssignmentSMS({
      workerName: worker.name,
      workerPhone: worker.phone,
      problemType: complaint.problemType || "Civic Issue",
      severity: complaint.severity || "Medium",
      location: complaint.location?.address || complaint.city || "See Portal",
      complaintId: complaint._id,
    });

    res.json({
      message: `Task successfully assigned to ${worker.name}`,
      complaint,
      worker,
      smsResult,
    });
  } catch (error) {
    console.error("POST /api/workers/assign error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
