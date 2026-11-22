import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDMxEocXH-T3ZhEYaxTZFtNQzdfLGGaYs0',
  authDomain: 'pestel-esmeralda-2026.firebaseapp.com',
  projectId: 'pestel-esmeralda-2026',
  storageBucket: 'pestel-esmeralda-2026.firebasestorage.app',
  messagingSenderId: '947844765962',
  appId: '1:947844765962:web:81acca0f11c2a5247b42f3'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc
};
