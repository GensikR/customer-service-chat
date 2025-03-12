import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatWidget.css';
import { generate_response } from './bot';

// Generate chat ID
const chat_id = generate_id();
function generate_id() {
  return Math.random().toString(36).substr(2, 9);
}

// Initialize Socket.IO
const socket = io('https://chat-server-443722.uc.r.appspot.com/', { query: { chat_id } });

function ChatWidget() {
  const [messages, set_messages] = useState([]);
  const [input, set_input] = useState("");
  const [chat_needs_human, set_chat_needs_human] = useState(false);
  const messages_end_ref = useRef(null);

  // Scroll to the bottom of the chat window when new messages are added
  useEffect(() => {
    if (messages_end_ref.current) {
      messages_end_ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listener for 'new_rep_message'
  useEffect(() => {
    const handle_rep_message = (data) => {
      console.log("Received message from representative:", data);
      set_messages((prev_messages) => [
        ...prev_messages,
        { sender: "representative", ...data }
      ]);
    };

    socket.on('new_rep_message', handle_rep_message);

    // Cleanup the listener when the component unmounts
    return () => {
      socket.off('new_rep_message', handle_rep_message);
    };
  }, []);

  function send_message() {
    if (input.trim()) {
      const new_message = {
        sender: "user",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };

      set_messages((prev_messages) => [...prev_messages, new_message]);
      set_input("");

      if (!chat_needs_human) {
        const bot_reply = {
          sender: "bot",
          content: generate_response(input.trim()),
          timestamp: new Date().toISOString(),
        };
        set_messages((prev_messages) => [...prev_messages, bot_reply]);
      } else {
        // Send the message to the server for human escalation
        socket.emit('send_customer_message', new_message);
      }
    }
  }

  function escalate_chat() {
    const escalation_message = {
      sender: "bot",
      content: "A representative will be with you shortly.",
      timestamp: new Date().toISOString(),
    };

    const chat_to_escalate = [...messages, escalation_message];
    set_messages(chat_to_escalate);
    set_chat_needs_human(true); // Set flag to true

    // Send the escalated chat using Socket.IO
    socket.emit('escalate_chat', chat_to_escalate);
  }

  function handle_key_down(event) {
    if (event.key === "Enter") {
      send_message();
    }
  }

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${
              msg.sender === "representative" ? "representative" : msg.sender
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messages_end_ref} />
      </div>
      <div className="chat-widget-footer">
        <input
          type="text"
          value={input}
          onChange={(e) => set_input(e.target.value)}
          onKeyDown={handle_key_down}
          placeholder="Type a message..."
        />
        <button onClick={send_message}>Send</button>
        <button onClick={escalate_chat}>Get Human Help</button>
      </div>
    </div>
  );
}

export default ChatWidget;
