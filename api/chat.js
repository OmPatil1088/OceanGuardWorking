import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const { message } = req.body || {};

if (!message) {
return res.status(400).json({ reply: "Message required" });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash"
});

const result = await model.generateContent({
contents: [{ role: "user", parts: [{ text: message }] }]
});

const response = result.response;

res.status(200).json({
reply: response.text()
});

} catch (error) {

console.error("Gemini Error:", error);

res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}