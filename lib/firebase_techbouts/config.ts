// lib/firebase_techbouts/config.ts

import { 
  initializeApp, 
  getApps, 
  FirebaseApp 
} from "firebase/app";
import { 
  getFirestore 
} from "firebase/firestore";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  inMemoryPersistence 
} from "firebase/auth";
import { 
  getAnalytics 
} from "firebase/analytics";

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

// Function to detect if we're in an embedded browser environment
const isEmbeddedBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('fban') || // Facebook app
    userAgent.includes('fbav') || // Facebook browser
    userAgent.includes('instagram') ||
    userAgent.includes('linkedin') ||
    userAgent.includes('wv') || // WebView
    // Messenger typically includes FBAN or FBAV but adding specific check
    (userAgent.includes('facebook') && userAgent.includes('messenger'))
  );
};

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

// Set appropriate persistence based on browser environment
if (typeof window !== 'undefined') {
  const persistenceType = isEmbeddedBrowser() 
    ? inMemoryPersistence  // Use in-memory for embedded browsers
    : browserLocalPersistence;  // Use local storage for regular browsers
  
  setPersistence(auth, persistenceType)
    .catch((error) => {
      console.error('Firebase auth persistence error:', error);
    });
}

export { app, auth, analytics, db, isEmbeddedBrowser };