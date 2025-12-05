import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';

import { yCollab } from 'y-codemirror.next';
import { YjsWebsocketService } from '../../core/services/yjs-websocket.service';
import { RoomService } from '../../core/services/room.service';
import { AiCompletionService } from '../../core/services/ai-completion.service';

import * as acorn from 'acorn';

@Component({
  selector: 'app-editor',
  imports: [CommonModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css'],
})
export class Editor implements OnInit, AfterViewInit, OnDestroy {
  roomId: string = '';

  code = signal<string>(`// Welcome to CodeMirror 6
function initialize() {
  console.log("You can start coding right away!");
}`);

  cursorLine = signal(1);
  cursorCol = signal(1);

  lineNumbers = computed(() =>
    Array.from({ length: this.code().split('\n').length }, (_, i) => i + 1)
  );

  editorView!: EditorView;

  @ViewChild('editorContainer')
  editorContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private wsService: YjsWebsocketService,
    private roomService: RoomService,
    private ai: AiCompletionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.roomId = params.get('roomId') ?? 'unknown';

      await this.wsService.connect(this.roomId);

      if (this.editorView) this.editorView.destroy();

      this.initializeCodeMirror();
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.editorView) this.editorView.destroy();
    this.wsService.destroy();
  }

  private extractIdentifiers(codeText: string): string[] {
    const ids = new Set<string>();

    try {
      const tree = acorn.parse(codeText, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      }) as unknown as acorn.Node;

      const walk = (node: unknown): void => {
        if (!node || typeof node !== 'object') return;

        const n = node as any;

        if (n.type === 'VariableDeclarator' && n.id?.name) ids.add(n.id.name);
        if (n.type === 'FunctionDeclaration' && n.id?.name) ids.add(n.id.name);
        if (n.type === 'ClassDeclaration' && n.id?.name) ids.add(n.id.name);

        for (const k of Object.keys(n)) walk(n[k]);
      };

      walk(tree);
    } catch {
      const regex = /\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
      let match: RegExpExecArray | null = null;
      while ((match = regex.exec(codeText))) ids.add(match[1]);
    }

    return [...ids];
  }

  private buildSnippets(): Completion[] {
    return [
      {
        label: 'if (condition) { ... }',
        type: 'keyword',
        apply: 'if (condition) {\n\t$0\n}',
      },
      {
        label: 'for (let i = 0; i < len; i++) { ... }',
        type: 'keyword',
        apply: 'for (let i = 0; i < array.length; i++) {\n\t$0\n}',
      },
      {
        label: 'for (const item of array) { ... }',
        type: 'keyword',
        apply: 'for (const item of array) {\n\t$0\n}',
      },
      {
        label: 'array.map((item) => { ... })',
        type: 'function',
        apply: 'array.map((item) => {\n\treturn $0\n})',
      },
      {
        label: 'array.filter((item) => { ... })',
        type: 'function',
        apply: 'array.filter((item) => {\n\treturn $0\n})',
      },
      {
        label: 'array.reduce((acc, item) => { ... }, initial)',
        type: 'function',
        apply: 'array.reduce((acc, item) => {\n\treturn acc\n}, initial)',
      },
      {
        label: 'async function name() { ... }',
        type: 'keyword',
        apply: 'async function name() {\n\t$0\n}',
      },
      {
        label: 'try { } catch (e) { }',
        type: 'keyword',
        apply: 'try {\n\t$0\n} catch (e) {\n\tconsole.error(e)\n}',
      },
      {
        label: 'arrow function',
        type: 'function',
        apply: '(args) => {\n\t$0\n}',
      },
      {
        label: 'console.log',
        type: 'function',
        apply: 'console.log($0)',
      },
    ];
  }

  private applySnippet(template: string, from: number, to: number): (view: EditorView) => boolean {
    return (view: EditorView): boolean => {
      const markerIndex = template.indexOf('$0');
      const clean = template.replace(/\$0/g, '');

      view.dispatch({
        changes: { from, to, insert: clean },
      });

      const cursor = from + (markerIndex >= 0 ? markerIndex : clean.length);

      view.dispatch({
        selection: { anchor: cursor },
      });

      return true;
    };
  }

  private async fullCompletionProvider(
    context: CompletionContext
  ): Promise<CompletionResult | null> {
    const match = context.matchBefore(/\w*(\.)?\w*/);
    if (!match && !context.explicit) return null;

    const from = match ? match.from : context.pos;
    const doc = context.state.doc.toString();
    const pos = context.pos;

    const ids = this.extractIdentifiers(doc);

    const variableOptions: Completion[] = ids.map((name) => ({
      label: name,
      type: 'variable',
      apply: name,
      boost: 80,
    }));

    const staticOptions: Completion[] = this.buildSnippets().map((s) => ({
      ...s,
      boost: 40,
    }));

    let aiOptions: Completion[] = [];

    try {
      const result = await this.ai.getCompletions({
        fullText: doc,
        cursorPosition: pos,
      });

      if (result?.suggestions?.length) {
        aiOptions = result.suggestions.map((s) => ({
          label: s.label.length > 80 ? s.label.slice(0, 77) + '...' : s.label,
          type: 'ai',
          apply: s.label,
          boost: 100,
        }));
      }
    } catch {}

    const all: Completion[] = [];
    const used = new Set<string>();

    const add = (c: Completion | null | undefined): void => {
      if (!c || !c.label) return;
      if (used.has(c.label)) return;
      used.add(c.label);
      all.push(c);
    };

    aiOptions.forEach(add);
    variableOptions.forEach(add);
    staticOptions.forEach(add);

    if (all.length === 0) return null;

    const options: Completion[] = all.map((opt) => {
      if (typeof opt.apply === 'string' && opt.apply.includes('$0')) {
        return {
          ...opt,
          apply: this.applySnippet(opt.apply, from, pos),
        };
      }
      return opt;
    });

    return {
      from,
      options,
      validFor: /\w*(\.)?\w*/,
    };
  }

  private initializeCodeMirror(): void {
    const text = this.wsService.getSharedText('codemirror');
    const awareness = this.wsService.getAwareness();

    const autocompleteExt = autocompletion({
      override: [this.fullCompletionProvider.bind(this)],
      activateOnTyping: true,
      defaultKeymap: true,
    });

    const state = EditorState.create({
      doc: text.toString(),
      extensions: [
        history(),
        oneDark,
        javascript(),
        yCollab(text, awareness),
        autocompleteExt,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) this.code.set(update.state.doc.toString());
          if (update.selectionSet) this.updateCursor(update.state);
        }),
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement,
    });

    this.updateCursor(this.editorView.state);
  }

  updateCursor(state: EditorState): void {
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    this.cursorLine.set(line.number);
    this.cursorCol.set(pos - line.from + 1);
  }
}
