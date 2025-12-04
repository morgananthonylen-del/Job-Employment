const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account has been banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ message: 'Please verify your email address' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireBusiness = (req, res, next) => {
  if (req.user.userType !== 'business') {
    return res.status(403).json({ message: 'Business account required' });
  }
  next();
};

const requireJobSeeker = (req, res, next) => {
  if (req.user.userType !== 'jobseeker') {
    return res.status(403).json({ message: 'Job seeker account required' });
  }
  next();
};

module.exports = {
  auth,
  requireEmailVerification,
  requireAdmin,
  requireBusiness,
  requireJobSeeker
};










