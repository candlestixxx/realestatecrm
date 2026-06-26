'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { saveVoiceSettingsAction } from '@/lib/actions/voice-settings';
import { VoiceConfig } from '@/lib/voice-config';
import { Mic, Zap, Cpu, Loader2, Save } from 'lucide-react';

export function VoiceSettingsClient({ initialConfig }: { initialConfig: VoiceConfig }) {
  const [provider, setProvider] = useState<VoiceConfig['provider']>(initialConfig.provider);

  // ElevenLabs State
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(initialConfig.elevenLabsApiKey || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(initialConfig.elevenLabsVoiceId || '');

  // OpenAI State
  const [openAiApiKey, setOpenAiApiKey] = useState(initialConfig.openAiApiKey || '');
  const [openAiVoiceId, setOpenAiVoiceId] = useState(initialConfig.openAiVoiceId || 'alloy');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // If the user didn't modify the masked passwords, don't submit them to overwrite
      const payload: VoiceConfig = {
        provider,
        elevenLabsVoiceId,
        openAiVoiceId,
      };

      if (elevenLabsApiKey !== '********') {
        payload.elevenLabsApiKey = elevenLabsApiKey;
      }
      if (openAiApiKey !== '********') {
        payload.openAiApiKey = openAiApiKey;
      }

      const res = await saveVoiceSettingsAction(payload);

      if (res.success) {
        toast.success('Voice settings saved successfully.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OpenAI Card */}
        <div
          onClick={() => setProvider('OPENAI')}
          className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            provider === 'OPENAI'
              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
              : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${provider === 'OPENAI' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">OpenAI TTS</h3>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            Reliable text-to-speech with natural-sounding voices natively integrated with the ChatGPT agent.
          </p>
          <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${provider === 'OPENAI' ? 'border-primary' : 'border-muted-foreground/30'}`}>
            {provider === 'OPENAI' && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
        </div>

        {/* ElevenLabs Card */}
        <div
          onClick={() => setProvider('ELEVENLABS')}
          className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            provider === 'ELEVENLABS'
              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
              : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${provider === 'ELEVENLABS' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">ElevenLabs</h3>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            Hyper-realistic AI voice generator. Best for natural emotional cadence and voice cloning.
          </p>
          <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${provider === 'ELEVENLABS' ? 'border-primary' : 'border-muted-foreground/30'}`}>
            {provider === 'ELEVENLABS' && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
        </div>

        {/* Simulation Card */}
        <div
          onClick={() => setProvider('SIMULATION')}
          className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            provider === 'SIMULATION'
              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
              : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${provider === 'SIMULATION' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">Simulation Mode</h3>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            Mocks voice API calls for local development without consuming credits.
          </p>
          <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${provider === 'SIMULATION' ? 'border-primary' : 'border-muted-foreground/30'}`}>
            {provider === 'SIMULATION' && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
        </div>
      </div>

      {/* Provider Settings Panel */}
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
        {provider === 'OPENAI' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-border/50 pb-2">OpenAI Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Key</label>
                <input
                  type="password"
                  value={openAiApiKey}
                  onChange={(e) => setOpenAiApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Voice Model</label>
                <select
                  value={openAiVoiceId}
                  onChange={(e) => setOpenAiVoiceId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="alloy">Alloy (Neutral)</option>
                  <option value="echo">Echo (Warm)</option>
                  <option value="fable">Fable (Expressive)</option>
                  <option value="onyx">Onyx (Deep)</option>
                  <option value="nova">Nova (Energetic)</option>
                  <option value="shimmer">Shimmer (Clear)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              If the API Key is left blank, the system will fall back to the `OPENAI_API_KEY` defined in the global environment variables.
            </p>
          </div>
        )}

        {provider === 'ELEVENLABS' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-border/50 pb-2">ElevenLabs Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Key</label>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="sk_..."
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Voice ID</label>
                <input
                  type="text"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  placeholder="pNInz6obpgDQGcFmaJcg"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can find your Voice ID in the ElevenLabs VoiceLab dashboard.
            </p>
          </div>
        )}

        {provider === 'SIMULATION' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="p-4 bg-primary/10 rounded-full text-primary animate-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Simulation Active</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                The VoiceForge pipeline will process commands and log speech synthesis actions to the console without consuming real API credits.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border/50">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Voice Settings'}
        </button>
      </div>
    </form>
  );
}
