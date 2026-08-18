import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "valid-style-3xctm",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:192855935019:web:408c81b8655b6aea60426e",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB2p0ho6DBbBUNfBsx4UNXeQAOxvik3QFA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "valid-style-3xctm.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "valid-style-3xctm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "192855935019",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore (with specific databaseId)
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-ead6ecf8-c80c-41ea-86c6-404d0d8316ca";

export const db = databaseId && databaseId !== '(default)'
  ? getFirestore(app, databaseId)
  : getFirestore(app);
