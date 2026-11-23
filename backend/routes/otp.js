import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// In-memory OTP store (key: email, value: { otp, expiresAt, attempts, firstAttempt, verified })
const otpStore = new Map();

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt + 5 * 60 * 1000) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Generate cryptographically secure 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 🧪 Email Diagnostics endpoint (open in browser to test email config)
router.get("/test-email", async (req, res) => {
  const targetEmail = req.query.to || "dnimbalkar340@gmail.com";
  const emailjsConfigured = Boolean(
    (process.env.EMAILJS_SERVICE_ID || process.env.SERVICE_ID) &&
    (process.env.EMAILJS_TEMPLATE_ID || process.env.TEMPLATE_ID)
  );

  try {
    const result = await sendEmail(
      targetEmail,
      "🧪 Civic Reporter Email Test",
      "<h2>Email System is Working! 🚀</h2><p>This is a test email sent from Smart Civic Reporter.</p>",
      { otp: "123456", name: "Tester" }
    );
    return res.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}!`,
      provider: result.provider || 'smtp',
      emailjsConfigured,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Test email failed to send.",
      error: error.message,
      emailjsConfigured,
      targetEmail,
    });
  }
});

// ✅ SEND OTP
router.post("/send", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const cleanName = (name || "").toString().trim();

    // Rate limit: max 10 OTP requests per email per 10 minutes
    const now = Date.now();
    const existing = otpStore.get(cleanEmail);
    if (existing && existing.attempts >= 10 && now - existing.firstAttempt < 10 * 60 * 1000) {
      const waitMin = Math.ceil((10 * 60 * 1000 - (now - existing.firstAttempt)) / 60000);
      return res.status(429).json({ 
        message: `Too many OTP requests. Please wait ${waitMin} minute(s) before trying again.` 
      });
    }

    const otp = generateOTP();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes validity

    const isWithinWindow = existing && (now - existing.firstAttempt < 10 * 60 * 1000);
    const attempts = isWithinWindow ? (existing.attempts + 1) : 1;
    const firstAttempt = isWithinWindow ? existing.firstAttempt : now;

    // Store OTP in memory BEFORE attempting delivery so it is always valid and verifiable
    otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      attempts,
      firstAttempt,
      verified: false,
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0B0F19; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
            🏛️ Smart Civic Reporter
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; font-weight: 500;">
            Email Verification Code
          </p>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px; background: #0F172A;">
          <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
            Hello ${cleanName ? `<span style="color: #a855f7;">${cleanName}</span>` : 'Citizen'},
          </p>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
            Thank you for registering with <strong>Smart Civic Reporter</strong>. Please enter the following 6-digit verification code to complete your registration:
          </p>
          
          <!-- OTP Box -->
          <div style="background: rgba(139, 92, 246, 0.12); border: 2px dashed #8b5cf6; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
              Your Verification Code
            </p>
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #a855f7; font-family: 'Courier New', Courier, monospace; padding-left: 12px;">
              ${otp}
            </div>
          </div>
          
          <!-- Expiry Notice -->
          <div style="background: rgba(245, 158, 11, 0.12); border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin: 0 0 24px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0; font-weight: 600;">
              ⏱️ This code expires in 10 minutes
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">
              For your security, never share this verification code with anyone.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
            If you did not initiate this sign-up request, please disregard this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0B0F19; padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Smart Civic Reporter • Empowering Citizen Governance
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail(cleanEmail, "🔐 Verify Your Email — Smart Civic Reporter", html, { otp, name: cleanName });
      console.log(`✅ OTP successfully delivered to ${cleanEmail}`);
    } catch (emailErr) {
      console.error(`❌ [OTP] Outbound email delivery failed to ${cleanEmail}:`, emailErr.message);
      // Remove unreached OTP from store so invalid/unreached codes don't persist
      otpStore.delete(cleanEmail);
      return res.status(503).json({
        success: false,
        message: "Failed to deliver verification code to your email. Please verify your email address and try again.",
        error: emailErr.message,
      });
    }

    return res.json({ 
      success: true,
      message: "OTP sent successfully to your email inbox! 📧",
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error("❌ OTP send unexpected error:", error.message);
    res.status(500).json({ 
      message: error.message || "Failed to process OTP. Please try again.",
      error: error.message
    });
  }
});

// ✅ VERIFY OTP
router.post("/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const stored = otpStore.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({ 
        message: "No OTP found for this email. Please request a new code." 
      });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ 
        message: "OTP has expired. Please request a new code." 
      });
    }

    // Check OTP match
    if (stored.otp !== cleanOtp) {
      return res.status(400).json({ 
        message: "Invalid OTP code. Please check and try again." 
      });
    }

    // Mark as verified
    stored.verified = true;
    otpStore.set(cleanEmail, stored);

    console.log(`✅ OTP verified for ${cleanEmail}`);

    res.json({ 
      message: "Email verified successfully! ✅",
      verified: true,
    });
  } catch (error) {
    console.error("❌ OTP verify error:", error.message);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

// ✅ CHECK IF EMAIL IS VERIFIED (called before Firebase signup)
router.get("/check/:email", (req, res) => {
  const cleanEmail = (req.params.email || '').toString().trim().toLowerCase();
  const stored = otpStore.get(cleanEmail);
  
  if (stored && stored.verified && Date.now() <= stored.expiresAt) {
    // Clean up after check
    otpStore.delete(cleanEmail);
    return res.json({ verified: true });
  }
  
  res.json({ verified: false });
});

export default router;
