import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
    const token = await getToken(messaging, {
      vapidKey: "BCONluQj8iMYw7M-xU9Wu0Omhtjpdp3oWbY-lqv5lcZKCKYZ3nBRefrcYaH8x4bdTycTCFtGKPmI-VLuufR4SCs", // from Firebase console
    });
    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Permission denied", err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
