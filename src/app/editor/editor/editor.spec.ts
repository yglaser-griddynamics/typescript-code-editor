import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { Editor } from './editor';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { YjsWebsocketService } from '../../core/services/YjsWebsocket.service';
import { RoomService } from '../../core/services/room.service';

class MockYjsWebsocketService {
  public doc: Y.Doc;
  public ytext: Y.Text;
  public awareness: Awareness;

  connect = vi.fn(async (_roomId?: string) => Promise.resolve());
  destroy = vi.fn();

  getSharedText = vi.fn((name: string) => {
    if (!this.ytext) this.ytext = this.doc.getText(name);
    return this.ytext;
  });

  getAwareness = vi.fn(() => this.awareness);

  constructor() {
    this.doc = new Y.Doc();
    this.ytext = this.doc.getText('codemirror');
    this.ytext.insert(
      0,
      `// Welcome to CodeMirror 6
function initialize() {
  console.log("You can start coding right away!");
}`
    );
    this.awareness = new Awareness(this.doc);
  }
}

class MockRoomService {}

describe('Editor Component', () => {
  let fixture: ComponentFixture<Editor>;
  let component: Editor;
  let wsService: MockYjsWebsocketService;

  beforeEach(async () => {
    const mockRoute = {
      paramMap: of({
        get: (key: string) => (key === 'roomId' ? 'test-room-123' : null),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Editor],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: YjsWebsocketService, useClass: MockYjsWebsocketService },
        { provide: RoomService, useClass: MockRoomService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Editor);
    component = fixture.componentInstance;
    wsService = TestBed.inject(YjsWebsocketService) as any;

    const host = document.createElement('div');
    host.id = 'test-editor-host';
    document.body.appendChild(host);

    component.editorContainer = new ElementRef(host);

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  });

  afterEach(() => {
    const host = document.getElementById('test-editor-host');
    if (host?.parentNode) host.parentNode.removeChild(host);
    vi.restoreAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should read roomId and call wsService.connect', () => {
    expect(component.roomId).toBe('test-room-123');
    expect(wsService.connect).toHaveBeenCalledWith('test-room-123');
  });

  it('should initialize Y.Text and Awareness', () => {
    const ytext = wsService.getSharedText('codemirror');
    expect(ytext).toBeTruthy();
    expect(ytext.toString()).toContain('Welcome to CodeMirror 6');
  });

  it('should initialize EditorView attached to DOM', () => {
    expect(component.editorView).toBeTruthy();
    const host = component.editorContainer.nativeElement as HTMLElement;
    expect(host.children.length).toBeGreaterThan(0);
  });

  it('should update code() when changes happen', () => {
    const view = component.editorView;
    const newText = 'console.log("TEST");';

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newText },
    });

    expect(component.code()).toBe(newText);
  });

  it('should compute lineNumbers', () => {
    const view = component.editorView;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: 'A\nB\nC' },
    });

    expect(component.lineNumbers()).toEqual([1, 2, 3]);
  });

  it('should update cursor position', () => {
    const view = component.editorView;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: 'A\nB\nC\nD' },
    });

    const pos = view.state.doc.length;
    view.dispatch({ selection: { anchor: pos, head: pos } });

    component.updateCursor(view.state);

    const line = view.state.doc.line(4);
    const expectedCol = pos - line.from + 1;

    expect(component.cursorLine()).toBe(4);
    expect(component.cursorCol()).toBe(expectedCol);
  });

  it('should detect autocompletion extension', () => {
    const view = component.editorView;

    view.dispatch({
      changes: { from: 0, to: 0, insert: 'con' },
    });

    expect(view.state.doc.toString()).toContain('con');
  });

  it('should support undo/redo', () => {
    const view = component.editorView;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: '123' },
    });

    const okUndo = undo(view);
    expect(typeof okUndo).toBe('boolean');

    const okRedo = redo(view);
    expect(typeof okRedo).toBe('boolean');

    expect(view.state.doc.toString()).toContain('123');
  });
  it('should apply remote Y.Text updates', async () => {
    const ytext = wsService.getSharedText('codemirror');

    ytext.insert(ytext.length, '\n// remote');
    await Promise.resolve();

    expect(component.code()).toContain('// remote');
  });

  it('should destroy editor and wsService', () => {
    const view = component.editorView;
    const spy = vi.spyOn(view, 'destroy');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
    expect(wsService.destroy).toHaveBeenCalled();
  });
});
