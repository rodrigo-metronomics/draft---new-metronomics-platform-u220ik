import { messaging } from './firebaseConfig';
import { FirebaseMessagingPayload, FirebaseMessagingToken } from '../../types/firebase.types';
import { 
  getToken, 
  deleteToken,
  onMessage, 
  isSupported, 
  getMessaging,
  MessagePayload 
} from 'firebase/messaging'; // Firebase v9.0.0

/**
 * Initializes Firebase Cloud Messaging if supported by the browser
 * @returns Promise that resolves to true if messaging is initialized successfully, false otherwise
 */
export const initializeMessaging = async (): Promise<boolean> => {
  // Check if the browser supports Firebase Cloud Messaging
  const isMessagingSupported = await isSupported().catch(error => {
    console.error('Error checking FCM support:', error);
    return false;
  });

  if (!isMessagingSupported) {
    console.log('Firebase Cloud Messaging is not supported in this browser');
    return false;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported in this browser');
    return false;
  }

  // Register service worker for background notifications
  const registration = await registerServiceWorker();
  
  if (!registration) {
    console.error('Failed to register service worker for Firebase Cloud Messaging');
    return false;
  }

  return true;
};

/**
 * Registers the service worker for handling background notifications
 * @returns Promise that resolves to the service worker registration or null if registration fails
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Requests permission to display browser notifications
 * @returns Promise that resolves to true if permission is granted, false otherwise
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return true;
  }

  // If permission is denied, we can't request it again
  if (Notification.permission === 'denied') {
    console.log('Notification permission was previously denied');
    return false;
  }

  // Otherwise, request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Gets the FCM token for the current device
 * @returns Promise that resolves to the messaging token or null if unavailable
 */
export const getMessagingToken = async (): Promise<FirebaseMessagingToken | null> => {
  if (!messaging) {
    console.error('Firebase messaging is not initialized');
    return null;
  }

  // Request permission first
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    console.log('Notification permission not granted');
    return null;
  }

  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
    });

    if (currentToken) {
      return {
        token: currentToken,
        createdAt: new Date()
      };
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving FCM token:', error);
    return null;
  }
};

/**
 * Deletes the current FCM token
 * @returns Promise that resolves to true if token is deleted successfully, false otherwise
 */
export const deleteMessagingToken = async (): Promise<boolean> => {
  if (!messaging) {
    console.error('Firebase messaging is not initialized');
    return false;
  }

  try {
    await deleteToken(messaging);
    console.log('FCM token deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    return false;
  }
};

/**
 * Sets up a listener for incoming FCM messages
 * @param callback Function to call when a message is received
 * @returns Unsubscribe function to remove the listener
 */
export const onMessageReceived = (
  callback: (payload: FirebaseMessagingPayload) => void
): (() => void) => {
  if (!messaging) {
    console.error('Firebase messaging is not initialized');
    return () => {}; // Return a no-op function
  }

  return onMessage(messaging, (payload: MessagePayload) => {
    const transformedPayload: FirebaseMessagingPayload = {
      notification: {
        title: payload.notification?.title || '',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon
      },
      data: payload.data || {},
      type: payload.data?.type || 'unknown',
      timestamp: Date.now()
    };

    callback(transformedPayload);
  });
};