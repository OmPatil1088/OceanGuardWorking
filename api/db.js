import crypto from 'crypto';
import mongoose from 'mongoose';

const { MONGO_URI } = process.env;

// Leave configuration validation until runtime so the function can return a proper error
// instead of crashing during module initialization.

// Mongoose connection caching (important for serverless environments)
const globalAny = global;

if (!globalAny._hazardwatch_mongoose) {
    globalAny._hazardwatch_mongoose = {
        conn: null,
        promise: null
    };
}

const cached = globalAny._hazardwatch_mongoose;

export async function connect() {
    if (!MONGO_URI) {
        throw new Error('Missing required environment variable: MONGO_URI');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

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

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Incident = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);

export function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto
        .pbkdf2Sync(password, salt, 310000, 32, 'sha256')
        .toString('hex');
    return { salt, hash };
}
