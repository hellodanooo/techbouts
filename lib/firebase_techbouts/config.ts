// lib/firebase_techbouts/config.ts

import { initializeApp, getApps } from "firebase/app";
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

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, analytics, db };