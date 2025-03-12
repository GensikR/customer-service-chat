import React from 'react';
import './RepInbox.css';

function RepInbox({ chats, selected_chat_id, set_selected_chat, set_chats }) {
  function select_chat(chat) {
    // Reset the unread messages to 0 for the selected chat
    const updatedChats = chats.map((c) =>
      c.chat_id === chat.chat_id ? { ...c, unread_messages: 0 } : c
    );
    //update selected chat
    const updated_chat = updatedChats.find((c) => c.chat_id === chat.chat_id);
    // Update the state
    set_selected_chat(updated_chat);  // This will store the selected chat
    set_chats(updatedChats);   // This will update the chats array with the reset unread count
  }

  return (
    <div className="rep-inbox">
      <h2>Customer Chats</h2>
      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={`chat ${chat.chat_id === selected_chat_id ? 'selected' : ''} ${chat.unread_messages > 0 ? 'unread' : ''}`}
            onClick={() => select_chat(chat)}
          >
            <div className="chat-info">
              <h3>{chat.chat_id}</h3>
              <p>{chat.messages?.[chat.messages.length - 1]?.content || 'No messages yet'}</p>
            </div>
            <div className="chat-meta">
              <p>{chat.unread_messages > 0 ? `${chat.unread_messages} unread` : 'Read'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RepInbox;
