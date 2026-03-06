// Firebase Configuration for health+ Application
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD239JqpspNL_KN7-buMq2PTWUM5P0D5YA",
  authDomain: "milliniem-86b63.firebaseapp.com",
  projectId: "milliniem-86b63",
  storageBucket: "milliniem-86b63.firebasestorage.app",
  messagingSenderId: "455693438371",
  appId: "1:455693438371:web:0a64c5c007cb906e241e16",
  measurementId: "G-KHHJRMKW9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, updateDoc };
