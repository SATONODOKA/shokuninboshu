import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const fbConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null;

export interface FirebaseInitResult {
  success: boolean;
  error?: string;
  app?: FirebaseApp;
  firestore?: Firestore;
}

export function ensureFirebase(): FirebaseInitResult {
  try {
    // Check if Firebase config is available
    if (!fbConfig.apiKey || !fbConfig.authDomain || !fbConfig.projectId) {
      return {
        success: false,
        error: 'Firebase configuration is incomplete. Check environment variables.',
      };
    }

    // Initialize Firebase app if not already initialized
    if (!firebaseApp) {
      if (getApps().length > 0) {
        firebaseApp = getApps()[0];
      } else {
        firebaseApp = initializeApp(fbConfig);
      }
    }

    // Initialize Firestore if not already initialized
    if (!db && firebaseApp) {
      db = getFirestore(firebaseApp);
    }

    return {
      success: true,
      app: firebaseApp,
      firestore: db || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Export initialized instances (may be null if not configured)
export { firebaseApp, db };

// Check Firebase status
export function getFirebaseStatus() {
  const envStatus = {
    apiKey: !!import.meta.env.VITE_FB_API_KEY,
    authDomain: !!import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: !!import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: !!import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: !!import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    appId: !!import.meta.env.VITE_FB_APP_ID,
    measurementId: !!import.meta.env.VITE_FB_MEASUREMENT_ID,
  };

  const allConfigured = Object.values(envStatus).every(v => v);
  
  return {
    envStatus,
    allConfigured,
    initialized: !!firebaseApp,
    firestoreAvailable: !!db,
  };
}

// Mask sensitive values for display
export function maskValue(value: string | undefined): string {
  if (!value) return '(not set)';
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}