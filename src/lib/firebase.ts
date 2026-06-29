// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4pWNdlk2_fT6RP6ayVzjY7oedrVmkDkc",
  authDomain: "hospital-management-syst-91ed7.firebaseapp.com",
  projectId: "hospital-management-syst-91ed7",
  storageBucket: "hospital-management-syst-91ed7.firebasestorage.app",
  messagingSenderId: "131810457595",
  appId: "1:131810457595:web:0db04435810cd78d073d5e",
  measurementId: "G-RHQ2QN5439"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
