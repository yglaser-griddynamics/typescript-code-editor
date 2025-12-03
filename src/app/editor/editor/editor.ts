import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { minimalSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

@Component({
  selector: 'app-editor',

  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor implements OnInit {
  roomId: string = '';
  code = signal<string>(`// Welcome to CodeMirror 6
function initialize() {
  console.log("Syntax Highlighting is active!");
}`);

  cursorLine = signal(1);
  cursorCol = signal(1);
  lineNumbers = computed(() => {
    const lines = this.code().split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1);
  });

  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;
  private editorView!: EditorView;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.roomId = params.get('roomId') || 'unknown';
    });
  }

  ngAfterViewInit(): void {
    const startState = EditorState.create({
      doc: this.code(),
      extensions: [
        minimalSetup,
        javascript(),
        oneDark,
        EditorView.lineWrapping,

        EditorView.updateListener.of((update) => {
          if (update.docChanged) this.code.set(update.state.doc.toString());
          if (update.selectionSet) this.updateCursorStats(update.state);
        }),
      ],
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer.nativeElement,
    });
  }
  private updateCursorStats(state: EditorState): void {
    const selection = state.selection.main;
    const line = state.doc.lineAt(selection.head);

    this.cursorLine.set(line.number);
    this.cursorCol.set(selection.head - line.from + 1);
  }

  ngOnDestroy(): void {
    if (this.editorView) {
      this.editorView.destroy();
    }
  }
}
