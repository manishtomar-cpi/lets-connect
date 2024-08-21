import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://13.60.33.49:3000/');


const Chat = ({ friend, currentUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverName, setReceiverName] = useState('');

  useEffect(() => {
    const fetchReceiverName = async () => {
      try {
        const response = await fetch(`/api/users/${friend?._id}`);
        const data = await response.json();
        console.log(data, 'Receiver data from chat');
        setReceiverName(data.username);
      } catch (error) {
        console.error('Error fetching receiver name:', error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/messages?userId=${currentUser?._id}&friendId=${friend?._id}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchReceiverName();
    fetchMessages();

    // Listen for real-time messages
    socket.on('receiveMessage', (message) => {
      console.log('New message received:', messageData);
      // Only add the message if it's not already in the state
      if (message.sender !== currentUser._id || message.receiver !== friend._id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [friend, currentUser]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      sender: currentUser._id,
      receiver: friend._id,
      message: newMessage,
      timestamp: new Date(),
    };

    // Emit the message directly via socket
    socket.emit('sendMessage', messageData);

    // Update the sender's chat immediately
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
  };

  return (
    <div className="chat-component p-4 bg-white shadow-lg rounded-lg">
      <div className="chat-header mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-blue-500">
          Back
        </button>
        <h2 className="text-lg font-semibold text-gray-700">
          {receiverName}
        </h2>
      </div>
      <div className="chat-history bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message mb-4 ${msg.sender === currentUser._id ? 'text-right' : 'text-left'}`}>
            <div className="text-xs text-gray-500 mb-1">
              {msg.sender === currentUser._id ? 'You' : receiverName}
            </div>
            <div className={`inline-block max-w-xs p-2 rounded-lg ${msg.sender === currentUser._id ? 'bg-gray-200 text-black' : 'bg-gray-300 text-black'}`}>
              <p>{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(msg.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-2 border border-gray-300 rounded-l-lg"
        />
        <button onClick={handleSendMessage} className="bg-blue-500 text-white p-2 rounded-r-lg">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
