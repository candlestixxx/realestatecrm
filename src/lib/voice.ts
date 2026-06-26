import { getVoiceConfig } from './voice-config';

export async function synthesizeSpeech(workspaceId: string, text: string): Promise<Buffer> {
  const config = await getVoiceConfig(workspaceId);

  if (config.provider === 'SIMULATION') {
    console.log(`[VoiceForge] [SIMULATION] Synthesizing speech: "${text.substring(0, 50)}..."`);
    // Return a dummy buffer representing an audio file in simulation mode
    return Buffer.from('simulated-audio-data');
  }

  if (config.provider === 'OPENAI') {
    const openAiApiKey = config.openAiApiKey || process.env.OPENAI_API_KEY?.trim();
    if (!openAiApiKey) {
      throw new Error('OpenAI API key is missing for VoiceForge pipeline.');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: config.openAiVoiceId || 'alloy',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI TTS Failed: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (config.provider === 'ELEVENLABS') {
    const elevenLabsApiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY?.trim();
    if (!elevenLabsApiKey || !config.elevenLabsVoiceId) {
      throw new Error('ElevenLabs API key or Voice ID is missing for VoiceForge pipeline.');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs TTS Failed: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('Unknown Voice Provider configured.');
}

// Placeholder for future STT (Speech-to-Text) functionality (e.g. Whisper)
export async function transcribeSpeech(workspaceId: string, audioBuffer: Buffer): Promise<string> {
  const config = await getVoiceConfig(workspaceId);

  if (config.provider === 'SIMULATION') {
    console.log(`[VoiceForge] [SIMULATION] Transcribing audio buffer...`);
    return "This is a simulated transcription of the audio.";
  }

  // Implementation for real OpenAI Whisper / AssemblyAI would go here
  throw new Error('STT Transcribe not yet fully implemented for remote providers.');
}
