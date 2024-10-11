import { generateAIResponse } from '../utils/geminiAI.js';

export const handlePrompt = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const aiResponse = await generateAIResponse(prompt);
    res.json({ result: aiResponse });
  } catch (error) {
    console.error('Error contacting Gemini API:', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while contacting Gemini' });
  }
};
