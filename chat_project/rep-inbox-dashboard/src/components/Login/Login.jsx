// src/Login.js
import React, { useState, useEffect } from 'react';

// Firebase v9+ imports (modular)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getMessaging } from "firebase/messaging";

// Firebase config
const firebaseConfig = 
{
  apiKey: "AIzaSyBq7LsUFzX2TS-x25lYxRcztqh1MwW6jcA",
  authDomain: "business-chat-88712.firebaseapp.com",
  databaseURL: "https://business-chat-88712-default-rtdb.firebaseio.com",
  projectId: "business-chat-88712",
  storageBucket: "business-chat-88712.firebasestorage.app",
  messagingSenderId: "240295545414",
  appId: "1:240295545414:web:88a007e5aefe8070b91847",
  measurementId: "G-MZYYL4DYVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);
 

const Login = ({ set_loged_in, 
                 set_firebase_app,
                 set_firebase_auth,
                 set_rep_id,
                 set_notifications,
                  }) => 
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handle_login(e)
  {
    e.preventDefault();
    setError('');
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(() => set_states())
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }

  function set_states()
  {
    set_rep_id(email);
    set_notifications(messaging);
    set_firebase_app(app);
    set_firebase_auth(auth);
    set_loged_in(true);
  }

  
  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handle_login}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
