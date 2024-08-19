import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faClock, faCheckCircle, faTimesCircle, faUserFriends } from '@fortawesome/free-solid-svg-icons';

// Initialize the socket instance
const socket = io('http://localhost:3000'); // Adjust the URL to server's URL

const AllUsers = () => {
  const [users, setUsers] = useState([]); // All users fetched from API
  const [displayedUsers, setDisplayedUsers] = useState([]); // Users filtered by search query
  const [searchQuery, setSearchQuery] = useState(''); // Search query
  const [sentRequests, setSentRequests] = useState([]); // Track sent friend requests
  const [receivedRequests, setReceivedRequests] = useState([]); // Track received friend requests
  const [friends, setFriends] = useState([]); // Track friends
  const [currentUser, setCurrentUser] = useState(null); // Store current user's data

  useEffect(() => {
    // Fetch current user's data
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const user = await response.json();
        console.log(user, 'from all users')
        setCurrentUser(user);

        // Fetch friend requests sent by the current user
        const requestsResponse = await fetch(`/api/friend-requests/status?senderId=${user?._id}`);
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setSentRequests(requestsData.map(req => req.receiver._id)); // Store receiver IDs of sent requests
        }

        // Fetch friend requests received by the current user
        const receivedResponse = await fetch(`/api/friend-requests/status?receiverId=${user?._id}`);
        if (receivedResponse.ok) {
          const receivedData = await receivedResponse.json();
          setReceivedRequests(receivedData.map(req => req.sender._id)); // Store sender IDs of received requests
        }

        // Fetch current user's friends
        const friendsResponse = await fetch(`/api/friends?userId=${user?._id}`);
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.map(friend => friend._id)); // Store friend IDs
        }
      } catch (error) {
        console.error('Error fetching current user or requests:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();

        // Remove the logged-in user from the list of users
        const filteredUsers = data.filter(user => user._id !== currentUser?._id);

        setUsers(filteredUsers); // Store all users excluding the current user
        setDisplayedUsers(filteredUsers); // Initialize displayed users
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers(); // Fetch users when component mounts
  }, [currentUser]);

  useEffect(() => {
    // Filter users based on the search query
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedUsers(filtered); // Update displayed users
  }, [searchQuery, users]);

  const sendFriendRequest = async (userId) => {
    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    try {
      const response = await fetch('/api/friend-requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senderId: currentUser._id, receiverId: userId }),
      });

      if (response.ok) {
        // Emit the notification event to the server
        socket.emit('sendFriendRequest', {
          sender: currentUser,
          receiver: userId,
        });

        setSentRequests((prev) => [...prev, userId]); // Update state to reflect the sent request
      } else {
        const result = await response.json();
        console.error('Error:', result.message);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const getRequestId = async (userId) => {
    try {
      const response = await fetch(`/api/friend-requests/find?senderId=${userId}&receiverId=${currentUser._id}`);
      if (response.ok) {
        const data = await response.json();
        return data.requestId; // Assuming the API returns the requestId
      } else {
        console.error('Error fetching request ID:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching request ID:', error);
    }
    return null;
  };
  
  const handleAccept = async (userId) => {
    const requestId = await getRequestId(userId);
    if (!requestId) {
      console.error('No request ID found');
      return;
    }
  
    try {
      const response = await fetch('/api/friend-requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
  
      if (response.ok) {
        setFriends((prev) => [...prev, userId]); // Add to friends list
        setReceivedRequests((prev) => prev.filter(id => id !== userId)); // Remove from received requests
      } else {
        console.error('Error accepting friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };
  
  const handleDecline = async (userId) => {
    const requestId = await getRequestId(userId);
    if (!requestId) {
      console.error('No request ID found');
      return;
    }
  
    try {
      const response = await fetch('/api/friend-requests/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
  
      if (response.ok) {
        setReceivedRequests((prev) => prev.filter(id => id !== userId)); // Remove from received requests
      } else {
        console.error('Error declining friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };
  

  return (
    <div className="container mx-auto p-4">
      {currentUser && (
        <h2 className="text-xl font-bold mb-4">Logged in as: {currentUser.username}</h2>
      )}
      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded-lg w-full"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedUsers.map((user) => (
          <div key={user._id} className="bg-white shadow-lg rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-gray-500">{user.username.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.username}</h3>
              </div>
            </div>
            <div className="flex space-x-2">
              {friends.includes(user._id) ? (
                <FontAwesomeIcon icon={faUserFriends} size="lg" className="text-green-500" title="You are friends" />
              ) : receivedRequests.includes(user._id) ? (
                <>
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size="lg"
                    className="text-green-500 cursor-pointer"
                    title="Accept Friend Request"
                    onClick={() => handleAccept(user._id)}
                  />
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size="lg"
                    className="text-red-500 cursor-pointer"
                    title="Decline Friend Request"
                    onClick={() => handleDecline(user._id)}
                  />
                </>
              ) : sentRequests.includes(user._id) ? (
                <FontAwesomeIcon icon={faClock} size="lg" className="text-gray-500" title="Request Pending" />
              ) : (
                <button
                  onClick={() => sendFriendRequest(user._id)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Send Friend Request"
                >
                  <FontAwesomeIcon icon={faUserPlus} size="lg" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsers;
