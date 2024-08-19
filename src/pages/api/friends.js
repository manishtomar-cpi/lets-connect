import connectMongo from '../../../lib/mongodb';
import Friends from '../../models/friends';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await connectMongo();

  const { userId } = req.query;

  try {
    // Validate the userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    console.log('api hit>>>>>> for find friends');
    
    const friends = await Friends.find({
      $or: [
        { user1: userId, status: 'accepted' },
        { user2: userId, status: 'accepted' },
      ]
    }).populate('user1 user2', 'username');

    const friendList = friends.map(fr => fr.user1._id.toString() === userId ? fr.user2 : fr.user1);

    res.status(200).json(friendList);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
}
