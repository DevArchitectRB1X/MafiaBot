// index.js
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// -------------------- Middleware pentru API Key --------------------
const API_KEY = process.env.CONDUCERE_API_KEY;
app.use((req, res, next) => {
    if (req.header('X-API-KEY') !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// -------------------- Firebase Admin Setup --------------------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

// -------------------- Rute API --------------------

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await db.ref('Users').once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single user by username
app.get('/api/users/:username', async (req, res) => {
    try {
        const snapshot = await db.ref(`Users/${req.params.username}`).once('value');
        res.json(snapshot.val() || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new user
app.post('/api/users', async (req, res) => {
    try {
        const { username, passwordHash, grad } = req.body;
        await db.ref(`Users/${username}`).set({ Username: username, PasswordHash: passwordHash, Grad: grad });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// JucatoriAcc
app.get('/api/jucatoriacc', async (req, res) => {
    try {
        const snapshot = await db.ref('jucatoriacc').once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Jucatori
app.get('/api/membrifactiune', async (req, res) => {
    try {
        const snapshot = await db.ref('membrifactiune').once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Invoire
app.post('/api/invoire', async (req, res) => {
    try {
        const { discordId, startDate, endDate } = req.body;
        await db.ref(`invoire/${discordId}`).set({ Id: discordId, StartDate: startDate, EndDate: endDate });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoire/:discordId', async (req, res) => {
    try {
        const snapshot = await db.ref(`invoire/${req.params.discordId}`).once('value');
        res.json(snapshot.val() || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Schimba rank
app.post('/api/membrifactiune/:id/rank', async (req, res) => {
    try {
        const { rankNou } = req.body;
        await db.ref(`membrifactiune/${req.params.id}/rank`).set(rankNou);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adauga/sterge coduri
app.post('/api/codes', async (req, res) => {
    try {
        const { code } = req.body;
        await db.ref(`Codes/${code}`).set({ Code: code });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/codes/:code', async (req, res) => {
    try {
        const snapshot = await db.ref(`Codes/${req.params.code}`).once('value');
        res.json({ exists: snapshot.exists() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/codes/:code', async (req, res) => {
    try {
        await db.ref(`Codes/${req.params.code}`).remove();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Statistici
app.get('/api/statistici', async (req, res) => {
    try {
        const snapshot = await db.ref('stuff').once('value');
        res.json(snapshot.val() || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/stuff/version", async (req, res) => {
    try {
        // Citește nodul 'stuff/Version' din Firebase
        const snapshot = await db.ref("stuff/Version").once("value");
        res.json(snapshot.val()); // va returna "1.0.0"
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Pornire server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
