import express from "express";
import admin from "firebase-admin";
import cors from "cors";

// Inițializează aplicația Firebase
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<proiectul-tau>.firebaseio.com"
});

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ GET — citește toate datele dintr-o colecție
app.get("/api/:collection", async (req, res) => {
    try {
        const { collection } = req.params;
        const ref = db.ref(collection);
        const snapshot = await ref.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Colecția este goală sau nu există." });
        }

        res.json(snapshot.val());
    } catch (error) {
        console.error("[ERROR GET]", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ GET — citește un document specific
app.get("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        const ref = db.ref(`${collection}/${id}`);
        const snapshot = await ref.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Documentul nu există." });
        }

        res.json(snapshot.val());
    } catch (error) {
        console.error("[ERROR GET SINGLE]", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ POST — adaugă un document nou
app.post("/api/:collection", async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: "Date lipsă în corpul cererii." });
        }

        // Dacă are un ID specificat, îl folosește ca cheie, altfel creează una automată
        const id = data.id || data.Id || data.Code || data.Username || db.ref().push().key;
        await db.ref(`${collection}/${id}`).set(data);

        res.status(201).json({ success: true, id });
    } catch (error) {
        console.error("[ERROR POST]", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ PUT — actualizează un document existent
app.put("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: "Date lipsă în corpul cererii." });
        }

        const ref = db.ref(`${collection}/${id}`);
        await ref.update(data);

        res.json({ success: true, updated: id });
    } catch (error) {
        console.error("[ERROR PUT]", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ DELETE — șterge un document
app.delete("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        const ref = db.ref(`${collection}/${id}`);
        await ref.remove();

        res.json({ success: true, deleted: id });
    } catch (error) {
        console.error("[ERROR DELETE]", error);
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Pornim serverul
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serverul rulează pe portul ${PORT}`));
