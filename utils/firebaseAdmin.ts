// utils/firebaseAdmin.ts
import admin from 'firebase-admin';

// Initialize the admin SDK if it hasn't been initialized yet
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Export the admin SDK
export default admin;
