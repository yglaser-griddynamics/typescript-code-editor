// src/app/editor/editor/editor.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorView } from '@codemirror/view';
import { EditorState, TransactionSpec } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

import { yCollab } from 'y-codemirror.next';
import { Awareness } from 'y-protocols/awareness';

import { YjsWebsocketService } from '../../core/services/yjs-websocket.service';
import { RoomHistoryService } from '../../core/services/room-history.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css'],
})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;

  code = signal<string>('');
  cursorLine = signal<number>(1);
  cursorCol = signal<number>(1);
  lineCount = computed(() => this.code().split('\n').length);

  private editorView: EditorView | null = null;
  private currentRoomId = 'default';
  private isViewInitialized = false;
  private awareness: Awareness | undefined;

  private saveTimer: any = null;
  private historyTimer: any = null;
  private lastSavedToStorage = '';

  private defaultCode = `// Welcome to CodeMirror 6
function initialize() {
  console.log("You can start coding right away!");
}`;

  constructor(
    private route: ActivatedRoute,
    private wsService: YjsWebsocketService,
    private historyService: RoomHistoryService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const newRoom = params.get('roomId') ?? 'default';
      if (newRoom === this.currentRoomId && this.isViewInitialized) return;
      await this.saveCurrentRoomImmediate();
      await this.switchToRoom(newRoom);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.isViewInitialized = true;
    await this.switchToRoom(this.currentRoomId);
    window.addEventListener('storage', this.onStorageEvent);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorageEvent);
    this.saveCurrentRoomImmediate();
    if (this.editorView) {
      try {
        this.editorView.destroy();
      } catch (e) {}
      this.editorView = null;
    }
    try {
      this.wsService.destroy();
    } catch (e) {}
  }

  private async switchToRoom(roomId: string) {
    this.currentRoomId = roomId;
    await this.wsService.connectRoom(roomId);
    const ytext = this.wsService.getSharedText('codemirror');
    this.awareness = this.wsService.getAwareness();
    const STORAGE_KEY = this.storageKey(roomId);
    const local = localStorage.getItem(STORAGE_KEY);
    this.wsService.ydoc.transact(() => {
      if (local !== null && ytext.toString() !== local) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, local);
      } else if (ytext.length === 0) {
        ytext.insert(0, this.defaultCode);
      }
    });
    const initialText = ytext.toString();
    this.code.set(initialText);
    this.lastSavedToStorage = local ?? initialText;
    if (!this.editorView) {
      this.createEditorView(initialText, ytext, this.awareness);
      return;
    }
    const newState = EditorState.create({
      doc: initialText,
      extensions: this.buildExtensions(ytext, this.awareness),
    });
    this.editorView.setState(newState);
    this.updateCursor(this.editorView.state);
  }

  private createEditorView(initialText: string, ytext: any, awareness?: any) {
    const startState = EditorState.create({
      doc: initialText,
      extensions: this.buildExtensions(ytext, awareness),
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer.nativeElement,
    });

    this.updateCursor(this.editorView.state);
  }

  private buildExtensions(ytext: any, awareness?: any) {
    const STORAGE_KEY = this.storageKey(this.currentRoomId);

    const mockCompletion = autocompletion({
      override: [
        async (ctx) => {
          const word = ctx.matchBefore(/\w*/);
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

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();

        this.code.set(text);

        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
          if (this.lastSavedToStorage !== text) {
            localStorage.setItem(STORAGE_KEY, text);
            this.lastSavedToStorage = text;
          }
        }, 300);

        clearTimeout(this.historyTimer);
        this.historyTimer = setTimeout(() => {
          try {
            this.historyService.saveSnapshot(this.currentRoomId, text);
          } catch (e) {
            console.warn('history save failed', e);
          }
        }, 2000);
      }

      if (update.selectionSet) {
        this.updateCursor(update.state);
      }
    });

    return [
      history(),
      oneDark,
      javascript(),
      yCollab(ytext, (awareness ?? ({} as any)) as any),
      mockCompletion,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      updateListener,
    ];
  }

  private onStorageEvent = (event: StorageEvent) => {
    const key = this.storageKey(this.currentRoomId);
    if (event.key !== key) return;

    const newVal = event.newValue ?? '';
    if (newVal === this.lastSavedToStorage) return;
    if (!this.wsService || !this.wsService.ydoc) return;

    const ytext = this.wsService.getSharedText('codemirror');
    if (ytext.toString() === newVal) {
      this.lastSavedToStorage = newVal;
      this.code.set(newVal);
      return;
    }
    this.wsService.ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, newVal);
    });

    this.lastSavedToStorage = newVal;
    this.code.set(newVal);
  };

  private storageKey(roomId: string) {
    return `editor_content_${roomId}`;
  }

  private updateCursor(state: EditorState) {
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    this.cursorLine.set(line.number);
    this.cursorCol.set(pos - line.from + 1);
  }

  private async saveCurrentRoomImmediate() {
    if (!this.editorView) return;
    try {
      const key = this.storageKey(this.currentRoomId);
      const text = this.editorView.state.doc.toString();
      localStorage.setItem(key, text);
      this.lastSavedToStorage = text;

      this.historyService.saveSnapshot(this.currentRoomId, text);
    } catch (e) {
      console.warn('save immediate failed', e);
    }
  }

  async restoreSnapshot(snapshotId: string) {
    const text = this.historyService.restoreSnapshot(this.currentRoomId, snapshotId);
    if (text == null || !this.editorView) return;

    const len = this.editorView.state.doc.length;
    const change: TransactionSpec = { changes: { from: 0, to: len, insert: text } };
    this.editorView.dispatch(change);
    localStorage.setItem(this.storageKey(this.currentRoomId), text);
    this.lastSavedToStorage = text;
    this.historyService.saveSnapshot(this.currentRoomId, text, 'restored');
  }
}
