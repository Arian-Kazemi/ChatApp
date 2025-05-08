




// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBdKb67d7GoBzSmGJWsgDuirOWZWD56aBI",
  authDomain: "chatapp-ef39b.firebaseapp.com",
  databaseURL: "https://chatapp-ef39b-default-rtdb.firebaseio.com",
  projectId: "chatapp-ef39b",
  storageBucket: "chatapp-ef39b.firebasestorage.app",
  messagingSenderId: "830754589052",
  appId: "1:830754589052:web:71a7f6f24a8d44865b3cf9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and DB exports
export const auth = getAuth(app);
export const db = getDatabase(app);
