import jwt from 'jsonwebtoken';
import connectMongo from '../../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
    console.log('in auth handler>>>>>>>>>>>>');
    console.log('MONGO_URI:', process.env.MONGO_URI);

    await connectMongo();

    const token = req.cookies.token;

    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.log('User not found for the given token');
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}
