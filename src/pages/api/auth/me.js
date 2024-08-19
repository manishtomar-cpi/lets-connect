import jwt from 'jsonwebtoken';
import connectMongo from '../../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
    console.log('in auth>>>>>>>>>>>>')
  await connectMongo();

  const token = req.cookies.token;
console.log(token, 'token from me')
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
