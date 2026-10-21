export type ListingStage =
  | 'Coming Soon'
  | 'Just Listed'
  | 'Open House'
  | 'Price Improvement'
  | 'Just Sold';

export class SocialCopyService {
  /**
   * Generates social media copy for a property listing.
   * Executes completion API requests if OPENAI_API_KEY is present.
   * Otherwise, it returns a templated string.
   */
  public static async generateSocialCopy(
    address: string,
    stage: ListingStage,
    highlights: string[]
  ): Promise<string> {
    const prompt = this.buildPrompt(address, stage, highlights);
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

    // Fallback template when no API keys are present (CI/CD / local mock mode)
    if (!apiKey) {
      const highlightsText = highlights.length > 0 ? `Highlights: ${highlights.join(', ')}` : '';
      return `Check out this amazing property at ${address}! Status: ${stage}. ${highlightsText} #RealEstate #ExcelLegacyTeam`;
    }

    // DeepSeek (default) or OpenAI — both are OpenAI-compatible.
    const baseUrl = process.env.DEEPSEEK_API_KEY
      ? 'https://api.deepseek.com/v1'
      : 'https://api.openai.com/v1';
    const model = process.env.DEEPSEEK_API_KEY ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat') : 'gpt-4';
    const providerLabel = process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI';

    try {
      // Execute live API request
      const response = await fetch(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a professional real estate marketing copywriter.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7
          }),
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json() as { choices?: { message?: { content?: string } }[] };
        if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
          return data.choices[0].message.content.trim();
        }
      }

      return `[API_ERROR] Unexpected payload format from ${providerLabel}`;
    } catch (error) {
      return `[API_ERROR] Failed to fetch live completion from ${providerLabel}`;
    }
  }

  /**
   * Constructs the prompt to send to the AI.
   */
  public static buildPrompt(address: string, stage: ListingStage, highlights: string[]): string {
    return `Generate an engaging social media post for a real estate listing.
Address: ${address}
Stage: ${stage}
Highlights: ${highlights.join(', ')}
Requirements: Include appropriate emojis, hashtags (#RealEstate, #ExcelLegacyTeam), and keep it brand-safe.`;
  }
}
