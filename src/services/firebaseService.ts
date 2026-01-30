import { triggerRenderingFunction, setupMessageListener, requestNotificationPermission } from "../config/firebaseConfig";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface RenderingRequest {
  products: any[];
  userId: string;
  deviceId: string;
}

/**
 * Initialize Firebase messaging and request notification permissions
 */
export const initializeFirebaseMessaging = async () => {
  try {
    const isNative = Capacitor.getPlatform() !== "web";

    if (isNative) {
      // For native apps, request local notification permissions
      const permission = await LocalNotifications.requestPermissions();
      console.log("Local notification permission:", permission);
    } else {
      // For web, request FCM notification permissions
      const token = await requestNotificationPermission();
      if (token) {
        // Store token for later use
        localStorage.setItem("fcmToken", token);
      }
    }

    // Setup listener for incoming messages
    setupMessageListener((payload) => {
      handleFirebaseMessage(payload);
    });
  } catch (error) {
    console.error("Error initializing Firebase messaging:", error);
  }
};

/**
 * Handle incoming Firebase messages
 */
const handleFirebaseMessage = async (payload: any) => {
  const isNative = Capacitor.getPlatform() !== "web";

  const title = payload.notification?.title || "CatShare";
  const body = payload.notification?.body || "Rendering Complete";

  console.log("Handling Firebase message:", { title, body });

  if (isNative) {
    // Show local notification on native app
    try {
      await LocalNotifications.createChannel({
        id: "fcm_notification_channel",
        name: "Firebase Notifications",
        importance: 5,
        visibility: 1,
      });

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 10000),
            title: title,
            body: body,
            channelId: "fcm_notification_channel",
          },
        ],
      });
    } catch (error) {
      console.error("Error showing local notification:", error);
    }
  }

  // Dispatch custom event for app to listen
  window.dispatchEvent(
    new CustomEvent("firebaseNotification", {
      detail: { title, body, payload },
    })
  );
};

/**
 * Trigger background rendering on Firebase
 * This will send your products to Firebase Cloud Function for rendering
 */
export const triggerBackgroundRendering = async (products: any[], userId: string) => {
  try {
    const isNative = Capacitor.getPlatform() !== "web";
    const deviceId = localStorage.getItem("deviceId") || `device-${Date.now()}`;

    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", deviceId);
    }

    console.log("Triggering Firebase rendering...", { productCount: products.length });

    const request: RenderingRequest = {
      products,
      userId,
      deviceId,
    };

    const result = await triggerRenderingFunction(request);
    console.log("Firebase rendering triggered successfully:", result.data);

    return result.data;
  } catch (error) {
    console.error("Error triggering Firebase rendering:", error);
    throw error;
  }
};

/**
 * Get Firebase Cloud Messaging token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const isNative = Capacitor.getPlatform() !== "web";

    if (isNative) {
      // For native apps, return device ID
      return localStorage.getItem("deviceId") || null;
    } else {
      // For web, return stored FCM token
      return localStorage.getItem("fcmToken") || null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};
