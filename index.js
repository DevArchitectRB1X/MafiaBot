import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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

// Init Firebase Admin
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

// Rate limit
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

// JWT Middleware
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

// Get user by Username (important: Firebase keys are random!)
async function getUserByUsername(username) {
    const snap = await db.ref("users").orderByChild("Username").equalTo(username).once("value");
    if (!snap.exists()) return null;
    let user = null;
    snap.forEach(child => {
        user = child.val(); // luam primul match
    });
    return user;
}

// Create access token
function createAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Create refresh token
function createRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
}

// ======================= LOGIN =======================
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    console.log("=== DEBUG LOGIN ===");
    console.log("Primit username:", username);
    console.log("Primit password:", password ? "(exista)" : "(lipsa)");
    console.log("User gasit:", user.Username);
console.log("Hash din DB:", user.PasswordHash);
console.log("Password primit:", password);

    if (!username || !password) {
        console.log("Lipsesc credentiale");
        return res.status(400).json({ error: "Missing credentials" });
    }

    try {
        console.log("Rezultat getUserByUsername:", user ? "gasit" : "negasit");

        if (!user) {
            console.log("User negasit in baza de date!");
            return res.status(401).json({ error: "Invalid credentials (user not found)" });
        }

        console.log("User gasit:", user.Username, "-> verific parola...");

        const valid = await bcrypt.compare(password, user.PasswordHash);
        console.log("Rezultat comparare parola:", valid);

        if (!valid) {
            console.log("Parola invalida pentru user:", username);
            return res.status(401).json({ error: "Invalid credentials (wrong password)" });
        }

        // Tokens
        const accessToken = createAccessToken({ username });
        const refreshToken = createRefreshToken();
        const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        await storeRefreshToken(username, tokenHash, expiresAt);
        console.log("Token generat si stocat cu succes!");

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error("Eroare la bcrypt.compare:", err);
  return res.status(500).json({ error: "Eroare interna la comparare parola" });
    }
});

// ======================= CREATE USER =======================
app.post("/api/users", async (req, res) => {
    try {
        const { username, password, grad = 0, idFactiune } = req.body;

        if (!username || !password || !idFactiune) {
            return res.status(400).json({ error: "Date incomplete" });
        }

        // 1️⃣ Verificăm dacă există deja user cu același username
        const snap = await db.ref("users").orderByChild("Username").equalTo(username).once("value");
        if (snap.exists()) return res.status(400).json({ error: "User deja existent" });

        // 2️⃣ Criptăm parola cu bcrypt (Node.js)
        const passwordHash = await bcrypt.hash(password, 10);

        // 3️⃣ Creăm obiectul user
        const newUser = { 
            Username: username,
            PasswordHash: passwordHash,
            Grad: grad,
            IdFactiune: idFactiune,
            Blocat: 0
        };

        // 4️⃣ Adăugăm în Firebase
        const key = db.ref().child("users").push().key;
        await db.ref(`users/${key}`).set(newUser);

        res.status(201).json({ success: true, message: "User creat cu succes", id: key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ======================= REFRESH TOKEN =======================
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

// GET cod după ID
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

// POST cod (dacă vrei să creezi coduri noi)
app.post("/api/Codes", async (req, res) => {
    try {
        const { Code, IdFactiune } = req.body;
        if (!Code || !IdFactiune) return res.status(400).json({ error: "Date lipsa" });

        const key = db.ref("Codes").push().key;
        await db.ref(`Codes/${key}`).set({ Code, IdFactiune });
        res.status(201).json({ success: true, id: key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE cod după ID
app.delete("/api/Codes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.ref(`Codes/${id}`).remove();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ======================= GET / POST GENERIC =======================
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

app.post("/api/:collection", authMiddleware, async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;
        if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: "Date lipsă" });

        const key = db.ref().child(collection).push().key;
        await db.ref(`${collection}/${key}`).set(data);
        res.status(201).json({ success: true, id: key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
