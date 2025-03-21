import { initializeApp } from 'firebase/app'; // Firebase v9.0.0
import { getAuth } from 'firebase/auth'; // Firebase v9.0.0
import { getFirestore } from 'firebase/firestore'; // Firebase v9.0.0
import { getMessaging, isSupported } from 'firebase/messaging'; // Firebase v9.0.0
import { FirebaseConfig, FirebaseServices } from '../../types/firebase.types';

/**
 * Firebase configuration object loaded from environment variables
 * Contains all necessary keys and IDs for setting up Firebase services
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * Initializes all Firebase services and returns the initialized instances
 * @returns Object containing initialized Firebase service instances
 */
export const initializeFirebase = (): FirebaseServices => {
  // Initialize Firebase app with the configuration
  const app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication service
  const auth = getAuth(app);
  
  // Initialize Firebase Firestore database service
  const firestore = getFirestore(app);
  
  // Initialize Firebase Cloud Messaging as null
  // It will be initialized asynchronously if supported
  let messaging = null;
  
  // Create the services object to return
  const services: FirebaseServices = {
    app,
    auth,
    firestore,
    messaging
  };
  
  // Check if Firebase Cloud Messaging is supported and initialize it if it is
  // This happens asynchronously and will update the services.messaging property
  // when the Promise resolves
  isSupported()
    .then(supported => {
      if (supported) {
        // Update the messaging property if supported
        services.messaging = getMessaging(app);
        console.log('Firebase Cloud Messaging initialized successfully');
      } else {
        console.log('Firebase Cloud Messaging is not supported in this environment');
      }
    })
    .catch(error => {
      console.error('Error checking Firebase Cloud Messaging support:', error);
    });
  
  // Return the services object immediately
  // Note that messaging may still be null and will be updated asynchronously if supported
  return services;
};

/**
 * Initialized Firebase services for use throughout the application
 * Note: firebase.messaging may initially be null and will be updated asynchronously
 * if the browser supports Firebase Cloud Messaging
 */
export const firebase = initializeFirebase();