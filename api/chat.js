export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { message } = body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-project.vercel.app",
        "X-Title": "OceanGuard AI"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "You are OceanGuard AI disaster assistant helping people with tsunami alerts and safety."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    console.log("OpenRouter response:", data);

    const reply = data?.choices?.[0]?.message?.content || "No response from AI.";

    return res.status(200).json({ reply });

  } catch (error) {

    console.error("API Error:", error);

    return res.status(500).json({
      error: "Internal Server Error"
    });

  }

}