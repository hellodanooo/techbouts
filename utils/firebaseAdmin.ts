import admin from 'firebase-admin';
import serviceAccountJson from '../config/pmt-app2-firebase-adminsdk-z10vb-1c9795a645.json';

// Explicitly cast the type
const serviceAccount = serviceAccountJson as admin.ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
  });
  console.log('Firebase Admin initialized successfully');
}

export default admin;
