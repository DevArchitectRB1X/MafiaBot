import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// Asumăm că ai inițializat deja Firebase
const db = admin.database();

// RUTA GENERICĂ
app.get("/api/:collection", async (req, res) => {
    try {
        const collectionName = req.params.collection;
        console.log(`[DEBUG] Requested collection: ${collectionName}`);

        const ref = db.ref(collectionName);
        const snapshot = await ref.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Colecția nu există sau e goală." });
        }

        const data = snapshot.val();
        res.status(200).json(data);
    } catch (error) {
        console.error("[ERROR] Fetching collection:", error);
        res.status(500).json({ error: error.message });
    }
});
