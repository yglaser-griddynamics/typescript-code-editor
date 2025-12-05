// editor.ts
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
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { yCollab } from 'y-codemirror.next';
import { Awareness } from 'y-protocols/awareness';
import { YjsWebsocketService } from '../../core/services/yjs-websocket.service';
import { RoomService } from '../../core/services/room.service';
import { AiCompletionService } from '../../core/services/ai-completion.service';
import { debouncePromise } from '../utils/debunce-utility';
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
  private debouncedAiCompletionSource: (
    context: CompletionContext
  ) => Promise<CompletionResult | null>;
  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private wsService: YjsWebsocketService,
    private roomService: RoomService,
    private aiCompletionService: AiCompletionService
  ) {
    this.debouncedAiCompletionSource = debouncePromise(this.getAiCompletions.bind(this), 300);
    console.log('Debounced AI Completion Source initialized', this.debouncedAiCompletionSource);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.roomId = params.get('roomId') ?? 'unknown';

      await this.wsService.connect(this.roomId);

      if (this.editorView) {
        this.editorView.destroy();
      }
      this.initializeCodeMirror();
    });
  }

  ngAfterViewInit(): void {}
  private async getAiCompletions(context: CompletionContext): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w*(\.)?\w*/);
    if (!word || (word.from === context.pos && !context.explicit)) {
      if (!context.explicit) return null;
    }

    const fullText = context.state.doc.toString();
    const cursorPosition = context.pos;

    const result = await this.aiCompletionService.getCompletions({
      fullText: fullText,
      cursorPosition: cursorPosition,
    });

    const completions: Completion[] = result.suggestions.map((suggestion) => ({
      label: suggestion.label,
      type: 'snippet',
      apply: suggestion.label,
    }));

    if (completions.length > 0) {
      return {
        from: word && word.text.length > 0 ? word.from : context.pos,
        options: completions,
        validFor: /\w*(\.)?\w*/,
      };
    }

    return null;
  }
  initializeCodeMirror(): void {
    const ytext = this.wsService.getSharedText('codemirror');

    const awareness = this.wsService.getAwareness();

    if (!awareness) {
      console.error('Awareness object is not available.');
      return;
    }

    const mockCompletion = autocompletion({
      override: [
        async (context) => {
          const word = context.matchBefore(/\w*/);
          if (!word) return null;

          return {
            from: word.from,
            options: [
              { label: 'console.log', type: 'function', apply: 'console.log()' },
              { label: 'setTimeout', type: 'function', apply: 'setTimeout(() => {}, 1000)' },
              { label: 'function', type: 'keyword' },
            ],
          };
        },
      ],
    });

    const aiCompletion = autocompletion({
      override: [this.debouncedAiCompletionSource],
      // Optional: Increase the delay to reduce API calls while typing rapidly
      // activateOnType: true,
      // maxRenderedOptions: 1
    });
    const startState = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        history(),
        oneDark,
        javascript(),
        yCollab(ytext, awareness),
        aiCompletion,

        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.code.set(update.state.doc.toString());
          }
          if (update.selectionSet) {
            this.updateCursor(update.state);
          }
        }),
      ],
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer.nativeElement,
    });

    this.updateCursor(this.editorView.state);
  }

  ngOnDestroy(): void {
    if (this.editorView) {
      this.editorView.destroy();
    }

    this.wsService.destroy();
  }

  updateCursor(state: EditorState) {
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    this.cursorLine.set(line.number);
    this.cursorCol.set(pos - line.from + 1);
  }
}
