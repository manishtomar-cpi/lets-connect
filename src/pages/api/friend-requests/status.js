import connectMongo from '../../../../lib/mongodb';
import FriendRequest from '../../../models/FriendRequest';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await connectMongo();

    const { senderId, receiverId } = req.query;

    try {
        // Validate senderId and receiverId
        if (senderId && !mongoose.Types.ObjectId.isValid(senderId)) {
            return res.status(400).json({ error: 'Invalid senderId' });
        }
        if (receiverId && !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ error: 'Invalid receiverId' });
        }

        let requests;
        if (senderId) {
            requests = await FriendRequest.find({ sender: senderId, status: 'pending' }).populate('receiver', 'username');
        } else if (receiverId) {
            requests = await FriendRequest.find({ receiver: receiverId, status: 'pending' }).populate('sender', 'username');
        } else {
            return res.status(400).json({ error: 'Either senderId or receiverId must be provided' });
        }

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ message: 'Error fetching friend requests' });
    }
}
