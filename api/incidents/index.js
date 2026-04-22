import { connect, Incident } from '../db.js';

function buildServerFallbackVerification(type) {
    return {
        detectedHazard: type || 'Other',
        detectionConfidence: 0.5,
        authenticityScore: 50,
        isLikelyReal: true,
        verificationStatus: 'needs_review',
        manualReviewRequired: true,
        source: 'server-fallback',
        reason: 'AI verification missing or unavailable. Report accepted and routed to manual review.',
        verifiedAt: new Date()
    };
}

export default async function handler(req, res) {
    try {
        await connect();

        if (req.method === 'GET') {
            const incidents = await Incident.find().sort({ createdAt: -1 });
            return res.status(200).json(incidents);
        }

        if (req.method === 'POST') {
            const incidentData = { ...req.body };

            if (!incidentData.mediaProof || !incidentData.mediaProof.dataUrl) {
                return res.status(400).json({ error: 'Media proof is required' });
            }

            if (!incidentData.aiVerification || !incidentData.aiVerification.verificationStatus) {
                incidentData.aiVerification = buildServerFallbackVerification(incidentData.type);
            }

            if (incidentData.aiVerification.verificationStatus === 'rejected') {
                incidentData.aiVerification.verificationStatus = 'needs_review';
                incidentData.aiVerification.manualReviewRequired = true;
                incidentData.aiVerification.reason = `${incidentData.aiVerification.reason || 'Low authenticity from AI.'} Escalated for manual review instead of auto-rejection.`;
            }

            if (incidentData.aiVerification.verificationStatus !== 'verified') {
                incidentData.aiVerification.manualReviewRequired = true;
            }

            if (!incidentData.caseId) {
                incidentData.caseId = `DS-${Date.now()}`;
            }

            const incident = new Incident(incidentData);
            await incident.save();
            return res.status(201).json(incident);
        }
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
}
