import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCacheService {
  private dbName = 'image-cache-db';
  private storeName = 'images';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, 1);

    request.onerror = (event) => {
      console.error('Erro ao abrir o IndexedDB:', event);
    };

    request.onsuccess = (event: any) => {
      this.db = event.target.result;
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
    
      if (db && !db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName);
      }
    
      this.db = db;
    };
  }

  saveImage(id: string, base64Image: string): void {
    if (!this.db) {
      console.error('Banco de dados não inicializado!');
      return;
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put(base64Image, id);
  }

  getImage(id: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('Banco de dados não inicializado!');
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = (event: any) => {
        resolve(event.target.result || null);
      };

      request.onerror = (event) => {
        console.error('Erro ao buscar imagem:', event);
        reject(event);
      };
    });
  }

  deleteImage(id: string): void {
    if (!this.db) {
      console.error('Banco de dados não inicializado!');
      return;
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.delete(id);
  }
}