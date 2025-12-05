import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';

import { yCollab } from 'y-codemirror.next';
import { YjsWebsocketService } from '../../core/services/yjs-websocket.service';
import { AiCompletionService } from '../../core/services/ai-completion.service';

import { fullCompletion } from '../utils/completion';

@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.html',
  styleUrls: ['./editor.css'],
  imports: [CommonModule],
})
export class Editor implements OnInit, OnDestroy {
  @ViewChild('editorContainer') container!: ElementRef<HTMLDivElement>;
  public editorContainer!: ElementRef<HTMLDivElement>;

  editor!: EditorView;
  editorView!: EditorView;

  roomId = '';

  cursorLine = signal(1);
  cursorCol = signal(1);

  code = signal<string>(`// Welcome to CodeMirror 6
function initialize() {
  console.log("You can start coding right away!");
}`);

  lineNumbers = computed(() =>
    Array.from({ length: this.code().split('\n').length }, (_, i) => i + 1)
  );

  constructor(
    private route: ActivatedRoute,
    private ws: YjsWebsocketService,
    private ai: AiCompletionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (p) => {
      this.roomId = p.get('roomId') ?? 'room';
      await this.ws.connect(this.roomId);

      if (this.editorView) this.editorView.destroy();
      this.initEditor();
    });
  }

  private initEditor(): void {
    const ytext = this.ws.getSharedText('codemirror');
    const awareness = this.ws.getAwareness();
    this.editorContainer = this.container;

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        oneDark,
        javascript(),
        history(),
        yCollab(ytext, awareness),
        autocompletion({ override: [fullCompletion(this.ai)] }),
        keymap.of([...defaultKeymap, ...historyKeymap]),

        EditorView.updateListener.of((update) => {
          if (update.docChanged) this.code.set(update.state.doc.toString());
          if (update.selectionSet) this.updateCursor(update.state);
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: this.container.nativeElement,
    });

    this.editor = view;
    this.editorView = view;

    this.updateCursor(view.state);
  }


  updateCursor(state: EditorState): void {
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);

    this.cursorLine.set(line.number);
    this.cursorCol.set(pos - line.from + 1);
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    this.ws.destroy();
  }
}
