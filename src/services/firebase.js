import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCg4iz5Jd0Ov2r-uWQkSNB0h1bG-0u50EI",
  authDomain: "gy-waste-report.firebaseapp.com",
  projectId: "gy-waste-report",
  storageBucket: "gy-waste-report.firebasestorage.app",
  messagingSenderId: "370824101494",
  appId: "1:370824101494:web:65d088cdcffc0cf2706957"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
