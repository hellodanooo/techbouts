import admin from 'firebase-admin';

// Validate required env variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Replace escaped newlines

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing Firebase environment variables. Check .env.local or Vercel configuration.');
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
