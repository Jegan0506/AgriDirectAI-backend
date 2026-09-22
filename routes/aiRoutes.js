const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/* =========================================================
   AI FORECAST
========================================================= */
router.post("/forecast", async (req, res) => {
  try {
    const { crop, quantity, quality, harvestDate, location, expectedPrice } = req.body;

    if (!crop || !quantity || !quality || !harvestDate || !location || !expectedPrice) {
      return res.status(400).json({
        success: false,
        message: "All crop details are required"
      });
    }

    const prompt = `
You are AgriDirect AI, an agricultural market decision-support assistant.

Analyze this farmer's produce:

Crop: ${crop}
Quantity: ${quantity} kg
Quality: ${quality}
Harvest Date: ${harvestDate}
Location: ${location}
Farmer Expected Price: ₹${expectedPrice}/kg

Give a practical selling recommendation.

Return ONLY valid JSON:

{
  "predictedPrice": 0,
  "recommendedPrice": 0,
  "demand": "HIGH",
  "recommendation": "SELL NOW",
  "confidence": 0,
  "reason": "short explanation",
  "action": "short practical action"
}

Rules:
- predictedPrice: INR per kg number
- recommendedPrice: INR per kg number
- demand: HIGH, MEDIUM, or LOW
- recommendation: SELL NOW, WAIT, or NEGOTIATE
- confidence: number from 0 to 100
- reason: short
- action: short and practical
- Do not use markdown
- Do not add text outside JSON
- This is an AI estimate, not a live market price
`;

    console.log("🤖 Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt
    });

    const text = response.text.trim();
    console.log("🤖 Gemini response received");
    console.log("AI RAW RESPONSE:", text);

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const forecast = JSON.parse(cleanedText);

    res.json({
      success: true,
      forecast
    });
  } catch (error) {
    console.log("AI Forecast error:", error.message || error);

    if (
      error.message &&
      (error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED"))
    ) {
      return res.status(429).json({
        success: false,
        message: "AI quota exceeded. Please try again later."
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "AI forecast failed"
    });
  }
});

module.exports = router;
