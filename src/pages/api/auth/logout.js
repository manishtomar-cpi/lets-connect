import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: false,  // Since your app is running on HTTP, set this to false
      sameSite: 'lax',  // You can adjust this as needed
      maxAge: -1,  // Invalidate the cookie immediately
      path: '/',  // Ensure this matches the original cookie path
    }));
    res.status(200).json({ message: 'Logout successful' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
