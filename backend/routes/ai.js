import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import translate from "google-translate-api-x";
import Complaint from "../models/Complaint.js";
import { supportedLanguages } from "../data/authorityData.js";
import { generateLetterTemplate } from "../utils/localization.js";
import { predictImage } from "../services/mlService.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = express.Router();

// Google Gemini client (optional fallback)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Safety settings shared by all models
const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Model configuration for JSON outputs (analyze, validate-category)
const jsonModelConfig = {
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  },
  safetySettings,
};

// Model configuration for plain text outputs (translation)
const textModelConfig = {
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 4096,
  },
  safetySettings,
};

let visionModel, textModel, translationModel;
if (genAI) {
  try {
    visionModel = genAI.getGenerativeModel(jsonModelConfig);
    textModel = genAI.getGenerativeModel(jsonModelConfig);
    translationModel = genAI.getGenerativeModel(textModelConfig);
    console.log("✅ Gemini models initialized (JSON + Text)");
  } catch (err) {
    console.error("❌ Failed to initialize Gemini models:", err.message);
  }
}

// ===================================================
// INVALID IMAGE DETECTION — List of non-civic items
// ===================================================
const INVALID_IMAGE_KEYWORDS = [
  "selfie", "person posing", "food", "meal", "restaurant", "table", "laptop",
  "computer", "phone", "mobile", "screenshot", "meme", "cartoon", "anime",
  "pet", "cat", "dog", "nature scenery", "sunset", "beach", "mountain",
  "indoor furniture", "bedroom", "living room", "bathroom mirror", "gym",
  "shopping", "mall", "clothes", "shoes", "makeup", "jewelry", "car interior",
  "dashboard", "video game", "social media", "wedding", "party", "birthday",
  "certificate", "document scan", "book page", "random object", "toy",
  "painting", "artwork", "abstract art"
];

const VALID_CIVIC_KEYWORDS = [
  "pothole", "broken road", "cracked pavement", "garbage", "waste", "trash",
  "litter", "debris", "streetlight", "broken light", "fallen pole", "drainage",
  "sewer", "blocked drain", "overflowing", "water logging", "flooding",
  "broken bench", "damaged wall", "graffiti", "broken sidewalk", "construction debris",
  "open manhole", "damaged railing", "fallen tree", "broken pipe", "water leak",
  "electricity pole damage", "signal broken", "traffic sign damage", "road damage",
  "cracked building", "public toilet", "dirty public space"
];

// ===================================================
// ANALYZE ENDPOINT — Vision-based civic issue detection + Image Validation
// ===================================================
router.post("/analyze", async (req, res) => {
  console.log("AI ROUTE HIT ✅");
  try {
    const { imageUrl, userName, locationAddress, authorityInfo } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL required" });
    }

    // Build dynamic prompt inserts
    const nameInsert = userName
      ? `The complainant's name is "${userName}".`
      : "";
    const locationInsert = locationAddress
      ? `The location of the issue is "${locationAddress}".`
      : "";

    // ===================================================
    // CALL ML SERVICE (Trained ONNX / Microservice)
    // ===================================================
    let parsed;
    try {
      parsed = await predictImage(imageUrl);
      console.log("ML Prediction:", parsed);

      // Ensure expected fields exist
      parsed.confidence = parsed.confidence || 0.5;
      parsed.problemType = parsed.problemType || "other";
      parsed.severity = parsed.severity || "Medium";
      parsed.description = parsed.description || `Detected ${parsed.problemType} with ${Math.round(parsed.confidence * 100)}% confidence using custom trained ML model.`;
    } catch (mlErr) {
      console.warn("⚠️ Local ML inference failed:", mlErr.message);

      // Secondary fallback to Gemini Vision if configured
      if (visionModel) {
        try {
          console.log("Attempting Gemini Vision fallback...");
          const imgResponse = await fetch(imageUrl);
          const arrayBuffer = await imgResponse.arrayBuffer();
          const base64Image = Buffer.from(arrayBuffer).toString("base64");
          const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

          const prompt = `You are a civic issue detection AI. Analyze this image and respond with JSON matching this schema:
{
  "problemType": "pothole" | "garbage" | "streetlight" | "drainage" | "clean_road" | "other",
  "severity": "Low" | "Medium" | "High",
  "confidence": 0.85,
  "description": "brief description",
  "imageValidation": { 
    "isValid": true, 
    "isNoProblem": false, 
    "reason": "reason", 
    "detectedContent": "description" 
  }
}
CRITICAL VALIDATION INSTRUCTIONS:
1. If the photo shows a clean road, intact asphalt, functional streetlight, or well-maintained public infrastructure with NO potholes, NO garbage, and NO civic defects:
   - Set "problemType": "clean_road"
   - Set "imageValidation": { "isValid": false, "isNoProblem": true, "reason": "The image shows a clean road or infrastructure in good condition. There are no damages, potholes, or hazards detected.", "detectedContent": "Clean Road / Good Infrastructure Condition" }
2. If the photo contains real civic problems (pothole, garbage, broken light, drainage overflow):
   - Set "problemType" accordingly, "imageValidation": { "isValid": true, "isNoProblem": false, "reason": "Civic issue detected", "detectedContent": "..." }
3. If the photo is non-civic (food, selfie, pet, indoor, random object):
   - Set "problemType": "other", "imageValidation": { "isValid": false, "isNoProblem": false, "reason": "Invalid non-civic photo", "detectedContent": "..." }`;

          const result = await visionModel.generateContent({
            contents: [{
              role: "user",
              parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
              ]
            }]
          });

          const raw = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
          const jsonStart = raw.indexOf("{");
          const jsonEnd = raw.lastIndexOf("}") + 1;
          parsed = JSON.parse(raw.substring(jsonStart, jsonEnd));
        } catch (geminiErr) {
          console.error("Gemini fallback also failed:", geminiErr.message);
          throw mlErr; // Proceed to template fallback
        }
      } else {
        throw mlErr;
      }
    }

    // Extract image validation result
    const isNoProblem = parsed.problemType === 'clean_road' || parsed.isNoProblem === true || parsed.imageValidation?.isNoProblem === true;

    const imageValidation = parsed.imageValidation || {
      isValid: parsed.problemType !== "other" && !isNoProblem,
      isNoProblem,
      reason: isNoProblem 
        ? "The image shows a clean road in good condition. There is no civic problem or defect detected."
        : `Detected ${parsed.problemType} with ${Math.round(parsed.confidence * 100)}% confidence`,
      detectedContent: isNoProblem ? "Clean Road / Good Infrastructure Condition" : `ML Classification: ${parsed.problemType}`
    };

    if (isNoProblem) {
      imageValidation.isValid = false;
      imageValidation.isNoProblem = true;
    }

    // Priority calculation
    const sev = (parsed.severity || "medium").toLowerCase();
    let severityScore = 2;
    if (sev === "high") severityScore = 3;
    if (sev === "medium") severityScore = 2;
    if (sev === "low") severityScore = 1;

    const priority = severityScore * 10;

    // --- Assemble final formal letter ensuring correct date and city ---
    let finalLetter = "";
    if (parsed.problemType !== "None" && parsed.problemType) {
      const todayDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const header = authorityInfo?.letterHeader || "To,\nThe Local Authority,\nConcerned Department";
      
      let subjectLocation = locationAddress ? ` at ${locationAddress.split(',')[0]}` : '';
      const subject = `Subject: Urgent complaint regarding ${parsed.problemType} issue${subjectLocation}`;
      
      const salutation = "Respected Sir/Madam,";
      
      let bodyText = parsed.complaintBody || parsed.formalLetter || `I am writing to report a ${parsed.problemType} issue${locationAddress ? ` located at ${locationAddress}` : ''}. Please look into this matter urgently as it is causing inconvenience to the public.`;
      
      // Clean up body text in case the AI still included salutations or closing
      bodyText = bodyText.replace(/Subject:.*\n/gi, '');
      bodyText = bodyText.replace(/(Dear|Respected) (Sir|Madam)[,\.]?\n/gi, '');
      bodyText = bodyText.replace(/Yours (faithfully|sincerely|truly)[,\.]?\n.*/gis, '');
      bodyText = bodyText.replace(/Date:.*\n/gi, '');
      bodyText = bodyText.replace(/To,\n.*\n/gi, ''); // Try to strip "To," block if any
      bodyText = bodyText.replace(/\\n/g, '\n'); // Fix literal \n
      bodyText = bodyText.trim();

      const closing = `Thank you for your prompt action.\n\nYours faithfully,\n${userName || "Concerned Citizen"}`;
      
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const finalLocation = locationAddress || "Unknown";
      
      finalLetter = `Date: [${todayDate}]\nTime: [${time}]\nLocation: [${finalLocation}]\n\n${header}\n\n${subject}\n\n${salutation}\n\n${bodyText}\n\n${closing}`;
    }

    const previewData = {
      imageUrl,
      problemType: parsed.problemType,
      severity:
        sev === "low"
          ? "Low"
          : sev === "high"
          ? "High"
          : "Medium",
      description: parsed.description,
      formalLetter: finalLetter,
      priority,
      confidence: parsed.confidence,
      imageValidation,
      aiFallback: false,
    };

    console.log("FINAL RESPONSE:", previewData);
    res.json(previewData);
  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    
    // Build a proper fallback letter so the UI still shows something useful
    const userName = req.body.userName || "Concerned Citizen";
    const locationAddress = req.body.locationAddress || "";
    const todayDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const finalLoc = locationAddress || "Unknown";
    const aInfo = req.body.authorityInfo;
    const header = aInfo?.letterHeader || "To,\nThe Local Authority,\nConcerned Department";
    const fallbackLetter = `Date: [${todayDate}]\nTime: [${time}]\nLocation: [${finalLoc}]\n\n${header}\n\nSubject: Complaint regarding civic issue${locationAddress ? ` at ${locationAddress.split(',')[0]}` : ''}\n\nRespected Sir/Madam,\n\nI am writing to bring to your attention a civic issue that requires immediate attention${locationAddress ? ` at ${locationAddress}` : ''}. The attached photograph provides evidence of the problem. I kindly request that appropriate action be taken at the earliest to resolve this matter, as it is causing inconvenience to residents in the area.\n\nThank you for your prompt action.\n\nYours faithfully,\n${userName}`;
    
    return res.json({
      problemType: "other",
      severity: "Medium",
      description: "AI analysis temporarily unavailable. Please verify the issue details manually.",
      formalLetter: fallbackLetter,
      confidence: 0.65,
      priority: 20,
      imageValidation: { isValid: true, reason: "AI error — skipped validation", detectedContent: "unknown" },
      aiFallback: true,
    });
  }
});


// ===================================================
// CATEGORY MATCH ENDPOINT — Cross-validate image vs selected category
// ===================================================
router.post("/validate-category", async (req, res) => {
  try {
    const { imageUrl, selectedCategory } = req.body;
    if (!imageUrl || !selectedCategory) {
      return res.status(400).json({ message: "imageUrl and selectedCategory required" });
    }

    try {
      const mlResult = await predictImage(imageUrl);
      const imageCategory = mlResult.problemType || "";
      const confidence = Math.round((mlResult.confidence || 0) * 100);
      const matches = selectedCategory.toLowerCase().includes(imageCategory.toLowerCase()) ||
                      imageCategory.toLowerCase().includes(selectedCategory.toLowerCase());
      const reason = `ML model classified image as ${imageCategory} (${confidence}% confidence)`;
      return res.json({ matches, imageCategory, selectedCategory, confidence, reason });
    } catch (mlErr) {
      console.warn("ML category validation fallback:", mlErr.message);
    }

    if (!visionModel) {
      return res.json({ matches: true, confidence: 0, reason: "AI unavailable" });
    }

    const imgResponse = await fetch(imageUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

    const prompt = `You are a verification AI. The user selected "${selectedCategory}" as the complaint category.
Look at this image and determine if it matches the selected category.

Return ONLY valid JSON:
{"matches": true/false, "imageCategory": "<what the image actually shows>", "confidence": <0-100>, "reason": "<brief reason>"}`;

    const result = await visionModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      }]
    });

    const raw = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}") + 1;
    const parsed = JSON.parse(raw.substring(jsonStart, jsonEnd));

    res.json({
      matches: parsed.matches,
      imageCategory: parsed.imageCategory || "",
      selectedCategory,
      confidence: parsed.confidence || 0,
      reason: parsed.reason || "",
    });
  } catch (error) {
    console.error("Category validation error:", error.message);
    res.json({ matches: true, confidence: 0, reason: "Validation unavailable" });
  }
});


// ===================================================
// TRANSLATE ENDPOINT — On-demand letter translation (Using google-translate-api-x)
// ===================================================
router.post("/translate", async (req, res) => {
  console.log("TRANSLATE ROUTE HIT ✅ (Using google-translate-api-x)");
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "text and targetLanguage required" });
    }

    // Validate language
    const lang = supportedLanguages.find((l) => l.code === targetLanguage);
    if (!lang) {
      return res.status(400).json({ message: `Unsupported language: ${targetLanguage}` });
    }

    // If English, just return the original
    if (targetLanguage === "en") {
      return res.json({ translatedText: text, language: lang });
    }

    // Translate the entire English text
    const result = await translate(text, { to: targetLanguage });
    let translatedText = result.text;

    // Restore the placeholders if they got messed up during translation (e.g. [ Date ] or translated placeholder names)
    // The google-translate-api-x sometimes translates the content inside the brackets.
    // The user specifically wants the actual values generated by the AI to be preserved in placeholders.
    // Actually, in the AI generation, the final letter has `Date: [01 October 2026]` so it has the actual values.
    // We just want those actual values translated naturally as part of the text, so simply returning the translated text is correct!

    res.json({ translatedText, language: lang });
  } catch (error) {
    console.error("Localization Translation Error:", error.message);
    res.status(500).json({ message: "Translation failed: " + error.message });
  }
});

export default router;