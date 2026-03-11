import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
throw new Error("Missing Gemini API Key");
}

const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

const message = body?.message;

if (!message) {
return res.status(400).json({ reply: "No message provided" });
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash"
});

const result = await model.generateContent(message);

const response = result.response.text();

return res.status(200).json({
reply: response
});

} catch (error) {

console.error("Gemini Error:", error);

return res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}