import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiCompletionService {
  private apiUrl = environment.geminiUrl;
  private apiKey = environment.geminiApiKey;
  private readonly MAX_RETRIES = 3;

  private async fetchWithRetry(payload: any, retries: number = 0): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(payload, retries + 1);
      }
      throw error;
    }
  }

  async getCompletions(payload: {
    fullText: string;
    cursorPosition: number;
  }): Promise<{ suggestions: { label: string; type: string }[] }> {
    const context = payload.fullText.substring(0, payload.cursorPosition);

    if (context.trim().length === 0) {
      return { suggestions: [] };
    }

    const systemPrompt =
      'You are a highly efficient and concise JavaScript code completion engine. Based ONLY on the provided code context, return the single most probable and logically correct snippet.';

    const userQuery = `Provide the best JavaScript completion for the code that ends here:\n\n${context}`;

    const apiPayload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const result = await this.fetchWithRetry(apiPayload);
      console.log('result', result);
      let text =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        result.candidates?.[0]?.output_text ||
        result.candidates?.[0]?.content?.[0]?.text ||
        null;

      if (text) {
        console.log('text', text);
        return {
          suggestions: [
            {
              label: text.trim(),
              type: 'snippet',
            },
          ],
        };
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
    }
    console.log('is empty');
    return { suggestions: [] };
  }
}
