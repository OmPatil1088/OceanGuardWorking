import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const { message } = req.body || {};

if (!message) {
return res.status(400).json({ reply: "Message missing" });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash"
});

const result = await model.generateContent(message);

const response = result.response.text();

return res.status(200).json({
reply: response
});

} catch (error) {

console.error("Gemini error:", error);

return res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}