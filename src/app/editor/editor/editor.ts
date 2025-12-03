// angular imports
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

// code mirror imports
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

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

  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;
  private editorView!: EditorView;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.roomId = params.get('roomId') ?? 'unknown';
    });
  }

  ngAfterViewInit(): void {
    const startState = EditorState.create({
      doc: this.code(),
      extensions: [
        history(),
        oneDark,
        javascript(),

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
  }

  private updateCursor(state: EditorState) {
    const sel = state.selection.main;
    const line = state.doc.lineAt(sel.head);

    this.cursorLine.set(line.number);
    this.cursorCol.set(sel.head - line.from + 1);
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
  }
}
