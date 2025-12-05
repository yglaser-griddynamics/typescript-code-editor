import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { buildSnippets } from './snippets';
import { extractIdentifiers } from './identifiers';
import { mergeCompletions } from './merge';
import { fetchAiCompletions } from './ai-provider';

export const fullCompletion =
  (aiService: any) =>
  async (ctx: CompletionContext): Promise<CompletionResult | null> => {
    const match = ctx.matchBefore(/\w*(\.)?\w*/);
    if (!match && !ctx.explicit) return null;

    const from = match ? match.from : ctx.pos;
    const text = ctx.state.doc.toString();
    const pos = ctx.pos;

    const vars: Completion[] = extractIdentifiers(text).map((v) => ({
      label: v,
      type: 'variable',
      apply: v,
      boost: 80,
    }));

    const snippets = buildSnippets().map((s) => ({ ...s, boost: 40 }));
    const ai = await fetchAiCompletions(aiService, text, pos);

    const all = mergeCompletions(ai, vars, snippets);
    if (!all.length) return null;

    return {
      from,
      options: all,
      validFor: /\w*(\.)?\w*/,
    };
  };
