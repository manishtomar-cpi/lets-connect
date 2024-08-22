const { createServer } = require('http');
const next = require('next');
const socketIo = require('socket.io');
const connectMongo = require('./lib/mongodb');
const Notification = require('./src/models/Notification');
const cors = require('cors');
const ChatMessage = require('./src/models/ChatMessage');
const winston = require('winston'); // For logging

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000; 

// Set up logging with winston
const logger = winston.createLogger({
    level: dev ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ],
});

app.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res);
    });

    const io = socketIo(server, {
        cors: {
            origin: dev ? '*' : 'http://13.48.57.71:3000/',  
            methods: ['GET', 'POST'],
            allowedHeaders: ['Authorization'],
            credentials: true
        }
    });

    global.io = io; // Make io globally accessible

    connectMongo();  // Ensure MongoDB is connected

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // Handling different socket events
        socket.on('sendFriendRequest', async ({ sender, receiver }) => {
            logger.debug(`sendFriendRequest event received: ${JSON.stringify({ sender, receiver })}`);

            try {
                io.to(receiver).emit('receiveNotification', {
                    type: 'friendRequest',
                    message: `${sender.username} sent you a friend request`,
                    senderId: sender._id,
                    receiverId: receiver,
                });
                logger.info(`Friend request notification emitted to receiver: ${receiver}`);
            } catch (error) {
                logger.error(`Error emitting friend request notification: ${error.message}`);
            }
        });

        socket.on('acceptFriendRequest', async ({ requestId, receiver }) => {
            logger.debug(`acceptFriendRequest event received: ${JSON.stringify({ requestId, receiver })}`);

            try {
                const notification = await Notification.findById(requestId).populate('senderId');
                if (notification) {
                    const senderId = notification.senderId._id;
                    io.to(senderId.toString()).emit('receiveNotification', {
                        type: 'friendRequestAccepted',
                        message: `${receiver.username} accepted your friend request.`,
                        senderId: receiver._id,
                        receiverId: senderId,
                        requestId: notification._id,
                    });
                    logger.info(`Friend request accepted notification emitted to sender: ${senderId}`);
                } else {
                    logger.warn(`Notification not found for requestId: ${requestId}`);
                }
            } catch (error) {
                logger.error(`Error handling acceptFriendRequest: ${error.message}`);
            }
        });

        socket.on('declineFriendRequest', async ({ requestId, receiver }) => {
            logger.debug(`declineFriendRequest event received: ${JSON.stringify({ requestId, receiver })}`);

            try {
                const notification = await Notification.findById(requestId).populate('senderId');
                if (notification) {
                    const senderId = notification.senderId._id;
                    io.to(senderId.toString()).emit('receiveNotification', {
                        type: 'friendRequestDeclined',
                        message: `${receiver.username} declined your friend request.`,
                        senderId: receiver._id,
                        receiverId: senderId,
                        requestId: notification._id,
                    });
                    logger.info(`Friend request declined notification emitted to sender: ${senderId}`);
                } else {
                    logger.warn(`Notification not found for requestId: ${requestId}`);
                }
            } catch (error) {
                logger.error(`Error handling declineFriendRequest: ${error.message}`);
            }
        });

        socket.on('sendMessage', async (messageData) => {
            const { sender, receiver, message, timestamp } = messageData;
            logger.debug(`sendMessage event received: ${JSON.stringify(messageData)}`);

            try {
                const chatMessage = new ChatMessage({ sender, receiver, message, timestamp });
                await chatMessage.save();
          
                socket.to(receiver).emit('receiveMessage', messageData);
                socket.emit('receiveMessage', messageData); 

                logger.info('Message saved and broadcasted.');
            } catch (error) {
                logger.error(`Error handling sendMessage event: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    server.listen(port, '0.0.0.0', (err) => {
        if (err) {
            logger.error(`Server failed to start: ${err.message}`);
            throw err;
        }
        logger.info(`> Ready on http://0.0.0.0:${port}`);
    });
});
