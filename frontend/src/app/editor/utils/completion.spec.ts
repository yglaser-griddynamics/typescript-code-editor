import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fullCompletion } from './completion';
import { Text } from '@codemirror/state';

describe('fullCompletion', () => {
  const mockAiService = { getCompletions: vi.fn() };
  // Typed as 'any' to avoid complex CodeMirror type setup in tests
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      pos: 5,
      state: { doc: Text.of(['const']) },
      matchBefore: vi.fn().mockReturnValue({ from: 0, to: 5, text: 'const' }),
      explicit: false,
    };
    vi.clearAllMocks();
  });

  it('should return null if not near a word', async () => {
    mockContext.matchBefore.mockReturnValue(null);
    const completionFn = fullCompletion(mockAiService as any);

    const result = await completionFn(mockContext);

    expect(result).toBeNull();
  });

  it('should return null if AI suggests nothing', async () => {
    mockAiService.getCompletions.mockResolvedValue({ suggestions: [] });
    const completionFn = fullCompletion(mockAiService as any);

    const result = await completionFn(mockContext);

    expect(result).toBeNull();
  });

  it('should strip markdown code blocks from the suggestion', async () => {
    mockAiService.getCompletions.mockResolvedValue({
      suggestions: [{ label: '```const x = 1```' }],
    });

    const completionFn = fullCompletion(mockAiService as any);
    const result = await completionFn(mockContext);

    expect(result?.options[0].apply).toBe('');
  });

  it('should format the valid suggestion correctly', async () => {
    mockAiService.getCompletions.mockResolvedValue({
      suggestions: [{ label: 'const a = 1;' }],
    });

    const completionFn = fullCompletion(mockAiService as any);
    const result = await completionFn(mockContext);

    expect(result).toEqual({
      from: 0,
      options: [
        {
          label: 'const a = 1;...',
          apply: 'const a = 1;',
          type: 'text',
          detail: 'AI',
          boost: 100,
        },
      ],
      filter: false,
    });
  });
});
