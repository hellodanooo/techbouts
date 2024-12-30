import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Safely parse FIREBASE_SERVICE_ACCOUNT_KEY
    let serviceAccount = {};
    try {
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}';
      
      // Replace escaped '\n' with actual newlines
      const sanitizedKey = rawKey.replace(/\\n/g, '\n');
      serviceAccount = JSON.parse(sanitizedKey);

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
    throw error; // Fail fast
  }
}

export default admin;
