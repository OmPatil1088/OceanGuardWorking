export default async function handler(req, res) {
    try {
        const apiKey = process.env.GNEWS_API_KEY || process.env.GNEWS_TOKEN;
        if (!apiKey) {
            return res.status(503).json({
                error: "GNews API key is not configured",
                code: "MISSING_GNEWS_API_KEY"
            });
        }

        const url = new URL("https://gnews.io/api/v4/search");
        url.searchParams.set("q", "disaster OR flood OR cyclone OR earthquake");
        url.searchParams.set("lang", "en");
        url.searchParams.set("country", "in");
        url.searchParams.set("max", "6");
        url.searchParams.set("sortby", "publishedAt");
        url.searchParams.set("token", apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorBody = await response.text();
            return res.status(response.status).json({
                error: "GNews upstream request failed",
                status: response.status,
                details: errorBody.slice(0, 300)
            });
        }

        const data = await response.json();

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news" });
    }
}