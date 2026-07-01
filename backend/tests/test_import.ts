import { initializeApp, getApps, deleteApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

console.log("cert exists:", !!cert);
console.log("getFirestore exists:", !!getFirestore);
console.log("getApps exists:", !!getApps);
console.log("deleteApp exists:", !!deleteApp);
