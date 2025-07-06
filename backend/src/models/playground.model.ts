import mongoose from 'mongoose';
import { CONSTANTS } from '../config/constants';
import { encrypt } from '../utils/encrypt_decrypt';

const playgroundSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  system_prompt: {
    type: String,
    required: true,
    default: 'You are a helpful assistant.',
  },
  secondary_system_prompt: {
    type: String,
    required: false,
    default: '',
  },
  llm_model: {
    type: String,
    required: true,
    enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini', 'claude-2', 'claude-instant-100k'],
  },
  llm_provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google'],
  },
  llm_api_key: {
    type: String,
    required: true,
  },
});

// Middleware to encrypt the llm_api_key using encrypt util function before saving the playground document
playgroundSchema.pre('save', async function (next) {
  if (this.isModified('llm_api_key')) {
    this.llm_api_key = await encrypt(this.llm_api_key);
  }
  next();
});

const Playground = mongoose.model('Playground', playgroundSchema);

export default Playground;
