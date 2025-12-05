import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}

  public get<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const item = localStorage.getItem(key);

      if (item === null) {
        return null;
      }

      if (item.startsWith('{') || item.startsWith('[')) {
        return JSON.parse(item) as T;
      }

      return item as T;
    } catch (e) {
      console.error(`Error retrieving key "${key}" from localStorage:`, e);
      return null;
    }
  }

  public set(key: string, value: any): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (e) {
      console.error(`Error saving key "${key}" to localStorage:`, e);
    }
  }

  public remove(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  }

  public clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.clear();
  }
}
