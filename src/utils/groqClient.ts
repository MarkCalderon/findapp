import Groq from 'groq-sdk';

export const groqClient = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});
