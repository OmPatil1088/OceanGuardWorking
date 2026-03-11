// api/chat.js
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function disasterLogic(message) {
  message = message.toLowerCase();
  if (message.includes("earthquake")) return "⚠️ During an earthquake: Drop, Cover, and Hold.";
  if (message.includes("flood")) return "🌊 Flood Alert: Move to higher ground immediately.";
  if (message.includes("cyclone")) return "🌀 Cyclone Safety: Stay indoors, secure loose objects.";
  if (message.includes("fire")) return "🔥 Fire Emergency: Evacuate immediately.";
  if (message.includes("hello") || message.includes("hi")) return "Hello 👋 I am Ocean Guard Assistant. How can I help you today?";
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Check local disaster responses first
    const localReply = disasterLogic(message);
    if (localReply) return res.status(200).json({ reply: localReply });

    // Otherwise call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Ocean Guard Assistant. Provide disaster safety advice, ocean hazards, earthquakes, floods, cyclones, and emergency guidance.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "⚠️ AI service temporarily unavailable." });
  }
}