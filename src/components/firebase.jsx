import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";

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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestPermission = async () => {
  try {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      throw new Error('Push messaging is not supported in this browser');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    // console.log("Service Worker registered:", registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: "BCONluQj8iMYw7M-xU9Wu0Omhtjpdp3oWbY-lqv5lcZKCKYZ3nBRefrcYaH8x4bdTycTCFtGKPmI-VLuufR4SCs",
      serviceWorkerRegistration: registration
    });

    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    // console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Firebase setup error:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
