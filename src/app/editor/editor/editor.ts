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
import { YjsWebsocketService } from '../../core/services/YjsWebsocket.service';
import { RoomService } from '../../core/services/room.service';
import { AiCompletionService } from '../../core/services/AiCompletion.service';

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

  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private wsService: YjsWebsocketService,
    private roomService: RoomService,
    private aiCompletionService: AiCompletionService
  ) {}

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
  aiCompletionSource = async (context: CompletionContext): Promise<CompletionResult | null> => {
    const lastChar = context.state.sliceDoc(context.pos - 1, context.pos);
    const triggerChars = /[\w.]/;

    if (context.explicit || triggerChars.test(lastChar)) {
      const fullText = context.state.doc.toString();
      const cursorPosition = context.pos;

      const result = await this.aiCompletionService.getCompletions({
        fullText: fullText,
        cursorPosition: cursorPosition,
      });

      const completions: Completion[] = result.suggestions.map((suggestion) => ({
        label: suggestion.label,
        type: suggestion.type,
        apply: suggestion.label,
      }));

      if (completions.length > 0) {
        return {
          from: context.pos,
          options: completions,
        };
      }
    }

    return null;
  };
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
      override: [this.aiCompletionSource],
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
