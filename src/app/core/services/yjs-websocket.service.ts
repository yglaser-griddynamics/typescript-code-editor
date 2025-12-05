// YjsWebsocket.service.ts
import { Injectable } from '@angular/core';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

@Injectable({ providedIn: 'root' })
export class YjsWebsocketService {
  ydoc: Y.Doc;
  provider?: WebsocketProvider;
  private connectedRoom: string | null = null;

  private wsUrl = 'ws://localhost:1234';

  constructor() {
    this.ydoc = new Y.Doc();
  }

  async connect(roomId: string): Promise<void> {
    if (this.connectedRoom === roomId && this.provider?.shouldConnect) {
      console.log(`Already connected to room: ${roomId}`);
      return;
    }

    if (this.provider) {
      try {
        console.log(`Disconnecting from previous room: ${this.connectedRoom}`);
        this.provider.disconnect();
        this.provider.destroy();
      } catch (e) {
        console.warn('Previous provider destroy error:', e);
      }
      this.provider = undefined;
    }

    this.ydoc = new Y.Doc();
    console.log(`Created new Y.Doc for room: ${roomId}`);

    this.provider = new WebsocketProvider(this.wsUrl, roomId, this.ydoc, {
      connect: true,
    });

    this.provider.on('status', (ev: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      console.log(`y-websocket status for room ${roomId}:`, ev.status);
    });

    this.connectedRoom = roomId;

    this.getSharedText('codemirror');

    return new Promise<void>((resolve) => {
      let resolved = false;

      const resolveHandler = () => {
        if (!resolved) {
          resolved = true;
          console.log('Initial sync completed for room (via "sync" event):', roomId);
          this.provider?.off('sync', resolveHandler); // Clean up listener
          resolve();
        }
      };

      if (this.provider) {
        this.provider.on('sync', resolveHandler);
      }

      setTimeout(() => {
        if (!resolved) {
          console.warn(`Sync timeout reached for room ${roomId}. Proceeding.`);
          resolveHandler(); 
        }
      }, 3000);
    });
  }

  getSharedText(name = 'codemirror'): Y.Text {
    return this.ydoc.getText(name);
  }

  getAwareness(): Awareness | undefined {
    return this.provider?.awareness;
  }

  destroy(): void {
    if (this.provider) {
      try {
        this.provider.disconnect();
        this.provider.destroy();
      } catch (e) {
        console.warn('Destroy provider error:', e);
      }
      this.provider = undefined;
    }
    try {
      this.ydoc.destroy();
    } catch (e) {
      console.warn('Y.Doc destroy error:', e);
    }
    this.connectedRoom = null;
    console.log('YjsWebsocketService fully destroyed.');
  }
}
