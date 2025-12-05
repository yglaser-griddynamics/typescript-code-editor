import { describe, it, expect } from 'vitest';
import { mergeCompletions } from './merge';
import { Completion } from '@codemirror/autocomplete';

describe('mergeCompletions', () => {
  // Added explicit types for arguments
  const mockItem = (label: string, type: string): Completion => ({
    label,
    type,
    apply: label,
  });

  it('should merge unique items from multiple sources', () => {
    const snippets = [mockItem('if', 'keyword')];
    const ai = [mockItem('params', 'variable')];

    const result = mergeCompletions(snippets, ai);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.label)).toEqual(['if', 'params']);
  });

  it('should prioritize the first list when duplicates exist', () => {
    const snippets = [mockItem('map', 'snippet')];
    const ai = [mockItem('map', 'ai')];

    const result = mergeCompletions(snippets, ai);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('snippet');
  });

  it('should ignore invalid items', () => {
    const list = [
      mockItem('valid', 'text'),
      { label: '' } as Completion,
      null as unknown as Completion,
    ];

    const result = mergeCompletions(list);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('valid');
  });
});
