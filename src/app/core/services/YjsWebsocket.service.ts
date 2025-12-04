import { Injectable, OnDestroy } from '@angular/core';
import * as Y from 'yjs';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YjsWebsocketService implements OnDestroy {
  public ydoc: Y.Doc;
  private ws: WebSocket | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly docUpdateSubject = new Subject<Y.Doc>();

  public docUpdate$: Observable<Y.Doc> = this.docUpdateSubject.asObservable();

  constructor() {
    this.ydoc = new Y.Doc();
  }

  public connect(room: string, url: string = 'ws://localhost:3000'): void {
    if (this.ws) {
      this.ws.close();
    }

    const wsUrl = `${url}/${room}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log(`WebSocket connected to room: ${room}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const update = new Uint8Array(event.data as ArrayBuffer);
        Y.applyUpdate(this.ydoc, update, this.ws);
        this.docUpdateSubject.next(this.ydoc);
      } catch (err) {
        console.error('Failed to apply incoming update:', err);
      }
    };

    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && origin !== this.ws) {
        this.ws.send(update);
      }
    });

    this.ws.onclose = () => console.log('WebSocket disconnected.');
    this.ws.onerror = (error) => console.error('WebSocket error:', error);
  }

  public getSharedText(key: string = 'codemirror'): Y.Text {
    return this.ydoc.getText(key);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
