
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions'; // Import Functions

// Log the environment variables to help diagnose API key issues
console.log("firebaseConfig.ts: Reading Firebase environment variables...");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "MISSING or UNDEFINED");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
// Add other env vars if needed

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
let functionsInstance: Functions | undefined = undefined; // For Firebase Functions

if (!fbConfig.apiKey) {
  console.error("CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. Firebase will not be initialized, and authentication services will be unavailable.");
} else {
  if (!getApps().length) {
    try {
      console.log("Initializing Firebase app with config:", fbConfig);
      app = initializeApp(fbConfig);
      console.log("Firebase app object initialized:", app ? "Success" : "Failed");
      if (app) {
        auth = getAuth(app);
        functionsInstance = getFunctions(app); // Initialize Functions
        console.log("Firebase auth object initialized:", auth ? "Success" : "Failed");
        console.log("Firebase functions object initialized:", functionsInstance ? "Success" : "Failed");
      } else {
         console.error("Firebase app initialization returned undefined. Auth and Functions will not be available.");
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      app = undefined;
      auth = undefined;
      functionsInstance = undefined;
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    functionsInstance = getFunctions(app); // Get Functions instance from existing app
    console.log("Firebase app already initialized. Auth:", auth ? "Available" : "Unavailable", "Functions:", functionsInstance ? "Available" : "Unavailable");
  }
}

if (!auth) {
    console.error("CRITICAL: Firebase Auth service is NOT available after initialization attempt. Login and auth-related features will fail.");
}
if (!functionsInstance) {
    console.warn("Firebase Functions service is NOT available. Calling backend functions will fail.");
}

export { app, auth, functionsInstance as functions }; // Export functions
