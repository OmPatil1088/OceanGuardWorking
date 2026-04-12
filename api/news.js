export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Use the valid GNews API token
        const API_TOKEN = '659d783d93126a02c93e3fdca350a350';
        const API_URL = `https://gnews.io/api/v4/search?q=disaster%20OR%20flood%20OR%20cyclone%20OR%20earthquake%20OR%20emergency&lang=en&country=in&max=10&sortby=publishedAt&token=${API_TOKEN}`;
        
        console.log('🔄 [Backend] Proxying GNews API request...');
        
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DisasterWatch/1.0'
            }
        });

        if (!response.ok) {
            console.error(`❌ [Backend] GNews API error: ${response.status}`);
            
            if (response.status === 401) {
                return res.status(401).json({ 
                    error: 'Invalid API token',
                    articles: [] 
                });
            } else if (response.status === 429) {
                return res.status(429).json({ 
                    error: 'Rate limit exceeded. Try again in a few moments.',
                    articles: [],
                    retryAfter: response.headers.get('Retry-After') || '60'
                });
            }
            
            return res.status(response.status).json({ 
                error: `GNews API error: ${response.status}`,
                articles: [] 
            });
        }

        const data = await response.json();
        
        console.log(`✅ [Backend] GNews API returned ${data.articles?.length || 0} articles`);
        
        // Return the data with proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour on Vercel
        
        return res.status(200).json({
            success: true,
            articles: data.articles || [],
            totalArticles: data.totalArticles,
            sourcedFrom: 'GNews',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [Backend] Failed to fetch from GNews:', error.message);
        
        return res.status(500).json({ 
            error: `Server error: ${error.message}`,
            articles: [],
            sourcedFrom: 'Error'
        });
    }
}