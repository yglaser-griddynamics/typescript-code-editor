import { Completion } from '@codemirror/autocomplete';

export const mergeCompletions = (...lists: Completion[][]): Completion[] => {
  const out: Completion[] = [];
  const seen = new Set<string>();

  for (const group of lists) {
    for (const item of group) {
      if (!item?.label) continue;
      if (seen.has(item.label)) continue;
      seen.add(item.label);
      out.push(item);
    }
  }

  return out;
};
