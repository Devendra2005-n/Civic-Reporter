import fetch from "node-fetch";

/**
 * Universal SMS Service for Field Worker Task Assignment
 * 
 * Supports:
 * 1. Twilio (Global, Free Trial Credits, Highly Reliable)
 * 2. Fast2SMS (Indian Numbers via Bulk V2)
 * 3. Safe Console Simulator fallback if keys are missing
 */
export async function sendWorkerAssignmentSMS({
  workerName,
  workerPhone,
  problemType,
  severity,
  location,
  complaintId,
}) {
  // Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  // Fast2SMS credentials
  const fast2smsKey = process.env.FAST2SMS_API_KEY;

  // Clean 10-digit Indian phone number
  const cleanPhone = String(workerPhone).replace(/[^0-9]/g, "").slice(-10);

  if (!cleanPhone || cleanPhone.length !== 10) {
    console.warn(`[SMS Service] Invalid phone number provided: ${workerPhone}`);
    return {
      success: false,
      message: "Invalid 10-digit phone number format",
      simulated: true,
    };
  }

  // Compose concise task dispatch message
  const shortId = String(complaintId).slice(-6).toUpperCase();
  const locText = location ? location.slice(0, 50) : "Location on Portal";
  const message = `CIVIC ALERT: New task assigned to ${workerName}. Issue: ${problemType} (${severity}). Loc: ${locText}. Task ID: #${shortId}. Inspect & resolve promptly.`;

  // 1. Try TWILIO if credentials are present
  if (twilioSid && twilioAuthToken && twilioFrom && twilioSid.startsWith("AC")) {
    try {
      console.log(`[Twilio] Dispatching SMS to +91${cleanPhone} from ${twilioFrom}...`);
      const authHeader = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");
      
      const bodyParams = new URLSearchParams();
      bodyParams.append("To", `+91${cleanPhone}`);
      bodyParams.append("From", twilioFrom);
      bodyParams.append("Body", message);

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        }
      );

      const twilioData = await twilioRes.json();
      console.log("[Twilio] Response status:", twilioRes.status, twilioData.sid || twilioData.message);

      if (twilioRes.status === 201 || twilioRes.status === 200) {
        return {
          success: true,
          provider: "Twilio",
          sid: twilioData.sid,
          message: "SMS successfully dispatched to worker via Twilio!",
        };
      } else {
        console.warn("[Twilio] Error dispatching:", twilioData.message || twilioData);
        return {
          success: false,
          provider: "Twilio",
          message: twilioData.message || "Twilio failed to dispatch message",
          data: twilioData,
        };
      }
    } catch (err) {
      console.error("[Twilio] Exception:", err.message);
      return {
        success: false,
        provider: "Twilio",
        message: err.message,
      };
    }
  }

  // 2. Try Fast2SMS if configured
  if (fast2smsKey && fast2smsKey !== "YOUR_FAST2SMS_API_KEY") {
    try {
      console.log(`[Fast2SMS] Sending real SMS to +91 ${cleanPhone}...`);

      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const data = await response.json();
      console.log("[Fast2SMS] Response:", data);

      if (data.return === true || data.status_code === 200) {
        return {
          success: true,
          provider: "Fast2SMS",
          message: "SMS dispatched successfully to worker phone",
          data,
        };
      } else {
        console.warn("[Fast2SMS] Gateway warning/error:", data.message || data);
        return {
          success: false,
          provider: "Fast2SMS",
          message: data.message || "Fast2SMS gateway returned failure",
          data,
        };
      }
    } catch (error) {
      console.error("[Fast2SMS] Request exception:", error.message);
      return {
        success: false,
        provider: "Fast2SMS",
        message: error.message,
      };
    }
  }

  // 3. Fallback: Console simulator
  console.log("=================================================");
  console.log("📱 [SMS SIMULATOR - NO ACTIVE SMS GATEWAY KEY CONFIGURED]");
  console.log(`To: +91 ${cleanPhone} (${workerName})`);
  console.log(`Message: ${message}`);
  console.log("=================================================");
  return {
    success: true,
    simulated: true,
    message: "SMS simulated in console (Twilio / Fast2SMS not configured)",
    details: { phone: cleanPhone, text: message },
  };
}
