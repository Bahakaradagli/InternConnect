import { initializeApp } from 'firebase/app';
import { getAuth, } from 'firebase/auth';
import { getDatabase, ref, onValue, push } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyA0hJqjLA3qlHNu6aA9BHxZLrFoEf1XtZs",
  authDomain: "layerwhale.firebaseapp.com",
  projectId: "layerwhale",
  storageBucket: "layerwhale.firebasestorage.app",
  messagingSenderId: "909852819200",
  appId: "1:909852819200:web:8df06f4b49ef62fdfefde5",
  measurementId: "G-HK4EY56FXH",
  databaseURL: "https://layerwhale-default-rtdb.europe-west1.firebasedatabase.app/",
  
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, ref, database, onValue, push};
