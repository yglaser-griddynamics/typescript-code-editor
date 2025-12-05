import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { AiCompletionService } from '../../core/services/ai-completion.service';

export function fullCompletion(ai: AiCompletionService) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const fullText = context.state.doc.toString();
    const cursor = context.pos;

    const result = await ai.getCompletions({ fullText, cursorPosition: cursor });

    if (!result?.suggestions?.length) {
      return null;
    }

    // clean AI output
    const raw = result.suggestions[0].label.replace(/```[\s\S]*?```/g, '').trim();

    return {
      from: word.from,
      options: [
        {
          label: raw.slice(0, 40) + '...',
          apply: raw,
          type: 'text',
          detail: 'AI',
          boost: 100,
        },
      ],
      filter: false,
    };
  };
}
