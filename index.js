import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import crypto from 'crypto';


// ENV
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);


if (!JWT_SECRET) {
console.error('JWT_SECRET is required in env');
process.exit(1);
}


// init firebase admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
admin.initializeApp({
credential: admin.credential.cert(serviceAccount),
databaseURL: process.env.FIREBASE_DB_URL
});
const db = admin.database();


const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());


// rate limit
const limiter = rateLimit({
windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
max: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
standardHeaders: true,
legacyHeaders: false
});
app.use(limiter);


// helper: get user from Firebase
async function getUser(username) {
const snap = await db.ref(`users/${username}`).once('value');
return snap.exists() ? snap.val() : null;
}


// helper: save refresh token (hashed) in DB
async function storeRefreshToken(username, tokenHash, expiresAt) {
await db.ref(`refreshTokens/${username}`).push({ tokenHash, expiresAt });
}


async function removeExpiredRefreshTokens(username) {
const now = Date.now();
const snap = await db.ref(`refreshTokens/${username}`).once('value');
if (!snap.exists()) return;
const updates = {};
snap.forEach(child => {
const v = child.val();
if (!v.expiresAt || v.expiresAt < now) updates[child.key] = null;
});
if (Object.keys(updates).length) await db.ref(`refreshTokens/${username}`).update(updates);
}


// create access token
function createAccessToken(payload) {
return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function createRefreshToken() {
return crypto.randomBytes(40).toString('hex');
}


// AUTH middleware
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
