import { initializeApp, getApps, getApp } from 'firebase/app';
import * as authSdk from 'firebase/auth';
import * as firestoreSdk from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: 'AIzaSyA8MqaZmUjsM5xFD57YEXxlT6YcnvY6DhM',
  authDomain: 'stopgame-35928.firebaseapp.com',
  projectId: 'stopgame-35928',
  storageBucket: 'stopgame-35928.firebasestorage.app',
  messagingSenderId: '133177193263',
  appId: '1:133177193263:web:c5813b8f119fdd3e5be7da',
  measurementId: 'G-E98X69D2KF',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = authSdk.getAuth(app);
export const firestore = firestoreSdk.getFirestore(app);
export { authSdk, firestoreSdk };

const emulator = ['localhost', '127.0.0.1'].includes(location.hostname)
  && new URLSearchParams(location.search).has('emulator');
if (emulator) {
  authSdk.connectAuthEmulator(auth, 'http://localhost:9099');
  firestoreSdk.connectFirestoreEmulator(firestore, 'localhost', 8080);
}

// Analytics failures must not prevent authentication or game play.
export const analyticsReady = emulator ? Promise.resolve(null) : isSupported()
  .then(supported => supported ? getAnalytics(app) : null)
  .catch(error => { console.warn('Analytics 초기화를 건너뛰었습니다.', error.code || error.message); return null; });
