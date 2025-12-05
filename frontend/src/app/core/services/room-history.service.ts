// src/app/core/services/room-history.service.ts
import { Injectable } from '@angular/core';
import { RoomSnapshot } from '../models/rooms.model';

@Injectable({ providedIn: 'root' })
export class RoomHistoryService {
  private MAX_SNAPSHOTS = 50;

  private keyFor(roomId: string) {
    return `editor_history_${roomId}`;
  }

  saveSnapshot(roomId: string, text: string, note?: string) {
    try {
      const key = this.keyFor(roomId);
      const list = this.listSnapshots(roomId);
      const snapshot: RoomSnapshot = {
        id: `${Date.now()}`,
        ts: new Date().toISOString(),
        text,
        note,
      };
      list.unshift(snapshot);
      if (list.length > this.MAX_SNAPSHOTS) list.splice(this.MAX_SNAPSHOTS);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('history save failed', e);
    }
  }

  listSnapshots(roomId: string): RoomSnapshot[] {
    const key = this.keyFor(roomId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as RoomSnapshot[];
    } catch (e) {
      console.warn('history parse failed', e);
      return [];
    }
  }

  restoreSnapshot(roomId: string, snapshotId: string): string | null {
    const list = this.listSnapshots(roomId);
    const found = list.find((s) => s.id === snapshotId);
    return found ? found.text : null;
  }

  deleteSnapshot(roomId: string, snapshotId: string) {
    const key = this.keyFor(roomId);
    const list = this.listSnapshots(roomId).filter((s) => s.id !== snapshotId);
    localStorage.setItem(key, JSON.stringify(list));
  }

  clearHistory(roomId: string) {
    localStorage.removeItem(this.keyFor(roomId));
  }
}
