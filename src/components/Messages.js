import React, { useEffect, useState } from 'react';
import Chat from './Chat'; // Import the Chat component
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faComments } from '@fortawesome/free-solid-svg-icons';

const socket = io('http://16.171.6.165:3000');


const Messages = () => {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null); // State to track selected friend

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          console.log('Fetched current user:', user); // Log the fetched current user
        } else {
          console.error('Failed to fetch current user');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchChattedFriends = async () => {
      try {
        const response = await fetch(`/api/chat/chatted-friends?userId=${currentUser?._id}`);
        if (response.ok) {
          const data = await response.json();
          setFriends(data);
          setFilteredFriends(data); // Initialize the filtered friends with chatted friends
          console.log('Fetched chatted friends:', data); // Log the fetched friends
        } else {
          console.error('Failed to fetch chatted friends');
        }
      } catch (error) {
        console.error('Error fetching chatted friends:', error);
      }
    };

    fetchChattedFriends();
  }, [currentUser]);

  useEffect(() => {
    const searchFriends = async () => {
      if (searchQuery === '') {
        setFilteredFriends(friends); // If search is empty, show chatted friends
        console.log('Search query empty, showing all chatted friends'); // Log this case
      } else {
        try {
          const response = await fetch(`/api/friends/search?userId=${currentUser?._id}&query=${searchQuery}`);
          if (response.ok) {
            const data = await response.json();
            setFilteredFriends(data); // Show search results
            console.log('Search results:', data); // Log the search results
          } else {
            console.error('Error searching friends');
          }
        } catch (error) {
          console.error('Error searching friends:', error);
        }
      }
    };

    if (currentUser) {
      searchFriends();
    }
  }, [searchQuery, friends, currentUser]);

  const startChat = (friend) => {
    setSelectedFriend(friend); // Set the selected friend
    console.log('Chat started with:', friend); // Log the selected friend
  };

  const goBackToFriends = () => {
    setSelectedFriend(null); // Deselect friend to go back to the friends list
    console.log('Back to friends list'); // Log the action
  };

  if (selectedFriend) {
    // If a friend is selected, render the Chat component
    return <Chat friend={selectedFriend} currentUser={currentUser} onBack={goBackToFriends} />;
  }

  return (
    <div className="messages-component p-4">
      <h2 className="text-xl font-bold mb-4">Messages</h2>
      <div className="search-bar mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search friends..."
          className="p-2 border border-gray-300 rounded-lg w-full"
        />
      </div>
      <div className="friends-list">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="friend-item bg-white shadow-lg rounded-lg p-4 mb-4 flex items-center justify-between cursor-pointer"
              onClick={() => startChat(friend)}
            >
              <span className="font-semibold">{friend.username}</span>
              <FontAwesomeIcon icon={faComments} size="lg" />
            </div>
          ))
        ) : (
          <p>No chats yet. Start chatting with your friends!</p>
        )}
      </div>
    </div>
  );
};

export default Messages;
