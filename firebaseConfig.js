const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
const AsyncStorage = require('@react-native-async-storage/async-storage');

const firebaseConfig = {
  apiKey: "AIzaSyDX0-DiQJUmQz4quhZri3d-c7LqGvHffQs",
  authDomain: "naloxonelocator-1a92e.firebaseapp.com",
  projectId: "naloxonelocator-1a92e",
  storageBucket: "naloxonelocator-1a92e.appspot.com",
  messagingSenderId: "160570111820",
  appId: "1:160570111820:web:2665cd28c7e7507dd581e9",
  measurementId: "G-E7XHRC189F"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

module.exports = { db, auth };
