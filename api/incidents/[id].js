import { connect, Incident } from '../db.js';

export default async function handler(req, res) {
    try {
        await connect();

        const { id } = req.query || {};
        if (!id) {
            return res.status(400).json({ error: 'Missing incident id' });
        }

        if (req.method === 'DELETE') {
            await Incident.findByIdAndDelete(id);
            return res.status(200).json({ success: true });
        }

        if (req.method === 'GET') {
            const incident = await Incident.findById(id);
            if (!incident) {
                return res.status(404).json({ error: 'Not found' });
            }
            return res.status(200).json(incident);
        }
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
}
