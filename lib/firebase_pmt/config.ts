// lib/firebase_pmt/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";
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

let app: FirebaseApp;
let analytics: Analytics | undefined;
let storage: FirebaseStorage;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // Initialize analytics only on the client side
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }

  storage = getStorage(app);
  db = getFirestore(app); // Add Firestore initialization
} else {
  app = getApps()[0];
  storage = getStorage(app);
  db = getFirestore(app); // Reuse the Firestore instance
}
const auth = getAuth(app);

export { app, analytics, storage, db, auth }; // Export db
