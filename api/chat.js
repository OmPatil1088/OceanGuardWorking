export default async function handler(req, res) {

  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    // Safely parse body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ocean-guard-working.vercel.app",
        "X-Title": "OceanGuard AI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are OceanGuard AI, a disaster safety assistant helping people with tsunami alerts, flood warnings, earthquake safety, and emergency preparation."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();

    // Debug log for Vercel
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