import { connect, User, hashPassword } from './db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        await connect();

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const { salt, hash } = hashPassword(password);
        const user = new User({ email, passwordHash: hash, salt });
        await user.save();

        return res.status(201).json({ email: user.email, createdAt: user.createdAt });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
