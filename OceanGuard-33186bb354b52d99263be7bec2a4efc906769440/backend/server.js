const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Connection error:', err));

// Example: Incidents schema
const incidentSchema = new mongoose.Schema({
    caseId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    description: String,
    location: String,
    severity: { type: String, default: 'low' },
    status: { type: String, default: 'active' },
    reportedBy: String,
    contact: String,
    people: String,
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Incident = mongoose.model('Incident', incidentSchema);

// User schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
    return { salt, hash };
}

// Routes
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const { salt, hash } = hashPassword(password);
    const user = new User({ email, passwordHash: hash, salt });
    await user.save();

    res.status(201).json({ email: user.email, createdAt: user.createdAt });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { hash } = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ email: user.email });
});

app.get('/api/incidents', async (req, res) => {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
});

app.post('/api/incidents', async (req, res) => {
    const incidentData = { ...req.body };

    // Ensure a caseId exists (frontend may provide one)
    if (!incidentData.caseId) {
        incidentData.caseId = `DS-${Date.now()}`;
    }

    const incident = new Incident(incidentData);
    await incident.save();
    res.status(201).json(incident);
});

app.delete('/api/incidents/:id', async (req, res) => {
    const { id } = req.params;
    await Incident.findByIdAndDelete(id);
    res.json({ success: true });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});