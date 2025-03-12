const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require("firebase-admin");

// Firebase admin SDK setup
var service_account = require('./firebase_key/firebase_credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: "https://business-chat-88712-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const notifications = admin.messaging();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io with CORS configuration
const io = socketIo(server, 
{
  cors: 
{
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const id_socket_map = new Map();

function get_chat_id(socket_id)
{
  return [...id_socket_map].find(([key, value]) => value === socket_id)?.[0];
}

function get_socket_id(chat_id)
{
  return [...id_socket_map].find(([key, value]) => key === chat_id)?.[1];
}
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => 
{
  res.send('Server is running...');
});

// Socket.IO setup
io.on('connection', (socket) => 
{
  console.log(`User connected: ${socket.id}`);
  // Get chat_id from query parameters and map it to the socket.id
  const chat_id = socket.handshake.query.chat_id;
  if (chat_id) //connecting from customer client 
  {
    id_socket_map.set(chat_id, socket.id);
    console.log("Chat ID:", get_chat_id(socket.id));
  }
  else if (socket.handshake.query.rep_id)
  { //Connecting from representative client
    // Get chats from Firestore
    rep_id = socket.handshake.query.rep_id;
    console.log("Representative ID:", rep_id);
    socket.on('get_chats', () => 
    {
      console.log("Fetching chats...");

      // Fetch the list of chats from Firestore
      db.collection('escalated_chats').get()
        .then((querySnapshot) => 
        {
          let chatData = [];
          querySnapshot.forEach((doc) => 
          {
            chatData.push({ chat_id: doc.id, messages: doc.data().messages, unread_messages: doc.data().messages.length});
          });
          console.log("Fetched chats:", chatData);
          // Emit the list of chats to the client
          socket.emit('chat_list', chatData);
        })
        .catch((error) => 
        {
          console.error("Error fetching chats:", error);
        });
    });
  }

  // Listen for new representative tokens
  socket.on('new_rep_token', (data) => 
  {
    if (data.token === "null")
    {
      console.log("Received null token for rep_id:", data.id);
      return;
    }
    if (data.token === "permission")
    {
      console.log("Received permission request for rep_id:", data.id);
      return;
    }
  console.log("Received new representative token:", data);

  // Save the token to Firestore, updating existing document if it exists
  db.collection('rep_tokens').doc(data.id).set({ token: data.token }, { merge: true })
    .then(() => 
    {
      console.log("Token saved to Firestore for rep_id:", data.id);
    })
    .catch((error) => 
    {
      console.error(`Error saving token for rep_id ${data.id}:`, error);
    });
  });

  //Delete token
  socket.on('delete_token', (data) =>
  {
    console.log("Received delete token request:", data.rep_id);

    // Delete the token from Firestore
    db.collection('rep_tokens').doc(data.rep_id).delete()
      .then(() => 
      {
        console.log("Token deleted from Firestore for rep_id:", data.rep_id);
      })
      .catch((error) => 
      {
        console.error(`Error deleting token for rep_id ${data.rep_id}:`, error);
      });
  });

  
  // Escalate chat
socket.on('escalate_chat', (data) => {
  console.log("Escalating chat:");
  const id = get_chat_id(socket.id);

  // Save the escalated chat to Firestore
  db.collection('escalated_chats').doc(id).set({ messages: data })
    .then(() => {
      console.log("Escalated chat saved to Firestore");
      socket.emit('chat_escalation_response', { status: "success" });

      // Send escalated chat to the representative
      io.emit('new_chat', { chat_id: id, messages: data, unread_messages: data.length });

      // Fetch all representative tokens and send notifications
      db.collection('rep_tokens').get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const token = doc.data().token;

            // Notification payload
            const message = {
              notification: {
                title: "New Escalated Chat",
                body: "A new chat has been escalated.",
              },
              token: token,
            };

            // Send notification
            notifications.send(message)
              .then(() => {
                console.log("Notification sent to token:", token);
              })
              .catch((error) => {
                console.error("Error sending notification to token:", token, error);
              });
          });
        })
        .catch((error) => {
          console.error("Error fetching rep_tokens:", error);
        });
    })
    .catch((error) => {
      console.error("Error saving escalated chat:", error);
      socket.emit('chat_escalation_response', { status: "error" });
    });
});




  // Listen for new messages from the representative
  socket.on('rep_message', (data) => 
  {
    console.log("Received message from representative:", data);

    // Save the message to Firestore
    db.collection('escalated_chats').doc(data.chat_id).update(
    {
      messages: admin.firestore.FieldValue.arrayUnion(data)
    })
      .then(() => 
      {
        console.log("Message saved to Firestore");
        dest_socket = get_socket_id(data.chat_id);
        console.log("Destination Socket ID:", dest_socket);
        // Send message to the customer
        io.to(dest_socket).emit('new_rep_message', data.message);
      })
      .catch((error) => 
      {
        console.error("Error saving message:", error);
      });
  });

  // Listen for new messages from the customer
  socket.on('send_customer_message', (data) => 
  {
    console.log("Received message from customer:", data);
    const id = get_chat_id(socket.id);
    // Save the message to Firestore
    db.collection('escalated_chats').doc(id).update(
    {
      messages: admin.firestore.FieldValue.arrayUnion(data)
    })
      .then(() => 
      {
        console.log("Message saved to Firestore");
        // Send message to the representative
        io.emit('new_customer_message', {chat_id: id, message: data});
      })
      .catch((error) => 
      {
        console.error("Error saving message:", error);
      });
  });

  // Disconnect event
  socket.on('disconnect', () => 
  {
    console.log(`User disconnected: ${socket.id}`);
    id_socket_map.forEach((value, key) => {
      if (value === socket.id) {
        id_socket_map.delete(key);
      }
    });

  });  
});


// Start the server
const port = process.env.PORT || 8080;
server.listen(port, () => 
{
  console.log(`Server running at http://localhost:${port}`);
});
