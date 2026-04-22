/**
 * Stub Route Files - Incident, Alert, Resource, Community, Analytics, Admin, Weather
 * These are templates to be expanded with full implementation
 */

const express = require('express');
const errorHandler = require('../middleware/errorHandler');
const VISION_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 9000);
const VISION_MAX_RETRIES = Number(process.env.OPENROUTER_MAX_RETRIES || 2);

const HAZARD_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Storm', 'Accident', 'Other'];
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
      if (attempt === retries) throw error;
    }

    await sleep(350 * (attempt + 1));
  }

  throw lastError || new Error('Vision request failed');
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

  Object.entries(HAZARD_KEYWORDS).forEach(([type, keywords]) => {
    const score = keywords.reduce((acc, keyword) => (input.includes(keyword) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  });

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

  let verificationStatus = 'needs_review';
  if (authenticityScore >= 78) verificationStatus = 'verified';
  if (authenticityScore < 45) verificationStatus = 'rejected';

  return {
    detectedHazard,
    detectionConfidence: clamp(Math.round((0.45 + (textDetection.score * 0.1) + (typeMatches ? 0.2 : 0)) * 100) / 100, 0.1, 0.95),
    authenticityScore,
    isLikelyReal: authenticityScore >= 60,
    verificationStatus,
    manualReviewRequired: verificationStatus !== 'verified',
    source: 'heuristic',
    reason: hasImage
      ? 'Heuristic verification completed from report text and image metadata.'
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

function cleanJsonString(text) {
  if (!text) return '';
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

async function runVisionVerification({ reportedType, description, mediaProof }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const imageDataUrl = mediaProof?.dataUrl;

  if (!apiKey || !imageDataUrl || !String(mediaProof?.fileType || '').startsWith('image/')) {
    return null;
  }

  const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.0-flash-exp:free';
  const prompt = `Analyze this disaster evidence image and classify the hazard.
Return strict JSON only with keys:
detectedHazard (one of ${HAZARD_TYPES.join(', ')}),
detectionConfidence (0 to 1),
authenticityScore (0 to 100),
isLikelyReal (boolean),
verificationStatus (verified|needs_review|rejected),
reason (short string).
Reported hazard type: ${normalizeHazard(reportedType)}
Report description: ${description || ''}`;

  const { response, attemptCount } = await fetchWithRetries(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:5000',
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

/**
 * Incident Routes - /api/incidents
 */
const incidentRouter = express.Router();
incidentRouter.post('/', (req, res) => {
  res.json({ success: true, message: 'Create incident - to be implemented' });
});
incidentRouter.get('/', (req, res) => {
  res.json({ success: true, message: 'Get incidents - to be implemented' });
});
incidentRouter.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get incident details - to be implemented' });
});
incidentRouter.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update incident - to be implemented' });
});
incidentRouter.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete incident - to be implemented' });
});

/**
 * Alert Routes - /api/alerts
 */
const alertRouter = express.Router();
alertRouter.post('/', (req, res) => {
  res.json({ success: true, message: 'Create alert - to be implemented' });
});
alertRouter.get('/', (req, res) => {
  res.json({ success: true, message: 'Get alerts - to be implemented' });
});
alertRouter.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get alert details - to be implemented' });
});
alertRouter.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update alert - to be implemented' });
});
alertRouter.post('/:id/send', (req, res) => {
  res.json({ success: true, message: 'Send alert - to be implemented' });
});

/**
 * Resource Routes - /api/resources
 */
const resourceRouter = express.Router();
resourceRouter.post('/', (req, res) => {
  res.json({ success: true, message: 'Create resource - to be implemented' });
});
resourceRouter.get('/', (req, res) => {
  res.json({ success: true, message: 'Get resources - to be implemented' });
});
resourceRouter.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get resource details - to be implemented' });
});
resourceRouter.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update resource - to be implemented' });
});
resourceRouter.post('/:id/allocate', (req, res) => {
  res.json({ success: true, message: 'Allocate resource - to be implemented' });
});

/**
 * Community Routes - /api/community
 */
const communityRouter = express.Router();
communityRouter.get('/reports', (req, res) => {
  res.json({ success: true, message: 'Get community reports - to be implemented' });
});
communityRouter.post('/reports', (req, res) => {
  res.json({ success: true, message: 'Submit community report - to be implemented' });
});
communityRouter.post('/verify', (req, res) => {
  res.json({ success: true, message: 'Verify incident - to be implemented' });
});
communityRouter.get('/feed', (req, res) => {
  res.json({ success: true, message: 'Get community feed - to be implemented' });
});

/**
 * Analytics Routes - /api/analytics
 */
const analyticsRouter = express.Router();
analyticsRouter.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Get dashboard metrics - to be implemented' });
});
analyticsRouter.get('/incidents', (req, res) => {
  res.json({ success: true, message: 'Get incident statistics - to be implemented' });
});
analyticsRouter.get('/responses', (req, res) => {
  res.json({ success: true, message: 'Get response metrics - to be implemented' });
});
analyticsRouter.get('/resources', (req, res) => {
  res.json({ success: true, message: 'Get resource utilization - to be implemented' });
});

/**
 * Admin Routes - /api/admin
 */
const adminRouter = express.Router();
adminRouter.get('/users', (req, res) => {
  res.json({ success: true, message: 'Get all users - to be implemented' });
});
adminRouter.get('/audit', (req, res) => {
  res.json({ success: true, message: 'Get audit logs - to be implemented' });
});
adminRouter.put('/settings', (req, res) => {
  res.json({ success: true, message: 'Update system settings - to be implemented' });
});
adminRouter.get('/health', (req, res) => {
  res.json({ success: true, message: 'Get system health - to be implemented' });
});

/**
 * Weather Routes - /api/weather
 */
const weatherRouter = express.Router();
weatherRouter.get('/current', (req, res) => {
  res.json({ success: true, message: 'Get current weather - to be implemented' });
});
weatherRouter.get('/forecast', (req, res) => {
  res.json({ success: true, message: 'Get weather forecast - to be implemented' });
});
weatherRouter.get('/alerts', (req, res) => {
  res.json({ success: true, message: 'Get weather alerts - to be implemented' });
});

/**
 * News Routes - /api/news
 */
const newsRouter = express.Router();
newsRouter.get('/', async (req, res) => {
  const fallbackArticles = [
    {
      title: 'Preparedness Update: Keep emergency kits ready before monsoon season.',
      publishedAt: new Date().toISOString()
    },
    {
      title: 'Safety Advisory: Follow official evacuation guidance during severe weather alerts.',
      publishedAt: new Date().toISOString()
    },
    {
      title: 'Community Alert: Verify local shelters and emergency contacts in advance.',
      publishedAt: new Date().toISOString()
    }
  ];

  try {
    const apiKey = process.env.GNEWS_API_KEY || process.env.GNEWS_TOKEN;
    if (!apiKey) {
      return res.status(200).json({
        articles: fallbackArticles,
        source: 'fallback',
        reason: 'GNews API key not configured'
      });
    }

    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.set('q', 'disaster OR flood OR cyclone OR earthquake');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('country', 'in');
    url.searchParams.set('max', '6');
    url.searchParams.set('sortby', 'publishedAt');
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(200).json({
        articles: fallbackArticles,
        source: 'fallback',
        reason: `GNews upstream error ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json({
      articles: Array.isArray(data.articles) ? data.articles : fallbackArticles,
      source: 'gnews'
    });
  } catch (error) {
    return res.status(200).json({
      articles: fallbackArticles,
      source: 'fallback',
      reason: 'Failed to fetch live news'
    });
  }
});

/**
 * AI Verification Routes - /api/ai
 */
const aiRouter = express.Router();
aiRouter.post('/verify-hazard', async (req, res) => {
  try {
    const { reportedType, description, mediaProof } = req.body || {};

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
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

module.exports = {
  incidents: incidentRouter,
  alerts: alertRouter,
  resources: resourceRouter,
  community: communityRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
  weather: weatherRouter,
  news: newsRouter,
  ai: aiRouter
};
