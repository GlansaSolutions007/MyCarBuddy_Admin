// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB1e_nM-v-G5EYZSrXjElyHo61I4qb5rNc",
  authDomain: "mycarbuddycustomer.firebaseapp.com",
  databaseURL: "https://mycarbuddycustomer-default-rtdb.firebaseio.com",
  projectId: "mycarbuddycustomer",
  storageBucket: "mycarbuddycustomer.firebasestorage.app",
  messagingSenderId: "98137449003",
  appId: "1:98137449003:web:f14e6f91c0126ef8f8806e",
  measurementId: "G-QG1DR5TCZN"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/assets/images/MyCarBuddy-Logo1.png',
    badge: '/assets/images/MyCarBuddy-Logo1.png',
    tag: payload.data?.tag || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.', event);

  event.notification.close();

  // Handle the click event
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});
