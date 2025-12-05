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
import { YjsWebsocketService } from '../../core/services/yjs-websocket.service';
import { RoomService } from '../../core/services/room.service';
import { AiCompletionService } from '../../core/services/ai-completion.service';

@Component({
  selector: 'app-editor',
  imports: [CommonModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css'],
})
export class Editor implements OnInit, AfterViewInit, OnDestroy {
  private readonly DEBOUNCE_DELAY = 1;
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
  private debounceTimer: any = null;

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

  private getMockCompletions(context: CompletionContext): CompletionResult | null {
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
  }

  private async getAiCompletions(context: CompletionContext): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w*(\.)?\w*/);

    if (!word || (word.from === context.pos && !context.explicit)) {
      if (!context.explicit) return null;
    }

    try {
      const fullText = context.state.doc.toString();
      const cursorPosition = context.pos;

      const result = await this.aiCompletionService.getCompletions({
        fullText,
        cursorPosition,
      });

      if (result.suggestions && result.suggestions.length > 0) {
        const rawLabel = result.suggestions[0].label;

        const shortLabel = rawLabel.length > 50 ? rawLabel.substring(0, 47) + '...' : rawLabel;

        const completions: Completion[] = [
          {
            label: shortLabel,
            detail: '✨ AI',
            type: 'snippet',
            apply: rawLabel,
            boost: 99,
          },
        ];

        return {
          from: word ? word.from : context.pos,
          options: completions,
          filter: false,
        };
      }
    } catch (err) {}

    return this.getMockCompletions(context);
  }

  initializeCodeMirror(): void {
    const ytext = this.wsService.getSharedText('codemirror');
    const awareness = this.wsService.getAwareness();

    if (!awareness) {
      console.error('Awareness object is not available.');
      return;
    }

    const autocompleteWithAi = autocompletion({
      override: [this.getAiCompletions.bind(this)],
      icons: true,
      interactionDelay: 1,
    });
  
    const startState = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        history(),
        oneDark,
        javascript(),
        yCollab(ytext, awareness),
        autocompleteWithAi,
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
