import admin from "firebase-admin";
import bcrypt from "bcrypt";

// CONFIG Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

async function createAdmin() {
  const username = "Admin";          // Numele contului admin
  const password = "Parola123!";     // Parola ta
  const idFactiune = "AdminFaction"; // IdFactiune pentru admin
  const grad = 99;                   // Nivel admin

  // Verificăm dacă există deja
  const snap = await db.ref("users").orderByChild("Username").equalTo(username).once("value");
  if (snap.exists()) {
    console.log("Contul Admin există deja!");
    return;
  }

  // Hash la parola
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    Username: username,
    PasswordHash: passwordHash,
    IdFactiune: idFactiune,
    Grad: grad,
    Blocat: 0
  };

  const key = db.ref().child("users").push().key;
  await db.ref(`users/${key}`).set(newUser);

  console.log(`Cont Admin creat cu succes! Username: ${username}, parola: ${password}`);
}

createAdmin().then(() => process.exit());
