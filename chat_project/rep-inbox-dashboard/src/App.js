import React, { useState, useEffect } from 'react';
import RepInbox from './components/RepInbox/RepInbox';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Login from './components/Login/Login';
import io from 'socket.io-client';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from 'firebase/app';

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
const messaging = getMessaging(app);
const vapid_key = "BK5mGbPlwVFWZS9HE9derde-m3RFYUOH2Xki5e17glBx2v5OT3gbeOf9V0BQw37B0T8hp2mA8f9b5ZWONSgt4tE";
getToken(messaging, {vapidKey: vapid_key});


function App() 
{
  const [loged_in, set_loged_in] = useState(false);
  const [selected_chat, set_selected_chat] = useState(null);
  const [chats, set_chats] = useState([]);
  const [socket, set_socket] = useState(null); // State for the socket
  const [firebase_app, set_firebase_app] = useState(null);
  const [firebase_auth, set_firebase_auth] = useState(null);
  const [is_first_connection, set_is_first_connection] = useState(true);
  const [notifications, set_notifications] = useState([]);
  const[rep_id, set_rep_id] = useState(0);
  const [notification_permission, set_notification_permission] = useState(false);

  function requestPermission() 
  {
    console.log('Requesting permission...');
    Notification.requestPermission().then((permission) => 
    {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    });
  }


  // Effect for managing socket connection on login
  useEffect(() => 
  {
    if (loged_in) 
    {
      // Initialize socket connection
      const new_socket = io('https://chat-server-443722.uc.r.appspot.com/', { query: { rep_id } });
      set_socket(new_socket);

      if (is_first_connection)
      {
        set_is_first_connection(false);
        requestPermission();

        getToken(messaging, { vapidKey: vapid_key }).then((currentToken) => {
          if (currentToken) {
            // Send the token to your server and update the UI if necessary
            // ...
            new_socket.emit('new_rep_token', { id: rep_id, token: currentToken });
          } else {
            // Show permission request UI
            console.log('No registration token available. Request permission to generate one.');
            // ...
            requestPermission();
            new_socket.emit('new_rep_token', { id: rep_id, token: "permission" });
          }
        }).catch((err) => {
          console.log('An error occurred while retrieving token. ', err);
          new_socket.emit('new_rep_token', { id: rep_id, token: "null" });
          // ...
        });
        


        // Request chats for the representative
        new_socket.emit('get_chats', rep_id);

        // Listen for initial chat list
        new_socket.on('chat_list', (chatData) => {
          console.log("Received chat list:", chatData);
          set_chats(chatData);
        });
      }

      // Listen for new chats
      new_socket.on('new_chat', (chatData) => 
      {
        console.log("New chat received:", chatData);
        set_chats((prev_chats) => [...prev_chats, chatData]);
      });

      // Listen for new messages from customers
      new_socket.on('new_customer_message', (chatData) => 
      {
        console.log("New customer message received:", chatData);
        set_chats((prev_chats) =>
          prev_chats.map((chat) =>
            chat.chat_id === chatData.chat_id
              ? { ...chat, messages: [...chat.messages, chatData.message], unread_messages: chat.unread_messages + 1 }
              : chat
          )
        );

        if (selected_chat?.chat_id === chatData.chat_id) 
        {
          set_selected_chat((prev_chat) => ({
            ...prev_chat,
            messages: [...prev_chat.messages, chatData.message],
          }));

          // Reset unread messages for this chat to 0
          const updatedChats = chats.map((c) =>
            c.chat_id === chatData.chat_id ? { ...c, unread_messages: 0 } : c
          );
          set_chats(updatedChats);
        }
      });


      // Listen for Firebase Cloud Messages when app is in foreground
      onMessage(messaging, (payload) => 
      {
        console.log('Message received. ', payload);
        // Handle foreground notifications, for example:
        // - Update the state with new notifications
        // - Show a UI notification
        alert(payload.notification.body);
        // You can also set state to show notifications in the app
        const newNotification = payload.notification;
        set_notifications((prevNotifications) => [
          ...prevNotifications,
          newNotification
        ]);
      });

      // // Background message handler (when the app is in the background or closed)
      // onBackgroundMessage(messaging, (payload) =>  
      // {
      //     console.log("[firebase-messaging-sw.js] Received background message:", payload);

      //     const notificationTitle = payload.notification?.title || "New message!";
      //     const notificationOptions = {
      //     body: payload.notification?.body || "You have a new message in the chat."
      //   };
      //     // Show notification when the app is in the background or closed
      //     self.registration.showNotification(notificationTitle, notificationOptions);
      // });

      // Cleanup when the component unmounts or user logs out
      return () => 
      {
        new_socket.off('chat_list');
        new_socket.off('new_chat');
        new_socket.off('new_customer_message');
        new_socket.disconnect(); // Disconnect socket
        set_socket(null); // Reset socket state
      };
    }
  }, [loged_in, selected_chat, chats]); // Dependencies

  // Function to handle logout
  const handle_logout = () => 
  {
    //Delete the token from the server
    firebase_auth?.signOut();
    set_selected_chat(null);
    set_chats([]);
    set_is_first_connection(true);
    set_notification_permission(false);
    set_loged_in(false);
  };

  // Component rendering logic based on login status
  if (loged_in) 
  {
    return (
      <div className="app">
        <div className="container">
          <button onClick={handle_logout}>Logout</button>
          <div className="inbox-container">
            <h2>Inbox</h2>
            <RepInbox
              chats={chats}
              set_chats={set_chats}
              set_selected_chat={set_selected_chat}
            />
          </div>
          <div className="chat-container">
            <header>Chat Window</header>
            <div className="messages">
              <ChatWindow
                selected_chat={selected_chat}
                set_selected_chat={set_selected_chat}
                set_chats={set_chats}
                socket={socket}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } 
  else 
  {
    return (
      <div className="app">
        <div className="container">
          <Login
            set_loged_in={set_loged_in}
            set_firebase_app={set_firebase_app}
            set_firebase_auth={set_firebase_auth}
            set_rep_id={set_rep_id}
            set_notifications={set_notifications}
          />
        </div>
      </div>
    );
  }
}

export default App;
