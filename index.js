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

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Lipsește tokenul" });
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Token invalid sau expirat" });
  }
}


// ======================= UPDATE GENERIC =======================
app.put("/api/:collection/:id", authMiddleware, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0)
      return res.status(400).json({ error: "Date lipsă" });

    const ref = db.ref(`${collection}/${id}`);
    const snapshot = await ref.once("value");
    if (!snapshot.exists())
      return res.status(404).json({ error: "Nu există acest jucător" });

    // 👉 Doar update (nu set) — actualizare parțială
    await ref.update(data);
    res.json({ success: true, message: "Jucător actualizat cu succes" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= LOGIN =======================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials (user not found)" });

    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials (wrong password)" });

    const accessToken = createAccessToken({ username });
    const refreshToken = createRefreshToken();
    const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    await storeRefreshToken(username, tokenHash, expiresAt);
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: "Eroare interna la comparare parola" });
  }
});


// ======================= CREATE USER =======================
app.post("/api/users", async (req, res) => {
  try {
    const { username, password, grad = 0, idFactiune } = req.body;

    if (!username || !password || !idFactiune)
      return res.status(400).json({ error: "Date incomplete" });

    const snap = await db.ref("users").orderByChild("Username").equalTo(username).once("value");
    if (snap.exists()) return res.status(400).json({ error: "User deja existent" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      Username: username,
      PasswordHash: passwordHash,
      Grad: grad,
      IdFactiune: idFactiune,
      Blocat: 0,
    };

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
  if (!username || !refreshToken)
    return res.status(400).json({ error: "Missing refresh token" });

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


// ======================= GET JUCĂTOR DUPĂ ID =======================
app.get("/api/jucatoriacc/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.ref(`jucatoriacc/${id}`);
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) return res.json([]);
    res.json(snapshot.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= CODES =======================
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

app.post("/api/Codes", async (req, res) => {
  try {
    const { Code, IdFactiune } = req.body;
    if (!Code || !IdFactiune)
      return res.status(400).json({ error: "Date lipsa" });

    const key = db.ref("Codes").push().key;
    await db.ref(`Codes/${key}`).set({ Code, IdFactiune });
    res.status(201).json({ success: true, id: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/Codes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.ref(`Codes/${id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= JUCĂTORI ACCEPTAȚI =======================
app.post("/api/jucatoriacc/add", async (req, res) => {
  try {
    const { username, addedBy, notes, expiresInHours = 168 } = req.body;
    if (!username) return res.status(400).json({ error: "Username lipsă" });

    const now = Date.now();
    const expiresAt = now + expiresInHours * 60 * 60 * 1000;

    const data = {
      Username: username,
      AddedBy: addedBy || "Unknown",
      DateAdded: new Date(now).toISOString(),
      ExpiresAt: new Date(expiresAt).toISOString(),
      Status: "In teste",
      Notes: notes || "",
    };

    const ref = await db.ref("teste").push();
    await ref.set(data);
    res.json({ success: true, id: ref.key, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/jucatoriacc/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // 👉 Update, nu set
    await db.ref(`jucatoriacc/${id}`).update(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= MEMBRI FACTIUNE =======================
app.post("/api/membrifactiune", async (req, res) => {
  try {
    const { username, numeDiscord, rank, zile, contFactiune } = req.body;
    if (!username || !numeDiscord || !contFactiune)
      return res.status(400).json({ error: "Date incomplete" });

    const key = db.ref().child("membrifactiune").push().key;
    const membru = {
      username,
      numeDiscord,
      rank: rank || 1,
      zile: zile || 0,
      contFactiune,
    };

    // 👉 push().set()
    await db.ref(`membrifactiune/${contFactiune}/${key}`).set(membru);
    res.status(201).json({ success: true, id: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= CONFIG =======================
app.get("/api/config", authMiddleware, async (req, res) => {
  try {
    const snap = await db.ref("config").once("value");
    res.json(snap.exists() ? snap.val() : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/config", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    // 👉 set() — rescrie complet config-ul
    await db.ref("config").set(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================= SANCȚIUNI =======================
app.post("/api/sanctiuni/:factionId", verifyToken, async (req, res) => {
  try {
    const { IdDiscord, Tip, Motiv, Valoare = 0 } = req.body;
    const { factionId } = req.params;

    if (!IdDiscord || !Tip)
      return res.status(400).json({ error: "Lipsește IdDiscord sau Tip" });

    const data = {
      IdDiscord,
      Tip,
      Motiv,
      Valoare,
      Data: new Date().toISOString(),
    };

    // 👉 set() — fiecare jucător are propriul ID
    await db.ref(`sanctiuni/${factionId}/${IdDiscord}`).set(data);

    res.json({ success: true, id: IdDiscord });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});


// ======================= INVOIRE =======================
app.post("/api/invoire/:factionId", verifyToken, async (req, res) => {
  try {
    const { discordId, startDate, endDate } = req.body;
    const { factionId } = req.params;

    if (!discordId || !startDate || !endDate)
      return res.status(400).json({ error: "Date invalide" });

    // 👉 set() — doar o învoire activă per jucător
    await db.ref(`invoire/${factionId}/${discordId}`).set({
      IdDiscord: discordId,
      StartDate: startDate,
      EndDate: endDate,
    });

    res.json({ success: true, id: discordId });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});


// ======================= INVOIRE MS =======================
app.post("/api/invoirems/:factionId", verifyToken, async (req, res) => {
  try {
    const { discordId, startDate, endDate } = req.body;
    const { factionId } = req.params;

    if (!discordId || !startDate || !endDate)
      return res.status(400).json({ error: "Date invalide" });

    // 👉 set() — o singură învoire MS per jucător
    await db.ref(`invoirems/${factionId}/${discordId}`).set({
      IdDiscord: discordId,
      StartDate: startDate,
      EndDate: endDate,
    });

    res.json({ success: true, id: discordId });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ======================= GET USERS =======================
app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const snap = await db.ref("users").once("value");
    if (!snap.exists()) return res.status(404).json({ error: "Nu există utilizatori" });

    const users = {};
    snap.forEach(child => {
      users[child.key] = child.val();
    });

    res.json(users);
  } catch (err) {
    console.error("Eroare la GET /api/users:", err);
    res.status(500).json({ error: err.message });
  }
});



app.get("/api/users/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const snap = await db.ref("users").orderByChild("Username").equalTo(username).once("value");
    if (!snap.exists()) return res.status(404).json({ error: "User inexistent" });

    let user = null;
    snap.forEach(child => (user = { id: child.key, ...child.val() }));
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => console.log(`Server listening on ${PORT}`));













