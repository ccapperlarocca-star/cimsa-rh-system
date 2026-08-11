import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error("Falta FIREBASE_PROJECT_ID en las variables de entorno.");
}

if (!clientEmail) {
  throw new Error("Falta FIREBASE_CLIENT_EMAIL en las variables de entorno.");
}

if (!privateKey) {
  throw new Error("Falta FIREBASE_PRIVATE_KEY en las variables de entorno.");
}

const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n");

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: normalizedPrivateKey,
        }),
      });

export const adminAuth = getAuth(adminApp);

export default adminApp;