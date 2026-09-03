const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCg4iz5Jd0Ov2r-uWQkSNB0h1bG-0u50EI",
  authDomain: "gy-waste-report.firebaseapp.com",
  projectId: "gy-waste-report",
  storageBucket: "gy-waste-report.firebasestorage.app",
  messagingSenderId: "370824101494",
  appId: "1:370824101494:web:65d088cdcffc0cf2706957"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCollections() {
  const collectionsToTest = ['reports', 'waste', 'waste_reports', 'wastes', 'data'];
  
  for (const collName of collectionsToTest) {
    try {
      console.log(`Testing collection: ${collName}`);
      const q = query(collection(db, collName), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        console.log(`FOUND DATA IN: ${collName}`);
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
        });
        return;
      } else {
        console.log(`Collection ${collName} is empty.`);
      }
    } catch (err) {
      console.log(`Error reading ${collName}:`, err.message);
    }
  }
  
  console.log("Finished searching.");
}

testCollections();
