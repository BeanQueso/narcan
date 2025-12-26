const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
const AsyncStorage = require('@react-native-async-storage/async-storage');

const firebaseConfig = {
  //////////// Redacted for Security ////////////
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

module.exports = { db, auth };
