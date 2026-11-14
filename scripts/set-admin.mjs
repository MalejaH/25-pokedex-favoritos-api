#!/usr/bin/env node
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.argv[2];
if (uid === undefined || uid.length === 0) {
  console.error("Uso: node scripts/set-admin.mjs <uid>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId === undefined || clientEmail === undefined || privateKey === undefined) {
  console.error("Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});

await getAuth().setCustomUserClaims(uid, { rol: "admin" });
console.log(`Rol admin asignado a ${uid}. El usuario debe renovar su token.`);
