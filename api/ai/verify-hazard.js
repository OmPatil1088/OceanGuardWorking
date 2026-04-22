const HAZARD_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Storm', 'Accident', 'Other'];
const VISION_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 9000);
const VISION_MAX_RETRIES = Number(process.env.OPENROUTER_MAX_RETRIES || 2);

const HAZARD_KEYWORDS = {
    Flood: ['flood', 'water level', 'submerged', 'overflow', 'inundation', 'heavy rain'],
    Fire: ['fire', 'flame', 'smoke', 'burning', 'wildfire', 'explosion'],
    Earthquake: ['earthquake', 'tremor', 'quake', 'collapsed', 'aftershock'],
    Landslide: ['landslide', 'mudslide', 'debris flow', 'slope failure', 'hill collapse'],
    Storm: ['storm', 'cyclone', 'hurricane', 'thunderstorm', 'high wind', 'lightning'],
    Accident: ['accident', 'collision', 'crash', 'injury', 'vehicle', 'road block']
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(url, options, retries = VISION_MAX_RETRIES, timeoutMs = VISION_TIMEOUT_MS) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok || response.status < 500 || attempt === retries) {
                return { response, attemptCount: attempt + 1 };
            }

            lastError = new Error(`Upstream returned ${response.status}`);
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
            if (attempt === retries) {
                throw error;
            }
        }

        await sleep(350 * (attempt + 1));
    }

    throw lastError || new Error('Vision request failed');
}

function cleanJsonString(text) {
    if (!text) return '';
    return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
}

function normalizeHazard(value) {
    if (!value || typeof value !== 'string') return 'Other';
    const normalized = value.trim().toLowerCase();
    const match = HAZARD_TYPES.find((type) => type.toLowerCase() === normalized);
    return match || 'Other';
}

function detectHazardFromText(text) {
    const input = String(text || '').toLowerCase();
    let bestType = 'Other';
    let bestScore = 0;

    for (const [type, keywords] of Object.entries(HAZARD_KEYWORDS)) {
        const score = keywords.reduce((acc, keyword) => (input.includes(keyword) ? acc + 1 : acc), 0);
        if (score > bestScore) {
            bestScore = score;
            bestType = type;
        }
    }

    return { type: bestType, score: bestScore };
}

function buildHeuristicResult({ reportedType, description, mediaProof }) {
    const normalizedReportedType = normalizeHazard(reportedType);
    const mediaType = mediaProof?.fileType || '';
    const hasImage = typeof mediaType === 'string' && mediaType.startsWith('image/');
    const textDetection = detectHazardFromText(description);
    const detectedHazard = textDetection.type !== 'Other' ? textDetection.type : normalizedReportedType;
    const typeMatches = normalizeHazard(detectedHazard) === normalizedReportedType;

    let authenticityScore = hasImage ? 55 : 35;
    if (typeMatches) authenticityScore += 18;
    authenticityScore += clamp(textDetection.score * 8, 0, 20);

    if (!hasImage) authenticityScore -= 20;

    authenticityScore = clamp(Math.round(authenticityScore), 5, 99);
    const detectionConfidence = clamp(
        Math.round((0.45 + (textDetection.score * 0.1) + (typeMatches ? 0.2 : 0)) * 100) / 100,
        0.1,
        0.95
    );

    let verificationStatus = 'needs_review';
    if (authenticityScore >= 78) verificationStatus = 'verified';
    if (authenticityScore < 45) verificationStatus = 'rejected';

    return {
        detectedHazard,
        detectionConfidence,
        authenticityScore,
        isLikelyReal: authenticityScore >= 60,
        verificationStatus,
        manualReviewRequired: verificationStatus !== 'verified',
        source: 'heuristic',
        reason: hasImage
            ? 'Heuristic verification completed from report text and uploaded image metadata.'
            : 'No image media found. Verification downgraded and marked for review.',
        signals: {
            reportedType: normalizedReportedType,
            typeMatches,
            textKeywordScore: textDetection.score,
            mediaType: mediaType || 'unknown'
        },
        verifiedAt: new Date().toISOString()
    };
}

async function runVisionVerification({ reportedType, description, mediaProof }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const imageDataUrl = mediaProof?.dataUrl;

    if (!apiKey || !imageDataUrl || !String(mediaProof?.fileType || '').startsWith('image/')) {
        return null;
    }

    const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.0-flash-exp:free';
    const reported = normalizeHazard(reportedType);
    const prompt = `Analyze this disaster evidence image and classify the hazard.
Return strict JSON only with keys:
detectedHazard (one of ${HAZARD_TYPES.join(', ')}),
detectionConfidence (0 to 1),
authenticityScore (0 to 100),
isLikelyReal (boolean),
verificationStatus (verified|needs_review|rejected),
reason (short string).
Reported hazard type: ${reported}
Report description: ${description || ''}`;

    const { response, attemptCount } = await fetchWithRetries(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.APP_BASE_URL || 'https://ocean-guard-working.vercel.app',
                'X-Title': 'OceanGuard Hazard Verification'
            },
            body: JSON.stringify({
                model,
                temperature: 0.1,
                max_tokens: 300,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You are a disaster image verification assistant. Always return strict JSON only.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageDataUrl } }
                        ]
                    }
                ]
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Vision model request failed: ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(cleanJsonString(raw));

    return {
        detectedHazard: normalizeHazard(parsed?.detectedHazard),
        detectionConfidence: clamp(Number(parsed?.detectionConfidence || 0.5), 0, 1),
        authenticityScore: clamp(Math.round(Number(parsed?.authenticityScore || 50)), 0, 100),
        isLikelyReal: Boolean(parsed?.isLikelyReal),
        verificationStatus: ['verified', 'needs_review', 'rejected'].includes(parsed?.verificationStatus)
            ? parsed.verificationStatus
            : 'needs_review',
        manualReviewRequired: parsed?.verificationStatus !== 'verified',
        reason: String(parsed?.reason || 'Vision model verification completed.'),
        source: `openrouter:${model}`,
        retryCount: attemptCount,
        verifiedAt: new Date().toISOString()
    };
}

function mergeVerification(heuristic, vision) {
    if (!vision) return heuristic;

    const combinedScore = Math.round((heuristic.authenticityScore * 0.35) + (vision.authenticityScore * 0.65));
    const combinedConfidence = clamp(
        Math.round(((heuristic.detectionConfidence * 0.3) + (vision.detectionConfidence * 0.7)) * 100) / 100,
        0,
        1
    );

    let verificationStatus = vision.verificationStatus;
    if (combinedScore < 45) verificationStatus = 'rejected';
    else if (combinedScore >= 78) verificationStatus = 'verified';
    else verificationStatus = 'needs_review';

    return {
        detectedHazard: vision.detectedHazard || heuristic.detectedHazard,
        detectionConfidence: combinedConfidence,
        authenticityScore: combinedScore,
        isLikelyReal: combinedScore >= 60,
        verificationStatus,
        manualReviewRequired: verificationStatus !== 'verified',
        source: 'vision+heuristic',
        reason: `${vision.reason} Heuristic consistency checks were also applied.`,
        signals: heuristic.signals,
        retryCount: vision.retryCount || 1,
        verifiedAt: new Date().toISOString()
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const reportedType = body?.reportedType;
        const description = body?.description || '';
        const mediaProof = body?.mediaProof;

        if (!mediaProof?.dataUrl || !mediaProof?.fileType) {
            return res.status(400).json({ error: 'mediaProof with dataUrl and fileType is required' });
        }

        const heuristic = buildHeuristicResult({ reportedType, description, mediaProof });

        let vision = null;
        let degradedMode = false;
        try {
            vision = await runVisionVerification({ reportedType, description, mediaProof });
        } catch (visionError) {
            console.warn('Vision verification fallback:', visionError.message);
            degradedMode = true;
        }

        const verification = mergeVerification(heuristic, vision);
        if (degradedMode) {
            verification.manualReviewRequired = true;
            verification.reason = `${verification.reason} Vision model unavailable; report routed to manual review.`;
            verification.source = `${verification.source}+degraded`;
        }
        return res.status(200).json(verification);
    } catch (error) {
        console.error('AI verification error:', error);
        return res.status(500).json({ error: error.message || 'Verification failed' });
    }
}
