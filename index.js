const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});
const db = admin.database();

// API key middleware
app.use((req, res, next) => {
  const apiKey = req.header('X-API-KEY');
  if (!apiKey || apiKey !== process.env.CONDUCERE_API_KEY) return res.status(401).send('Unauthorized');
  next();
});

// Endpoint GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await db.ref('Users').once('value');
    res.json(snapshot.val() || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint POST /api/invoire
app.post('/api/invoire', async (req, res) => {
  const { discordId, start, end } = req.body;
  if (!discordId) return res.status(400).json({ error: "discordId required" });
  try {
    await db.ref(`invoire/${discordId}`).set({ Id: discordId, StartDate: start, EndDate: end });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint POST /api/schimbaRank
app.post('/api/schimbaRank', async (req, res) => {
  const { userId, rank } = req.body;
  try {
    await db.ref(`membrifactiune/${userId}/rank`).set(rank);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on ${port}`));
