import { Injectable } from '@angular/core';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

@Injectable({ providedIn: 'root' })
export class YjsWebsocketService {
  ydoc: Y.Doc;
  provider?: WebsocketProvider;
  private connectedRoom: string | null = null;
  private wsUrl = 'wss://your-y-websocket-server.example'; // set your server

  constructor() {
    this.ydoc = new Y.Doc();
  }

  // connect once to a room (no-op if same room)
  async connectRoom(roomId: string) {
    if (this.connectedRoom === roomId && this.provider && this.provider.shouldConnect) {
      return;
    }

    // If we already have a provider for another room: destroy it cleanly
    if (this.provider) {
      try {
        this.provider.disconnect();
        this.provider.destroy();
      } catch (e) {
        console.warn('provider destroy error', e);
      }
    }

    // New doc per room keeps lifetime simple & avoids mixing docs
    this.ydoc = new Y.Doc();
    this.provider = new WebsocketProvider(this.wsUrl, roomId, this.ydoc, { connect: true });

    // You can forward provider status events as needed
    this.provider.on('status', (ev: any) => {
      console.log('y-websocket status', ev.status);
    });

    this.connectedRoom = roomId;
    // ensure a shared text exists
    this.getSharedText('codemirror');
  }

  // returns a Y.Text instance called name
  getSharedText(name = 'codemirror') {
    return this.ydoc.getText(name);
  }

  // expose awareness for collaborators
  getAwareness() {
    return this.provider?.awareness;
  }

  // cleanly disconnect provider (used on app destroy)
  destroy() {
    if (this.provider) {
      try {
        this.provider.disconnect();
        this.provider.destroy();
      } catch (e) {}
      this.provider = undefined;
    }
    try {
      this.ydoc.destroy();
    } catch (e) {}
    this.connectedRoom = null;
  }
}
