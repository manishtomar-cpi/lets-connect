import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';

const socket = io('http://13.48.57.71:3000/');


const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
// jefnjewejewkr
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          console.log('Current user fetched:', user);
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

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${currentUser?._id}`);
        const data = await response.json();
        console.log('Fetched Notifications:', data); // Debug: Log fetched notifications
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    socket.on('connect', () => {
      console.log('Connected to socket server with ID:', socket.id);
    });

    socket.on('receiveNotification', (notification) => {
      console.log('Real-time Notification received:', notification);
      setNotifications((prev) => {
        // Prevent duplicate notifications
        const exists = prev.find(n => n._id === notification._id);
        if (exists) return prev;
        return [...prev, notification];
      });
    });

    return () => {
      console.log('Cleaning up socket connection');
      socket.off('receiveNotification');
    };
  }, [currentUser]);

  const handleAccept = async (notif) => {
    console.log('Accept clicked:', notif.requestId); // This should now log the friend request ID
    try {
      const response = await fetch('/api/friend-requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: notif.requestId }), // Ensure this is the correct FriendRequest ID
      });
  
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id
              ? { ...n, message: `${notif.senderName || 'Someone'} is now your buddy.`, type: 'accepted' }
              : n
          )
        );
      } else {
        console.error('Error accepting friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };
  

  const handleDecline = async (notif) => {
    console.log('Decline clicked:', notif.requestId); // This should log the correct friend request ID
    try {
      const response = await fetch('/api/friend-requests/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: notif.requestId }), // Pass the correct FriendRequest ID here
      });
  
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id
              ? { ...n, message: `You declined ${notif.senderName || 'someone'}'s friend request.`, type: 'declined' }
              : n
          )
        );
      } else {
        console.error('Error declining friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };
  

  return (
    <div className="notifications p-4">
      <h3 className="text-xl font-bold mb-4">Notifications</h3>
      <ul>
        {notifications.map((notif, index) => (
          <li key={index} className="notification-card bg-white shadow-md rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-gray-800">{notif.message}</p>
              {/* <p className="text-gray-800">{notif.requestId}</p> */}
            </div>
            <div className="actions flex space-x-2">
            {notif.type === 'friendRequest' && notif.status === 'pending' && notif.receiverId === currentUser?._id && (
                <>
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size="lg"
                    className="text-green-500 cursor-pointer"
                    onClick={() => handleAccept(notif)}
                  />
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size="lg"
                    className="text-red-500 cursor-pointer"
                    onClick={() => handleDecline(notif)}
                  />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
