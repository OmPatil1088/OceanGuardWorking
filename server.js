const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

/* ==============================
   Middleware
============================== */
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
    next();
});

/* ==============================
   MongoDB Connection
============================== */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/oceanguard";

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

/* ==============================
   Incident Schema
============================== */
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

/* ==============================
   User Schema
============================== */
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

/* ==============================
   Password Hashing
============================== */
function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }

    const hash = crypto
        .pbkdf2Sync(password, salt, 310000, 32, 'sha256')
        .toString('hex');

    return { salt, hash };
}

/* ==============================
   Routes
============================== */

// Register
app.post('/api/register', async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const { salt, hash } = hashPassword(password);

        const user = new User({
            email,
            passwordHash: hash,
            salt
        });

        await user.save();

        res.status(201).json({
            email: user.email,
            createdAt: user.createdAt
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {

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

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

// Get all incidents
app.get('/api/incidents', async (req, res) => {
    try {

        const incidents = await Incident.find()
            .sort({ createdAt: -1 });

        res.json(incidents);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

// Create incident (Submit Report button uses this)
app.post('/api/incidents', async (req, res) => {
    try {

        const incidentData = { ...req.body };

        if (!incidentData.caseId) {
            incidentData.caseId = `DS-${Date.now()}`;
        }

        const incident = new Incident(incidentData);

        await incident.save();

        res.status(201).json(incident);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create incident" });
    }
});

// Delete incident
app.delete('/api/incidents/:id', async (req, res) => {
    try {

        const { id } = req.params;

        await Incident.findByIdAndDelete(id);

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete incident" });
    }
});

/* ==============================
   Server Start
============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});