
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';

const fbConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let functions: Functions;

if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(fbConfig);
    auth = getAuth(app);
    functions = getFunctions(app);
  } catch (e) {
    console.error("Error initializing Firebase:", e);
    // You might want to handle this error more gracefully
  }
} else if (typeof window !== 'undefined') {
  app = getApps()[0];
  auth = getAuth(app);
  functions = getFunctions(app);
}

// @ts-ignore - To support server-side scenarios if needed, though this config is client-focused.
export { app, auth, functions };
