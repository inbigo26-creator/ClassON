import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || "valid-style-3xctm",
  appId: firebaseConfigJson.appId || "1:192855935019:web:408c81b8655b6aea60426e",
  apiKey: firebaseConfigJson.apiKey || "AIzaSyB2p0ho6DBbBUNfBsx4UNXeQAOxvik3QFA",
  authDomain: firebaseConfigJson.authDomain || "valid-style-3xctm.firebaseapp.com",
  storageBucket: firebaseConfigJson.storageBucket || "valid-style-3xctm.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "192855935019",
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
const databaseId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
