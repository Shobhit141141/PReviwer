import mongoose from 'mongoose';
import crypto from 'crypto';
import config from '../config/constants.js';
const algorithm = config.algorithm;
const key = Buffer.from(config.encryptionKey, 'utf-8');

if (key.length !== 32) {
  throw new Error('Invalid key length. Key must be 32 bytes for AES-256.');
}
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: Object,
    required: true
  },
  repo_prnumber: {
    type: [String],  // "repoName/prNumber"
    default: [],   
  }
});

userSchema.pre('save', function (next) {
  if (this.isModified('accessToken')) {
    const { iv, encryptedData } = encryptToken(this.accessToken);
    this.accessToken = { iv, encryptedData };
  }
  next();
});

const encryptToken = token => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
};

userSchema.methods.decryptAccessToken = function () {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(this.accessToken.iv, 'hex')
  );
  let decrypted = decipher.update(
    this.accessToken.encryptedData,
    'hex',
    'utf8'
  );
  decrypted += decipher.final('utf8');
  return decrypted;
};

userSchema.methods.compareAccessToken = function (token) {
  const decryptedAccessToken = this.decryptAccessToken();
  return decryptedAccessToken === token;
};

const User = mongoose.model('User', userSchema);

export default User;
