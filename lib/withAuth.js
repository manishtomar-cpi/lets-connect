import jwt from 'jsonwebtoken';

export const withAuth = (handler) => {
  return async (req, res) => {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
// hello 
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};
