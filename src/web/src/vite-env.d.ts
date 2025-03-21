/// <reference types="vite/client" />

/**
 * Extension of Vite's ImportMetaEnv interface to add custom environment variables
 * for the Metronomics Platform frontend application.
 */
interface ImportMetaEnv {
  /**
   * Base URL for API requests
   */
  readonly VITE_API_BASE_URL: string;

  /**
   * Firebase configuration
   */
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  /**
   * Google OAuth configuration
   */
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_CLIENT_SECRET: string;
  readonly VITE_GOOGLE_REDIRECT_URI: string;

  /**
   * Microsoft OAuth configuration
   */
  readonly VITE_MICROSOFT_CLIENT_ID: string;
  readonly VITE_MICROSOFT_CLIENT_SECRET: string;
  readonly VITE_MICROSOFT_REDIRECT_URI: string;

  /**
   * Application environment settings
   */
  readonly VITE_APP_ENV: string;
  readonly VITE_DEBUG_MODE: string;

  /**
   * Honeycomb observability configuration
   */
  readonly VITE_HONEYCOMB_API_KEY: string;
  readonly VITE_HONEYCOMB_DATASET: string;
}

/**
 * Extension of Vite's ImportMeta interface to include the env property
 * with our custom environment variables.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}