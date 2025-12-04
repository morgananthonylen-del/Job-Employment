const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['jobseeker', 'business', 'admin'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bannedAt: {
    type: Date
  },
  // Job Seeker specific fields
  name: {
    type: String
  },
  birthday: {
    type: Date
  },
  phoneNumber: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  ethnicity: {
    type: String,
    enum: ['itaukei', 'indian', 'rotuman', 'others', '']
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  // Business specific fields
  companyName: {
    type: String
  },
  // Admin specific fields
  adminLevel: {
    type: String,
    enum: ['super', 'moderator']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);










