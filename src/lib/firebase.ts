
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "hotel-supply-hub-ssw5p",
  "appId": "1:491836302462:web:21762b108139554ea2242f",
  "storageBucket": "hotel-supply-hub-ssw5p.firebasestorage.app",
  "apiKey": "AIzaSyDRi881YXJtIG_LnTiKHQtumnA9eKxhGHw",
  "authDomain": "hotel-supply-hub-ssw5p.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "491836302462"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
