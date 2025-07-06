import mongoose from 'mongoose';
import { encrypt } from '../utils/encrypt_decrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: 'https://www.gravatar.com/avatar/' },
  bio: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  github_refresh_token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  playground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playground',
  },
  firstTimeUser: { type: Boolean, default: true },
});

// Middleware to encrypt the github_refresh_token before saving the user document
userSchema.pre('save', function (next) {
  const user = this;
  if (user.isModified('github_refresh_token')) {
    user.github_refresh_token = encrypt(user.github_refresh_token);
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
