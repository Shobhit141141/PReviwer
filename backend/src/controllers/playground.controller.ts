import { Request, Response } from 'express';
import Playground from '../models/playground.model';
import { testLLMConnection } from '../utils/llmTest';
import { PR_TEMPLATES } from '../data/prTemplates';
import { decrypt, encrypt } from '../utils/encrypt_decrypt';

/**
 * Configure the LLM model and system prompts for the playground
 * /playground/configure - PRIVATE
 * This function saves the user's LLM configuration and system prompts.
 * @param req - Request object containing user configuration data
 * @param res - Response object to send the configuration result
 * @returns { message: 'Model configured successfully', data: savedConfig }
 */
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

/**
 * Test the LLM model connection with the provided configuration
 * /playground/test-connection - PRIVATE
 * This function tests the LLM connection using the provided configuration.
 * @param req - Request object containing LLM configuration data
 * @param res - Response object to send the test result
 * @returns { success: true, response: testResponse }
 */
export const testModelConnection = async (req: Request, res: Response): Promise<void> => {
  const { llm_provider, llm_model, llm_api_key } = req.body;
  try {
    const response = await testLLMConnection({ llm_provider, llm_model, llm_api_key });
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Test connection failed', details: err });
  }
};

/**
 * Test the system prompt with the LLM model
 * /playground/test-system-prompt - PRIVATE
 * This function tests the system prompt with the configured LLM model.
 * @param req - Request object containing system prompt and LLM configuration
 * @param res - Response object to send the test results
 * @returns { results: Array<{ type: string, prompt: string, response: string }> }
 */
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

/**
 * AB test two system prompts with the LLM model
 * /playground/ab-test - PRIVATE
 * This function tests two system prompts with the configured LLM model.
 * @param req - Request object containing system prompts and LLM configuration
 * @param res - Response object to send the AB test results
 * @returns { input: string, primary: string, secondary: string }
 */
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

/**
 * Save the system prompts for the user
 * /playground/save-prompts - PRIVATE
 * This function saves the user's system prompts to the database.
 * @param req - Request object containing system prompts
 * @param res - Response object to send the save result
 * @returns { message: 'Prompts updated', data: updatedConfig }
 */
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

/**
 * Get the user's playground configuration
 * /playground/config - PRIVATE
 * This function retrieves the user's playground configuration from the database.
 * @param req - Request object containing user information
 * @param res - Response object to send the configuration data
 * @returns { data: PlaygroundConfig }
 */
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