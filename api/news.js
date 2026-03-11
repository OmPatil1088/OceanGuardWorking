export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://gnews.io/api/v4/search?q=disaster OR flood OR cyclone OR earthquake&lang=en&country=in&max=6&token=fdfb9e5b394271a3b276d5b9c8d0f00e"
        );

        const data = await response.json();

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news" });
    }
}