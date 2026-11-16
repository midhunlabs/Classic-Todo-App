// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAp0tzAjelsiep3SbADuSFID6eeNib7RuE",
  authDomain: "classic-todo-list-7a025.firebaseapp.com",
  projectId: "classic-todo-list-7a025",
  storageBucket: "classic-todo-list-7a025.firebasestorage.app",
  messagingSenderId: "372625920476",
  appId: "1:372625920476:web:6ddd4dfc633e7293767f19",
  measurementId: "G-32L4SYNRDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
