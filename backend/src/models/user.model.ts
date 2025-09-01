import mongoose from 'mongoose';
import { encrypt } from '../utils/encrypt_decrypt.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: 'https://www.gravatar.com/avatar/' },
  bio: { type: String, default: '' },
  email: { 
    type: String, 
    required: false, 
    unique: true, 
    sparse: true,
    default: undefined 
  },
  github_refresh_token: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  playground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playground',
  },
  firstTimeUser: { type: Boolean, default: true },
});

userSchema.pre('save', function (next) {
  const user = this;
  
  if (user.isModified('github_refresh_token') && user.github_refresh_token) {
    user.github_refresh_token = encrypt(user.github_refresh_token);
  }
    if (user.email === null || user.email === '') {
    user.email = undefined;
  }
    user.updatedAt = new Date();
  
  next();
});

userSchema.index({ email: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { 
    $and: [
      { email: { $exists: true } },
      { email: { $ne: null } },
      { email: { $ne: '' } }
    ]
  }
});

const User = mongoose.model('User', userSchema);

export default User;