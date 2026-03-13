export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Normalize user text
    const text = message.toLowerCase().trim();

    // Time-based greeting
    const hour = new Date().getHours();
    let greeting = "Hello";

    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    else greeting = "Good evening";

    // Greeting detection (handles many variations)
    const greetings = ["hi", "hii", "hiii", "hello", "hey", "helo", "helllo", "hlo"];

    if (greetings.some(g => text.startsWith(g))) {
      return res.status(200).json({
        reply: `${greeting}! 👋 I'm DisasterWatch AI. Ask me about disasters or safety tips anytime.`
      });
    }

    // Who are you
    if (text.includes("who are you")) {
      return res.status(200).json({
        reply: `I'm DisasterWatch AI 🌍 — your quick guide for disaster alerts and safety tips.`
      });
    }

    // What can you do
    if (text.includes("what can you do")) {
      return res.status(200).json({
        reply: `I help with earthquake, flood, storm, and tsunami safety ⚠️. Just ask!`
      });
    }

    // How are you
    if (text.includes("how are you")) {
      return res.status(200).json({
        reply: `Running smoothly ⚡ Ready to help you stay safe from disasters.`
      });
    }

    // Thanks detection
    if (text.includes("thank")) {
      return res.status(200).json({
        reply: `You're welcome! 😊 Stay safe and feel free to ask anytime.`
      });
    }

    // Call AI through OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ocean-guard-working.vercel.app",
        "X-Title": "DisasterWatch AI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
            You are DisasterWatch AI.

Rules:
- Give short answers (1–2 sentences).
- Help with disaster safety like earthquakes, floods, storms, and tsunamis.
- Be friendly and clear.
`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.6,
        max_tokens: 70,
      })
    });

    const data = await response.json();

    console.log("OpenRouter response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter API error"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });

  } catch (error) {

    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });

  }

}