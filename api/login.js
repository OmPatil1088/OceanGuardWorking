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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { hash } = hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        return res.status(200).json({ email: user.email });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
