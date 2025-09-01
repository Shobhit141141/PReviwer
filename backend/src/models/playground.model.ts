import mongoose from 'mongoose';
import { MODELS_FOR_EVERY_PROVIDER } from '../config/enums.js';

const playgroundSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_prompt: { type: String, default: 'Please analyze this pull request based on the context provided in the system prompt.' },
  system_prompt: { type: String, default: 'You are a helpful assistant.' },
  secondary_system_prompt: { type: String, required: false, default: '' },
  llm_model: {
    type: String,
    validate: { validator: function (value: string): boolean { const provider = (this as any).llm_provider as keyof typeof MODELS_FOR_EVERY_PROVIDER; if (!provider || !MODELS_FOR_EVERY_PROVIDER[provider]) return false; return MODELS_FOR_EVERY_PROVIDER[provider].includes(value); }, message: 'llm_model is not valid for the selected llm_provider' }
  },
  llm_provider: { type: String, enum: ['openai', 'anthropic', 'google'] },
  llm_api_key: { type: String },
  temperature: { type: Number, min: 0, max: 2, default: 0.7 },
  max_tokens: { type: Number, default: 1000 },
  isConnectionValid: { type: Boolean, default: false },
});

const Playground = mongoose.model('Playground', playgroundSchema);

export default Playground;
