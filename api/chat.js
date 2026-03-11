import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

try {

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash"
});

const { message } = req.body;

const result = await model.generateContent(message);

const response = await result.response;
const text = response.text();

res.status(200).json({ reply: text });

} catch (error) {

console.error(error);

res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}