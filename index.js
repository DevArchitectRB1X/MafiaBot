import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import admin from 'firebase-admin';
import crypto from 'crypto';
import helmet from 'helmet';


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
app.set('trust proxy', 1);
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());

// rate limit
const limiter = rateLimit({
windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
max: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
standardHeaders: true,
legacyHeaders: false
});
app.use(limiter);


// Store refresh token hashed
async function storeRefreshToken(username, tokenHash, expiresAt) {
  await db.ref(`refreshTokens/${username}`).push({ tokenHash, expiresAt });
}

// Remove expired tokens
async function removeExpiredRefreshTokens(username) {
  const now = Date.now();
  const snap = await db.ref(`refreshTokens/${username}`).once("value");
  if (!snap.exists()) return;
  const updates = {};
  snap.forEach(child => {
    const v = child.val();
    if (!v.expiresAt || v.expiresAt < now) updates[child.key] = null;
  });
  if (Object.keys(updates).length) await db.ref(`refreshTokens/${username}`).update(updates);
}

// ======================= MIDDLEWARE JWT =======================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Nu există JWT" });
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "Token invalid" });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token invalid" });
  }
}

// Get user from Firebase
async function getUser(username) {
  const snap = await db.ref(`users/${username}`).once("value");
  return snap.exists() ? snap.val() : null;
}


// create access token
function createAccessToken(payload) {
return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function createRefreshToken() {
return crypto.randomBytes(40).toString('hex');
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = await getUser(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.PasswordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  // create access token
  const accessToken = createAccessToken({ username });

  // create refresh token
  const refreshToken = createRefreshToken();
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

  // store hashed refresh token in Firebase
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await storeRefreshToken(username, tokenHash, expiresAt);

  res.json({ accessToken, refreshToken });
});


app.post("/api/refresh", async (req, res) => {
  const { username, refreshToken } = req.body;
  if (!username || !refreshToken) return res.status(400).json({ error: "Missing refresh token" });

  await removeExpiredRefreshTokens(username);

  const snap = await db.ref(`refreshTokens/${username}`).once("value");
  if (!snap.exists()) return res.status(401).json({ error: "Invalid refresh token" });

  let valid = false;
  snap.forEach(child => {
    const tokenHash = child.val().tokenHash;
    if (tokenHash === crypto.createHash("sha256").update(refreshToken).digest("hex")) valid = true;
  });

  if (!valid) return res.status(401).json({ error: "Invalid refresh token" });

  const accessToken = createAccessToken({ username });
  res.json({ accessToken });
});

// ======================= GET COLLECTION / ITEM =======================
app.get("/api/:collection/:id?", authMiddleware, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const ref = id ? db.ref(`${collection}/${id}`) : db.ref(collection);
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) return res.status(404).json({ error: "Nu există date" });
    res.json(snapshot.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/Codes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const snap = await db.ref(`Codes/${id}`).once("value");
    if (!snap.exists()) return res.status(404).json({ error: "Cod invalid" });
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= POST TO COLLECTION =======================
app.post("/api/:collection", authMiddleware, async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    if (!data || Object.keys(data).length === 0)
      return res.status(400).json({ error: "Date lipsă" });

    const key = db.ref().child(collection).push().key;
    await db.ref(`${collection}/${key}`).set(data);
    res.status(201).json({ success: true, id: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// AUTH middleware
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));








