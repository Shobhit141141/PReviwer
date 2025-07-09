import { Request, Response } from 'express';
import Playground from '../models/playground.model';
import { testLLMConnection } from '../utils/llmTest';
import { PR_TEMPLATES } from '../data/prTemplates';
import { decrypt, encrypt } from '../utils/encrypt_decrypt';

export const configureModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { llm_provider, llm_model, llm_api_key, system_prompt, secondary_system_prompt } = req.body;
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const configData = {
      llm_provider,
      llm_model,
      llm_api_key: encrypt(llm_api_key),
      system_prompt,
      secondary_system_prompt
    };

    // Update or create the user's playground configuration
    const savedConfig = await Playground.findOneAndUpdate(
      { user: req.user.id },
      { $set: configData, $setOnInsert: { user: req.user.id } },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Model configured successfully', data: savedConfig });
  } catch (err) {
    res.status(400).json({ error: 'Failed to configure model', details: err });
  }
};


export const testModelConnection = async (req: Request, res: Response): Promise<void> => {
  const { llm_provider, llm_model, llm_api_key } = req.body;
  try {
    const response = await testLLMConnection({ llm_provider, llm_model, llm_api_key });
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Test connection failed', details: err });
  }
};

export const testSystemPrompt = async (req: Request, res: Response): Promise<void> => {
  const { system_prompt, llm_provider, llm_model, llm_api_key } = req.body;
  try {
    const results = await Promise.all(
      Object.entries(PR_TEMPLATES).map(async ([type, prompt]) => {
        const response = await testLLMConnection({ llm_provider, llm_model, llm_api_key, system_prompt, user_input: prompt });
        return { type, prompt, response };
      })
    );
    res.status(200).json({ results });

  } catch (err) {
    console.error('Prompt testing error:', err);
    res.status(500).json({ error: 'Prompt testing failed', details: err });
  }
};

export const abTestPrompts = async (req: Request, res: Response): Promise<void> => {
  const {
    system_prompt,
    secondary_system_prompt,
    llm_provider,
    llm_model,
    llm_api_key
  } = req.body;
  const samplePrompt = PR_TEMPLATES.best;

  try {
    const [primaryResponse, secondaryResponse] = await Promise.all([
      testLLMConnection({ llm_provider, llm_model, llm_api_key, system_prompt, user_input: samplePrompt }),
      testLLMConnection({ llm_provider, llm_model, llm_api_key, system_prompt: secondary_system_prompt, user_input: samplePrompt }),
    ]);

    res.status(200).json({
      input: samplePrompt,
      primary: primaryResponse,
      secondary: secondaryResponse
    });
  } catch (err) {
    res.status(500).json({ error: 'AB test failed', details: err });
  }
};

export const savePrompts = async (req: Request, res: Response): Promise<void> => {
  const { system_prompt, secondary_system_prompt } = req.body;

  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const updated = await Playground.findOneAndUpdate(
      { user: req.user.id },
      { system_prompt, secondary_system_prompt },
      { new: true }
    );
    res.status(200).json({ message: 'Prompts updated', data: updated });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update prompts', details: err });
  }
};

export const getPlaygroundConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const config = await Playground.findOne({ user: req.user.id });
    if (!config) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    const configObj = config.toObject();
    if (configObj.llm_api_key) {
      configObj.llm_api_key = decrypt(configObj.llm_api_key);
    }
    res.status(200).json({ data: configObj });
  } catch (err) {
    res.status(400).json({ error: 'Failed to retrieve configuration', details: err });
  }
};