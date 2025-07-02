
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';

// Log the environment variables to help diagnose API key issues
console.log("firebaseConfig.ts: Reading Firebase environment variables...");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "MISSING or UNDEFINED");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const fbConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let functionsInstance: Functions | undefined = undefined;

if (typeof window !== 'undefined') {
  if (!fbConfig.apiKey) {
    console.error("CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. Firebase will not be initialized.");
  } else {
    if (!getApps().length) {
      try {
        console.log("Initializing Firebase app with config:", fbConfig);
        app = initializeApp(fbConfig);
        auth = getAuth(app);
        functionsInstance = getFunctions(app);
        console.log("Firebase initialized successfully.");
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      functionsInstance = getFunctions(app);
      console.log("Firebase app already initialized.");
    }
  }
}

if (!auth) {
    console.warn("Firebase Auth service is NOT available. This may be expected during server-side rendering.");
}
if (!functionsInstance) {
    console.warn("Firebase Functions service is NOT available. This may be expected during server-side rendering.");
}

export { app, auth, functionsInstance as functions };
