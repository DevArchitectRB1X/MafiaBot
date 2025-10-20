import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import fs from "fs";

// ✅ Citește fișierul JSON manual (compatibil cu Render)
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<proiectul-tau>.firebaseio.com" // ← pune URL-ul real
});

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ GET — toate colecțiile
app.get("/api/:collection", async (req, res) => {
    try {
        const ref = db.ref(req.params.collection);
        const snapshot = await ref.once("value");
        if (!snapshot.exists()) return res.status(404).json({ error: "Colecția e goală" });
        res.json(snapshot.val());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ GET — un document
app.get("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        const snapshot = await db.ref(`${collection}/${id}`).once("value");
        if (!snapshot.exists()) return res.status(404).json({ error: "Nu există" });
        res.json(snapshot.val());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ POST — adaugă un document
app.post("/api/:collection", async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;
        if (!data || Object.keys(data).length === 0)
            return res.status(400).json({ error: "Date lipsă" });

        const id = data.id || data.Id || data.Code || data.Username || db.ref().push().key;
        await db.ref(`${collection}/${id}`).set(data);
        res.status(201).json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ PUT — actualizează un document
app.put("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        const data = req.body;
        await db.ref(`${collection}/${id}`).update(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ DELETE — șterge un document
app.delete("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;
        await db.ref(`${collection}/${id}`).remove();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
