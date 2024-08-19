import connectMongo from '../../../lib/mongodb';
import User from '../../models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await connectMongo();

      const { email, password } = req.body;
      console.log(req.body, 'from me bodyyyyy')
      const user = await User.findOne({ email });
      console.log(user, 'from me >>>>>>>>>>>>>>>>>user ')

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.setHeader('Set-Cookie', serialize('token', token, {
        httpOnly: true,
        secure: false, // Set to false for HTTP
        sameSite: 'lax', // Consider using 'lax' instead of 'strict' for better compatibility
        maxAge: 3600,
        path: '/',
      }));

      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error in login handler:', error);
      console.log(error, 'error')
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
