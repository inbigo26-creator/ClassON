import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBGaPlydIzUoD6T2CYCJQYZNsQlBe8aNkk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-classon.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-classon",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "my-classon.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "41433652372",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:41433652372:web:f10cdcb0c791f899f2a881",
  measurementId: "G-W5KJBR3W8G"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
export const db = getFirestore(app);
