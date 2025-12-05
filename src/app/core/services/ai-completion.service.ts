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
    const prefix = payload.fullText.substring(0, payload.cursorPosition);
    const suffix = payload.fullText.substring(payload.cursorPosition);

    // Limit context size to avoid token limits (approx 1000 chars before/after)
    const MAX_CONTEXT = 1000;
    const cleanPrefix = prefix.slice(-MAX_CONTEXT);
    const cleanSuffix = suffix.slice(0, MAX_CONTEXT);

    if (cleanPrefix.trim().length === 0) {
      return { suggestions: [] };
    }

    const systemPrompt = `You are a highly intelligent JavaScript and TypeScript code completion engine.
Your specific task is to autocomplete the code at the cursor position based on Modern JavaScript (ES6+) standards.

Rules:
1. **Control Structures**: If the user types 'if', 'for', 'while', or 'switch', complete the syntax with correct parentheses and braces (e.g., 'if (condition) {').
2. **Array Methods**: If the user types array methods like '.map', '.filter', '.reduce', or '.sort', complete them with arrow functions (e.g., '((item) => item.id)').
3. **Logic**: Recognize logical operators like '&&', '||', and '??' and complete the expression logically.
4. **Formatting**: Return ONLY the raw code code to insert. Do NOT use markdown (no \`\`\`). Do NOT provide explanations.
5. **Context**: Use the provided code before and after the cursor to ensure syntactical correctness.
`;

    // We use a marker [CURSOR] to tell the LLM exactly where to generate code
    const userPrompt = `Complete the JavaScript code at the [CURSOR] marker. Return only the completion text.
    
Code Context:
${cleanPrefix}[CURSOR]${cleanSuffix}`;

    const apiPayload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const result = await this.fetchWithRetry(apiPayload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('AI Completion Result:', text);
      if (text) {
        // Strip markdown code fences if the LLM ignores instructions
        const cleaned = text
          .replace(/```(javascript|ts|js)?/g, '')
          .replace(/```/g, '')
          .trim();

        if (cleaned.length > 0) {
          return {
            suggestions: [
              {
                label: cleaned,
                type: 'snippet',
              },
            ],
          };
        }
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
    }

    return { suggestions: [] };
  }
}
