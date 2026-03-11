import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const { message } = req.body;

if(!message){
return res.status(400).json({ reply:"No message provided"});
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
model: "gemini-2.0-flash"
});

const result = await model.generateContent(message);

const response = await result.response;
const text = response.text();

return res.status(200).json({
reply: text
});

} catch (error) {

console.error("Gemini Error:", error);

return res.status(500).json({
reply: "AI service temporarily unavailable"
});

}

}