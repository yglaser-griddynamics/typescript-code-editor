import { Completion } from '@codemirror/autocomplete';

export const buildSnippets = (): Completion[] => [
  { label: 'if', type: 'keyword', apply: 'if (condition) {\n\t$0\n}' },
  { label: 'for', type: 'keyword', apply: 'for (let i = 0; i < n; i++) {\n\t$0\n}' },
  { label: 'map', type: 'function', apply: 'array.map(x => {\n\t$0\n})' },
  { label: 'filter', type: 'function', apply: 'array.filter(x => {\n\t$0\n})' },
  { label: 'log', type: 'function', apply: 'console.log($0)' },
];
