// lib/firebase_pmt/config.ts
import { 
  initializeApp, 
  getApps, 

  FirebaseApp 
} from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAwHf04nr0bu-2osmdLIDkAD0vMHGc6Nvk",
  authDomain: "pmt-app2.firebaseapp.com",
  databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
  projectId: "pmt-app2",
  storageBucket: "pmt-app2.appspot.com",
  messagingSenderId: "696270520415",
  appId: "1:696270520415:web:791a2a694723321d5c5bea",
  measurementId: "G-S6PN9L69FC",
};


const PMT_APP_NAME = 'pmt-app';

// Create or retrieve the named app
function createPMTApp(): FirebaseApp {
  const existingApp = getApps().find((app) => app.name === PMT_APP_NAME);
  return existingApp ?? initializeApp(firebaseConfig, PMT_APP_NAME);
}

const app = createPMTApp();

// Now initialize other services
const analytics = (typeof window !== 'undefined') ? getAnalytics(app) : undefined;
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, storage, db, auth };