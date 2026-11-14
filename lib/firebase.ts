import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { firebaseAdminConfig } from "./env";

let cachedApp: App | null = null;

function adminApp(): App {
  if (cachedApp !== null) {
    return cachedApp;
  }
  const existing = getApps()[0];
  if (existing !== undefined) {
    cachedApp = existing;
    return existing;
  }
  const config = firebaseAdminConfig();
  cachedApp = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });
  return cachedApp;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
