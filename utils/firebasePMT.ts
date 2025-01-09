// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwHf04nr0bu-2osmdLIDkAD0vMHGc6Nvk",
  authDomain: "pmt-app2.firebaseapp.com",
  databaseURL: "https://pmt-app2-default-rtdb.firebaseio.com",
  projectId: "pmt-app2",
  storageBucket: "pmt-app2.appspot.com",
  messagingSenderId: "696270520415",
  appId: "1:696270520415:web:791a2a694723321d5c5bea",
  measurementId: "G-S6PN9L69FC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);