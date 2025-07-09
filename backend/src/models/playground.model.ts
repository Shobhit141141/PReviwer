import mongoose from 'mongoose';
import { CONSTANTS } from '../config/constants';
import { encrypt } from '../utils/encrypt_decrypt';
import { MODELS_FOR_EVERY_PROVIDER } from '../config/enums';



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
    validate: {
      validator: function (value: string): boolean {
        const provider = (this as any).llm_provider as keyof typeof MODELS_FOR_EVERY_PROVIDER;
        if (!provider || !MODELS_FOR_EVERY_PROVIDER[provider]) return false;
        return MODELS_FOR_EVERY_PROVIDER[provider].includes(value);
      },
      message: 'llm_model is not valid for the selected llm_provider',
    },
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
  temperature: {
    type: Number,
    required: true,
    min: 0,
    max: 2,
    default: 0.7,
  },
  max_tokens: {
    type: Number,
    required: true,
    default: 1000,
  },
});

const Playground = mongoose.model('Playground', playgroundSchema);

export default Playground;
