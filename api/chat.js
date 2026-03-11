import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

try {

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash"
});

const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

const message = body.message;

const result = await model.generateContent(
`You are a disaster safety assistant. Answer briefly.

User: ${message}`
);

const reply = result.response.text();

res.status(200).json({ reply });

} catch (error) {

console.error("Gemini error:", error);

res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}