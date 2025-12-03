import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from './editor';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { EditorView } from '@codemirror/view';
import { vi } from 'vitest'; 
describe('Editor Component', () => {
  let component: Editor;
  let fixture: ComponentFixture<Editor>;
  let mockActivatedRoute: any;
  const INITIAL_CODE_LINES = 4;

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(new Map([['roomId', 'test-room-123']])),
    };

    await TestBed.configureTestingModule({
      imports: [Editor],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(Editor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should retrieve roomId from ActivatedRoute', () => {
    expect(component.roomId).toBe('test-room-123');
  });

  it('should initialize CodeMirror editor in the DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cmContent = compiled.querySelector('.cm-content');

    expect(cmContent).toBeTruthy();
    expect(cmContent?.textContent).toContain('Welcome to CodeMirror 6');
  });

  it('should update "code" signal when editor content changes', () => {
    const view: EditorView = (component as any).editorView;
    const newText = 'console.log("Hello World");';

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newText },
    });

    expect(component.code()).toBe(newText);
  });

  it('should correctly compute "lineNumbers" signal', () => {
    const view: EditorView = (component as any).editorView;
    const textWithNewLines = 'Line 1\nLine 2\nLine 3';

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: textWithNewLines },
    });

    expect(component.lineNumbers().length).toBe(3);
    expect(component.lineNumbers()).toEqual([1, 2, 3]);
  });

  it('should update cursor position signals when selection changes', () => {
    const view: EditorView = (component as any).editorView;
    const docLength = view.state.doc.length;

    view.dispatch({
      selection: { anchor: docLength, head: docLength },
    });

    expect(component.cursorLine()).toBe(INITIAL_CODE_LINES);
  });

  it('should update the sidebar line numbers in the DOM', () => {
    const view: EditorView = (component as any).editorView;
    const threeLines = 'A\nB\nC';

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: threeLines },
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const sidebarLines = compiled.querySelectorAll('.line-number');

    expect(sidebarLines.length).toBe(3);
    expect(sidebarLines[0].textContent?.trim()).toBe('1');
    expect(sidebarLines[2].textContent?.trim()).toBe('3');
  });

  it('should cleanup EditorView on destroy', () => {
    const view: EditorView = (component as any).editorView;
    
    const destroySpy = vi.spyOn(view, 'destroy');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});

