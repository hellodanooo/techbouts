// lib/firebase_techbouts/config.ts

import { 
  initializeApp, 
  getApps, 
  FirebaseApp 
} from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-PWlAUJn1v0dvBDAuhr_D1uxWNMB72cg",
  authDomain: "nakmuay-techbouts.firebaseapp.com",
  projectId: "nakmuay-techbouts",
  storageBucket: "nakmuay-techbouts.firebasestorage.app",
  messagingSenderId: "820058890820",
  appId: "1:820058890820:web:c1eea18a7ed77d2189d211",
  measurementId: "G-F27HR9JQ1L"
};

const TECHBOUTS_APP_NAME = 'techbouts-app';

// Create or retrieve the named app
function createTechBoutsApp(): FirebaseApp {
  const existingApp = getApps().find((app) => app.name === TECHBOUTS_APP_NAME);
  return existingApp ?? initializeApp(firebaseConfig, TECHBOUTS_APP_NAME);
}

const app = createTechBoutsApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = (typeof window !== 'undefined') ? getAnalytics(app) : null;

export { app, auth, analytics, db };