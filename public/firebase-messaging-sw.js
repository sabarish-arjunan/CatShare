// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5BOq_3xjUbbnKdF5KFFeOj6FmvV6nWJ8",
  authDomain: "catshare-official.firebaseapp.com",
  projectId: "catshare-official",
  storageBucket: "catshare-official.firebasestorage.app",
  messagingSenderId: "787555935594",
  appId: "1:787555935594:web:d1540f197aa5eb25aab113",
  measurementId: "G-7FXCGVC777"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'CatShare';
  const notificationOptions = {
    body: payload.notification?.body || 'Rendering Complete',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'firebase-notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked');
  event.notification.close();
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
