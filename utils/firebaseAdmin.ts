import admin from 'firebase-admin';

// Validate env variables at runtime
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!privateKey || !projectId || !clientEmail) {
  throw new Error('Missing Firebase environment variables.');
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
  });
  console.log('Firebase Admin initialized successfully');
}

export default admin;










// import admin from 'firebase-admin';
// import serviceAccountJson from '../config/pmt-app2-firebase-adminsdk-z10vb-1c9795a645.json';

// // Explicitly cast the type
// const serviceAccount = serviceAccountJson as admin.ServiceAccount;

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
//   });
//   console.log('Firebase Admin initialized successfully');
// }

// export default admin;
