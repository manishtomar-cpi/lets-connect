import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',  // Secure only in production
      sameSite: 'lax',  // Ensure compatibility across browsers
      maxAge: -1,  // Invalidate the cookie immediately
      path: '/',  // Ensure the cookie is cleared across the entire site
    }));
    res.status(200).json({ message: 'Logout successful' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
