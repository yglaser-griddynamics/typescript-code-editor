import { Completion } from '@codemirror/autocomplete';
import { AiCompletionService } from '../../core/services/ai-completion.service';

export const fetchAiCompletions = async (
  ai: AiCompletionService,
  code: string,
  cursor: number
): Promise<Completion[]> => {
  try {
    const res = await ai.getCompletions({ fullText: code, cursorPosition: cursor });
    return (
      res.suggestions?.map((s) => ({
        label: s.label.slice(0, 80),
        type: 'ai',
        apply: s.label,
        boost: 100,
      })) ?? []
    );
  } catch {
    return [];
  }
};
