import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logDebug, logInfo } from './logger';
import { sys } from 'typescript';

type TestLLMOptions = {
  llm_provider: 'openai' | 'anthropic' | 'google';
  llm_model: string;
  llm_api_key: string;
  system_prompt?: string;
  user_input?: string;
};

const testCache = new Map<string, string>();

export async function useLLMConnection({
  llm_provider,
  llm_model,
  llm_api_key,
  system_prompt = 'You are a helpful assistant.',
  user_input = 'Tell me a joke.',
}: TestLLMOptions): Promise<string> {
  const cacheKey = `${llm_provider}:${llm_model}:${llm_api_key}`;

  const startTime = Date.now();

  const testPromise = (async () => {
    if (llm_provider === 'openai') {
      const openai = new OpenAI({ apiKey: llm_api_key });

      const response = await openai.chat.completions.create({
        model: llm_model,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_input },
        ],
        temperature: 0.5,
      });

      const result = response.choices[0]?.message?.content || 'No response.';
      testCache.set(cacheKey, result);
      return result;
    }

    if (llm_provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: llm_api_key });

      const response = await anthropic.messages.create({
        model: llm_model,
        max_tokens: 1000,
        temperature: 0.5,
        system: system_prompt,
        messages: [{ role: 'user', content: user_input }],
      });

      const result =
        response.content[0]?.type === 'text' ? response.content[0].text : 'No response.';
      testCache.set(cacheKey, result);
      return result;
    }

    if (llm_provider === 'google') {
      const genAI = new GoogleGenerativeAI(llm_api_key);      const genModel = genAI.getGenerativeModel({ model: llm_model });

      const result = await genModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${system_prompt}\n${user_input}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      });
     
      const text =
        typeof result.response.text === 'function'
          ? result.response.text()
          : result.response.text || 'No response.';
      testCache.set(cacheKey, text);
      return text;
    }

    throw new Error(`Unsupported provider: ${llm_provider}`);
  })();

  try {
    const result = await Promise.race([testPromise]);
    const timeTaken = Date.now() - startTime;
    logInfo(`✅ ${llm_provider} responded in ${timeTaken}ms`);
    return result;
  } catch (error: any) {
    console.error(`❌ ${llm_provider} test failed:`, error);
    const message = error instanceof Error ? error.message : 'LLM connection failed.';
    throw new Error(`❌ ${llm_provider} test failed: ${message}`);
  }
}
