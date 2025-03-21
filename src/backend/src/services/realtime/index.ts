/**
 * Real-time Synchronization Services for the Metronomics Platform
 * 
 * This module exports services for handling real-time data synchronization 
 * across the application. It leverages Firebase Firestore for implementing
 * collaborative features such as live meeting updates, user presence tracking,
 * and real-time notifications.
 * 
 * @module services/realtime
 */

// Export the FirestoreService for low-level Firestore operations
export { FirestoreService } from './firestoreService';

// Export the RealtimeService for high-level real-time synchronization management
export { RealtimeService } from './realtimeService';