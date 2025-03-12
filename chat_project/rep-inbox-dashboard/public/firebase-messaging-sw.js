import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase config 
const firebaseConfig = {
  apiKey: "AIzaSyBq7LsUFzX2TS-x25lYxRcztqh1MwW6jcA",
  authDomain: "business-chat-88712.firebaseapp.com",
  databaseURL: "https://business-chat-88712-default-rtdb.firebaseio.com",
  projectId: "business-chat-88712",
  storageBucket: "business-chat-88712.appspot.com",
  messagingSenderId: "240295545414",
  appId: "1:240295545414:web:88a007e5aefe8070b91847",
  measurementId: "G-MZYYL4DYVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Foreground message handler (when the app is open in the browser)
onMessage(messaging, (payload) => {
  console.log("[firebase-messaging-sw.js] Received foreground message:", payload);
  
  const notificationTitle = payload.notification?.title || "New message!";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new message in the chat."
  };

  // Display the notification in the foreground
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Background message handler (when the app is in the background or closed)
onBackgroundMessage(messaging, (payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const notificationTitle = payload.notification?.title || "New message!";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new message in the chat."
  };

  // Show notification when the app is in the background or closed
  self.registration.showNotification(notificationTitle, notificationOptions);
});
