import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Safely parse FIREBASE_SERVICE_ACCOUNT_KEY
    let serviceAccount = {};
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format.');
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error; // Propagate the error to fail fast
  }
}

export default admin;
