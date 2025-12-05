import { Injectable } from '@angular/core';

// --- AI Completion Service (Uses Gemini API) ---
@Injectable({ providedIn: 'root' })
export class AiCompletionService {
  private apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
  private apiKey = 'AIzaSyAZQAkffsDPNdEIzkcIhiawZuimhBXP9wo';
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
      "You are a highly efficient and concise JavaScript code completion engine. Based ONLY on the provided code context, return the single most probable and logically correct snippet to complete the user's thought. Do not provide explanations, surrounding syntax (like markdown code blocks or quotes), or multiple options. Only output the raw code snippet.";

    const userQuery = `Provide the single best JavaScript completion for the code that ends exactly here: \n\n\`\`\`javascript\n${context}\n\`\`\``;

    const apiPayload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const result = await this.fetchWithRetry(apiPayload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
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

    return { suggestions: [] };
  }
}
