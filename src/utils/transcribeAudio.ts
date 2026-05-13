import { z } from 'zod/v4';

const TranscriptionResponseSchema = z.object({ text: z.string() });

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export async function transcribeAudio(audioUri: string): Promise<string> {
  const fileResponse = await fetch(audioUri);
  const blob = await fileResponse.blob();

  const formData = new FormData();
  formData.append('file', blob, 'recording.m4a');
  formData.append('model', 'whisper-large-v3-turbo');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY ?? ''}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed (${response.status})`);
  }

  const data = TranscriptionResponseSchema.parse(await response.json());
  return data.text.trim();
}
