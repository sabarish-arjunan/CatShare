import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyD5BOq_3xjUbbnKdF5KFFeOj6FmvV6nWJ8",
  authDomain: "catshare-official.firebaseapp.com",
  projectId: "catshare-official",
  storageBucket: "catshare-official.firebasestorage.app",
  messagingSenderId: "787555935594",
  appId: "1:787555935594:web:d1540f197aa5eb25aab113",
  measurementId: "G-7FXCGVC777"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);

// Register service worker for FCM on web
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.warn('Service Worker registration failed (this is OK for development):', error);
      // Service worker registration is optional - app will still work without it
      return null;
    }
  }
  return null;
};

// Request notification permission and get token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return null;
    }

    // Try to register service worker (optional)
    try {
      await registerServiceWorker();
    } catch (swError) {
      console.warn('Service worker registration optional, continuing...');
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        const token = await getToken(messaging, {
          ...(registration && { serviceWorkerRegistration: registration })
        });
        console.log("FCM Token:", token);
        return token;
      } catch (tokenError) {
        console.warn("Could not get FCM token:", tokenError);
        return null;
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.warn("Error requesting notification permission:", error);
    return null;
  }
};

// Listen for incoming FCM messages
export const setupMessageListener = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log("Message received from Firebase:", payload);
    callback(payload);
  });
};

// Callable function to trigger rendering
export const triggerRenderingFunction = httpsCallable(functions, "triggerRendering");

export default app;
