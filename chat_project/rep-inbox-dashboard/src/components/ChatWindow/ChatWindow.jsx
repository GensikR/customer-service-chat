import React, { useEffect, useRef, useState } from 'react';
import './ChatWindow.css';

function ChatWindow({ selected_chat, set_selected_chat, set_chats, socket }) {
  const [input, set_input] = useState('');
  const messages_end_ref = useRef(null);

  useEffect(() => {
    if (messages_end_ref.current) {
      messages_end_ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected_chat?.messages]);

  function send_message() {
    if (input.trim()) {
      const new_message = {
        sender: 'rep',
        content: input.trim(),
        timestamp: Date.now(),
      };

      set_chats((prev_chats) =>
        prev_chats.map((chat) =>
          chat.chat_id === selected_chat.chat_id
            ? { ...chat, messages: [...chat.messages, new_message] }
            : chat
        )
      );

      set_selected_chat((prev_chat) => ({
        ...prev_chat,
        messages: [...prev_chat.messages, new_message],
      }));

      socket.emit('rep_message', { chat_id: selected_chat.chat_id, message: new_message });
      set_input('');
    }
  }

  function handle_key_down(e) {
    if (e.key === 'Enter') {
      send_message();
    }
  }

  return (
    <div className="chat-widget">
      <div className="messages">
      {selected_chat?.messages?.map((message) => 
      (
        <div key={message.id} className={`message ${message.sender === 'rep' ? 'rep' : message.sender === 'bot' ? 'bot' : 'customer'}`}>
        {message.content}
        </div>

      )) || <p>No messages to display</p>}

        <div ref={messages_end_ref} />
      </div>
      <footer>
        <input
          type="text"
          value={input}
          onChange={(e) => set_input(e.target.value)}
          onKeyDown={handle_key_down}
          placeholder="Type a message..."
        />
        <button onClick={send_message}>Send</button>
      </footer>
    </div>
  );
}

export default ChatWindow;
