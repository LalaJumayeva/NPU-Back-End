const jsonwebtoken = require('jsonwebtoken');

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const authHeaders = req.header('Authorization');
    
    if (!authHeaders) {
      return res.status(401).json({ message: 'Invalid auth headers' });
    }

    try {
      const token = authHeaders.split(' ')[1];
      const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = jwtAuthMiddleware;