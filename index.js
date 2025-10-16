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

// -------------------- Middleware pentru FACTION_ID (Nou) --------------------
// Preluăm ID-ul facțiunii din header-ul X-FACTION-ID trimis de clientul C#
/*
app.use((req, res, next) => {
    const factionId = req.header('X-FACTION-ID');
    if (!factionId) {
        return res.status(400).json({ error: 'Header-ul X-FACTION-ID este obligatoriu' });
    }
    // Salvăm FACTION_ID în request pentru a fi folosit în rute
    req.factionId = factionId; 
    next();
});
*/
// -------------------- Firebase Admin Setup --------------------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

// Funcție ajutătoare pentru a obține calea corectă
const getRefPath = (req, node) => `${req.factionId}/${node}`;

// -------------------- Rute API --------------------

// ====================== USERS ======================

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const path = getRefPath(req, 'Users');
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single user by username
app.get('/api/users/:username', async (req, res) => {
    try {
        const username = req.params.username;
        console.log("🔍 Requested user:", username);

        const refPath = `Users/${username}`;
        console.log("📁 Firebase path:", refPath);

        const snapshot = await db.ref(refPath).once('value');
        const data = snapshot.val();

        console.log("📄 Firebase returned:", data);

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(data);
    } catch (err) {
        console.error("❌ Error in /api/users/:username:", err);
        res.status(500).json({ error: err.message });
    }
});


// Create new user
app.post('/api/users', async (req, res) => {
    try {
        const { Username, PasswordHash, Grad, IdFactiune } = req.body;

        if (!Username || !PasswordHash) {
            return res.status(400).json({ error: "Username și PasswordHash sunt obligatorii" });
        }

        await db.ref(`Users/${Username}`).set({
            Username,
            PasswordHash,
            Grad,
            Blocat: 0,
            IdFactiune: IdFactiune ?? "Necunoscut"
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================== ABSENTI ======================
app.post('/api/absenti', async (req, res) => {
    try {
        const { Id, Nume, DataStart, DataExpira } = req.body;

        if (!Id || !Nume) {
            return res.status(400).json({ error: 'Lipsesc campuri obligatorii' });
        }

        const path = getRefPath(req, `absenti/${Id}`);
        await db.ref(path).set({
            Id,
            Nume,
            DataStart,
            DataExpira
        });

        res.json({ success: true });
    } catch (err) {
        console.error('[ERROR] POST /api/absenti:', err);
        res.status(500).json({ error: err.message });
    }
});


// ====================== JUCATORI ACC ======================
app.get('/api/jucatoriacc', async (req, res) => {
    try {
        const path = getRefPath(req, 'jucatoriacc');
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================== MEMBRI FACTIUNE ======================
app.get('/api/membrifactiune', async (req, res) => {
    try {
        const path = getRefPath(req, 'membrifactiune');
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET membru factiune dupa id
app.get('/api/membrifactiune/:id', async (req, res) => {
    try {
        const id = req.params.id; // ex: mafiaruseasca
        const path = getRefPath(req, `membrifactiune/${id}`);
        const snapshot = await db.ref(`membrifactiune/${id}`).once('value');

        
    console.log("[DEBUG] faction id:", id);

    
    console.log("[DEBUG] firebase path:", path);

   
    console.log("[DEBUG] snapshot exists:", snapshot.exists());

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Faction not found" });
        }

        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Schimba rank
app.post('/api/membrifactiune/:id/rank', async (req, res) => {
    try {
        const { rankNou } = req.body;
        const path = getRefPath(req, `membrifactiune/${req.params.id}/rank`);
        await db.ref(path).set(rankNou);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================== INVOIRE ======================
app.post('/api/invoire', async (req, res) => {
    try {
        const { discordId, startDate, endDate } = req.body;
        const path = getRefPath(req, `invoire/${discordId}`);
        await db.ref(path).set({ Id: discordId, StartDate: startDate, EndDate: endDate });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoire/:discordId', async (req, res) => {
    try {
        const path = getRefPath(req, `invoire/${req.params.discordId}`);
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val() || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adaugă și ruta pentru `invoirems` care lipsea în codul tău Node.js inițial
app.post('/api/invoirems', async (req, res) => {
    try {
        const { discordId, StartDate, EndDate } = req.body;
        const path = getRefPath(req, `invoirems/${discordId}`);
        // Atentie: C# trimite payload-ul cu StartDate/EndDate, ajustăm aici
        await db.ref(path).set({ Id: discordId, StartDate: StartDate, EndDate: EndDate }); 
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoirems/:discordId', async (req, res) => {
    try {
        const path = getRefPath(req, `invoirems/${req.params.discordId}`);
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val() || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================== CODURI (Codes) ======================
// Codurile sunt la ROOT (nu sub FACTION_ID), conform structurii tale
// Crează cod nou cu IdFactiune
app.post('/api/codes', async (req, res) => {
    try {
        console.log("[DEBUG] /api/codes called with body:", req.body);

        // Obține proprietățile exact ca în JSON-ul C#
        const { Code, IdFactiune } = req.body;

        if (!Code || !IdFactiune) {
            console.log("[DEBUG] Missing Code or IdFactiune");
            return res.status(400).json({ error: "Code și IdFactiune sunt obligatorii" });
        }

        // Verifică dacă codul există deja
        const snapshot = await db.ref(`Codes/${Code}`).once('value');
        if (snapshot.exists()) {
            return res.status(400).json({ error: "Codul există deja" });
        }

        // Salvează codul și IdFactiune
        await db.ref(`Codes/${Code}`).set({ Code, IdFactiune });

        console.log("[DEBUG] Cod salvat:", Code, "cu factiune:", IdFactiune);
        res.json({ success: true });
    } catch (err) {
        console.error("[DEBUG] Eroare la /api/codes:", err);
        res.status(500).json({ error: err.message });
    }
});



app.get('/api/codes/:code', async (req, res) => {
    try {
        const snapshot = await db.ref(`Codes/${req.params.code}`).once('value');
        if (!snapshot.exists()) {
            return res.json(null);
        }
        res.json(snapshot.val());
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


// ====================== STATISTICI (stuff) ======================
app.get('/api/statistici', async (req, res) => {
    try {
        const path = getRefPath(req, 'stuff');
        const snapshot = await db.ref(path).once('value');
        res.json(snapshot.val() || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Version este la ROOT/stuff (nu sub factiune)
app.get("/api/stuff/version", async (req, res) => {
    try {
        const snapshot = await db.ref("stuff/Version").once("value");
        res.json(snapshot.val());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ====================== Rute de tip DELETE/SANCTIUNI/DEMITERI Lipsă ======================
// Am adăugat rutele necesare pentru a acoperi funcțiile din clientul C#

// RUTA DEMITERE (DELETE /api/membrifactiune/:id)
app.delete('/api/membrifactiune/:id', async (req, res) => {
    try {
        const path = getRefPath(req, `membrifactiune/${req.params.id}`);
        await db.ref(path).remove();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RUTA SALVARE DEMITERE (POST /api/demiteri)
// Atenție: Nodul "demisi" din DB este la rădăcină (nu sub factiune), dar ai nevoie de ID-ul factiunii pentru a ști unde să îl pui. 
// Voi crea un nod sub factiune, similar celorlalte (demisi/MafiaRuseasca/...)
// Dacă vrei să fie la rădăcină, trebuie să modifici calea.
// Voi presupune că folosești "demisi" și "sanctiuni" sub factiune, similar cu "absenti".
app.post('/api/demiteri', async (req, res) => {
    try {
        const { Id, Motiv } = req.body;
        
        // Folosim push() pentru a crea o cheie unică sub nodul factiunii, ca în structura ta de DB
        const newRef = db.ref(getRefPath(req, `demisi`)).push(); 

        await newRef.set({
            Data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            Id: Id,
            Motiv: Motiv
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RUTA ADĂUGARE SANCȚIUNE (POST /api/sanctiuni)
app.post('/api/sanctiuni', async (req, res) => {
    try {
        const { Id, Tip, Motiv, Valoare } = req.body;
        
        // Folosim push() pentru a crea o cheie unică sub nodul jucătorului, ca în structura ta de DB
        const newRef = db.ref(getRefPath(req, `sanctiuni/${Id}`)).push(); 

        await newRef.set({
            DataAplicarii: new Date().toISOString().replace('T', ' ').substring(0, 19),
            // DataExpirare ar trebui calculată aici pe baza Tipului
            Id: Id,
            Motiv: Motiv,
            Tip: Tip,
            Valoare: Valoare || 0
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RUTA ARE FW RAPORT INCOMPLET (GET /api/sanctiuni/:userId/fwraport)
app.get('/api/sanctiuni/:userId/fwraport', async (req, res) => {
    try {
        const snapshot = await db.ref(getRefPath(req, `sanctiuni/${req.params.userId}`)).once('value');
        const sanctiuni = snapshot.val();

        if (!sanctiuni) {
            return res.json(false);
        }

        const areFWRaport = Object.values(sanctiuni).some(s => 
            s.Tip === 'FW' && s.Motiv.toLowerCase().includes('raport incomplet')
            // Ar trebui adăugată și logica de verificare a DataExpirare
        );

        res.json(areFWRaport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Pornire server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));