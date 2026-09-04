import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA02pl-oxUbCBB7LG3qpldUEJEYj6dQLYw",
  authDomain: "gy-daily-dashboard.firebaseapp.com",
  projectId: "gy-daily-dashboard",
  storageBucket: "gy-daily-dashboard.firebasestorage.app",
  messagingSenderId: "533489548506",
  appId: "1:533489548506:web:92a4a3a0aa6ba96fb6b9e3",
  measurementId: "G-E34Y8X5JKH"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
