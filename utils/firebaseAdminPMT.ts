// utils/firebaseAdmin.ts
import admin from 'firebase-admin';

// Validate required env variables
const projectId = process.env.FIREBASE_PROJECT_ID_PMT;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL_PMT;
const privateKey = process.env.FIREBASE_PRIVATE_KEY_PMT?.replace(/\\n/g, '\n');

// Log the key length for debugging (do not log the actual key)
console.log('Runtime Environment Variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID_PMT);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL_PMT);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY_PMT?.length); // Ensure key length is not 0 or undefined
console.log('Environment:', process.env.NODE_ENV); // Log environment type
console.log('Private Key Preview:', process.env.FIREBASE_PRIVATE_KEY_PMT?.slice(0, 100)); // Output first 100 chars

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing Firebase environment variables. Check .env or Vercel configuration.');
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
  });
  console.log('Firebase Admin initialized successfully');
}

export default admin;
