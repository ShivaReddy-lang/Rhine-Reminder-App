importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// IMPORTANT: replace the placeholders with your project's values here as well
firebase.initializeApp({
  apiKey: "AIzaSyACP_lh8BAVETokLJo2ks_XWIGGKylsQE8",
  authDomain: "rhine-reminder-cloud.firebaseapp.com",
  projectId: "rhine-reminder-cloud",
  storageBucket: "rhine-reminder-cloud.firebasestorage.app",
  messagingSenderId: "790993427305",
  appId: "1:790993427305:web:839e1fc24885b88fd2fbf8",
  measurementId: "G-N06E7HS3LP"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'Rhine Reminder';
  const opts = { body: payload.notification?.body || '', icon: '/assets/icon-192.svg' };
  self.registration.showNotification(title, opts);
});
