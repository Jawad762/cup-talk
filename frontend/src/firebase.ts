import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cup-talk.firebaseapp.com",
  projectId: "cup-talk",
  storageBucket: "cup-talk.appspot.com",
  messagingSenderId: "748207238748",
  appId: "1:748207238748:web:e9d08c2921597c491d0099"
};

export const app = initializeApp(firebaseConfig);

