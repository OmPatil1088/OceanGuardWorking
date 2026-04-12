// ========================================
// Chat API with Optimization
// ========================================

// Simple in-memory cache for API responses
const responseCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Quick response patterns (no API call needed)
const quickResponses = {
    greets: ["hi", "hii", "hiii", "hello", "hey", "helo", "helllo", "hlo"],
    identity: ["who are you", "what is your name"],
    capabilities: ["what can you do", "what do you do"],
    status: ["how are you", "how are you doing"],
    thanks: ["thank", "thanks", "thankyou", "thank you"]
};

export default async function handler(req, res) {
    // Method validation
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Parse request body
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const message = body?.message?.trim();

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Check cache first
        const cached = getFromCache(message);
        if (cached) {
            console.log("📦 Returning cached response");
            return res.status(200).json({ reply: cached });
        }

        // Normalize text
        const text = message.toLowerCase().trim();

        // Get time-based greeting
        const greeting = getTimeBasedGreeting();

        // Check quick response patterns
        const quickReply = checkQuickResponses(text, greeting);
        if (quickReply) {
            saveToCache(message, quickReply);
            return res.status(200).json({ reply: quickReply });
        }

        // Call external AI API with timeout
        const reply = await getAIResponse(message);

        if (!reply) {
            return res.status(500).json({ error: "Failed to generate response" });
        }

        // Cache the response
        saveToCache(message, reply);

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Chat API error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error",
            type: error.name
        });
    }
}

// ========================================
// Helper Functions
// ========================================

function getTimeBasedGreeting() {
    const now = new Date();
    const hour = parseInt(
        now.toLocaleString("en-US", {
            hour: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata"
        })
    );

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function checkQuickResponses(text, greeting) {
    // Greetings
    if (quickResponses.greets.some(g => text.startsWith(g))) {
        return `${greeting}! 👋 I'm DisasterWatch AI. Ask me about disasters or safety tips.`;
    }

    // Identity
    if (quickResponses.identity.some(q => text.includes(q))) {
        return `I'm DisasterWatch AI 🌍 — your quick guide for disaster alerts and safety.`;
    }

    // Capabilities
    if (quickResponses.capabilities.some(q => text.includes(q))) {
        return `I help with earthquake, flood, storm, and tsunami safety ⚠️. Just ask!`;
    }

    // Status
    if (quickResponses.status.some(q => text.includes(q))) {
        return `Running smoothly ⚡ Ready to help you stay safe.`;
    }

    // Thanks
    if (quickResponses.thanks.some(t => text.includes(t))) {
        return `You're welcome! 😊 Stay safe and feel free to ask anytime.`;
    }

    return null;
}

async function getAIResponse(message) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        console.warn("⚠️ OPENROUTER_API_KEY not configured");
        return getDefaultResponse(message);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ocean-guard-working.vercel.app",
                "X-Title": "DisasterWatch AI"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `You are DisasterWatch AI.
Rules:
- Give short answers (1-2 sentences).
- Help with disaster safety like earthquakes, floods, storms, and tsunamis.
- Be friendly and clear.`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.6,
                max_tokens: 70
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response structure");
        }

        return data.choices[0].message.content.trim();

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("API request timeout");
        } else {
            console.error("API call failed:", error.message);
        }
        return getDefaultResponse(message);
    }
}

function getDefaultResponse(message) {
    const responses = [
        "Stay safe and keep yourself informed about local weather and alerts.",
        "For immediate emergencies, call local emergency services (112).",
        "Check official weather and disaster management websites for accurate information.",
        "Create an emergency plan and keep emergency supplies ready."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ========================================
// Caching Functions
// ========================================

function getFromCache(message) {
    const cached = responseCache.get(message);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
        responseCache.delete(message);
        return null;
    }

    return cached.reply;
}

function saveToCache(message, reply) {
    // Limit cache size to 100 entries
    if (responseCache.size > 100) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
    }

    responseCache.set(message, {
        reply,
        timestamp: Date.now()
    });
}