
import sys

with open("backend/routes/ai.js", "r", encoding="utf-8") as f:
    c = f.read()

start = c.find("const promptText = `You are a civic issue detection AI")
end = c.find("    // Extract JSON block", start)

if start != -1 and end != -1:
    replacement = """
    // ===================================================
    // CALL LOCAL PYTORCH MICROSERVICE
    // ===================================================
    let parsed;
    try {
      console.log("Sending image to local PyTorch Microservice at http://127.0.0.1:5001/predict");
      const mlResponse = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl })
      });
      
      if (!mlResponse.ok) {
        throw new Error("ML Service returned status " + mlResponse.status);
      }
      
      parsed = await mlResponse.json();
      console.log("PyTorch Prediction:", parsed);
      
      // Ensure expected fields exist
      parsed.confidence = parsed.confidence || 0.5;
      parsed.problemType = parsed.problemType || "other";
      parsed.severity = parsed.severity || "Medium";
      parsed.description = parsed.description || `Detected ${parsed.problemType} with ${Math.round(parsed.confidence * 100)}% confidence using custom PyTorch model.`;
      
    } catch (err) {
      console.error("? Failed to reach PyTorch Microservice:", err.message);
      throw err; // Trigger fallback
    }
"""
    c = c[:start] + replacement + c[end:]
    with open("backend/routes/ai.js", "w", encoding="utf-8") as f:
        f.write(c)
    print("Replaced")
else:
    print("Not found")

