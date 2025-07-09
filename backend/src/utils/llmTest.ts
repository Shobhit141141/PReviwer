import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logInfo } from './logger';

type TestLLMOptions = {
  llm_provider: 'openai' | 'anthropic' | 'google';
  llm_model: string;
  llm_api_key: string;
  system_prompt?: string;
  user_input?: string;
};

export async function testLLMConnection({
  llm_provider,
  llm_model,
  llm_api_key,
  system_prompt = 'You are a helpful assistant.',
  user_input = 'Tell me a joke.'
}: TestLLMOptions): Promise<string> {
  try {
    if (llm_provider === 'openai') {
      const openai = new OpenAI({
        apiKey: llm_api_key,
      });

      const response = await openai.chat.completions.create({
        model: llm_model,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_input },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'No response received.';
    }

    if (llm_provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: llm_api_key,
      });

      const response = await anthropic.messages.create({
        model: llm_model,
        max_tokens: 1000,
        temperature: 0.7,
        system: system_prompt,
        messages: [
          { role: 'user', content: user_input },
        ],
      });

      return response.content[0]?.type === 'text' ? response.content[0].text : 'No response received.';
    }

    if (llm_provider === 'google') {
      const genAI = new GoogleGenerativeAI(llm_api_key);
      logInfo(`Using Google model: ${llm_model}`);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      // For Google, we combine system prompt and user input
      const prompt = system_prompt ? `${system_prompt}\n\n${user_input}` : user_input;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text() || 'No response received.';
    }

    throw new Error(`Unsupported provider: ${llm_provider}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`LLM connection failed: ${error.message}`);
    }
    throw new Error('LLM connection failed with unknown error');
  }
}

// Package.json dependencies you'll need to install:
/*
{
  "dependencies": {
    "openai": "^4.28.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "@google/generative-ai": "^0.2.0"
  }
}
*/

// Usage example:
/*
async function example() {
  try {
    const response = await testLLMConnection({
      llm_provider: 'openai',
      llm_model: 'gpt-4',
      llm_api_key: 'your-api-key',
      system_prompt: 'You are a helpful coding assistant.',
      user_input: 'Explain what TypeScript is.'
    });
    console.log(response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
*/