import { Session, SessionMetadata } from '@/types';

const DB_NAME = 'PDF_FIXER_DB';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // We might want indices for sorting if the list gets huge, but for now memory sort is fine.
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const saveSession = async (session: Session): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(session);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSession = async (id: string): Promise<Session | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateSessionName = async (id: string, newName: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    
    getReq.onsuccess = () => {
      const data = getReq.result as Session;
      if (data) {
        data.name = newName;
        // We don't update lastModified here strictly, or maybe we should? 
        // User asked for sort by createdAt, so lastModified doesn't affect order.
        // Let's keep it simple.
        const putReq = store.put(data);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        reject(new Error('Session not found'));
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const getAllSessionsMetadata = async (): Promise<SessionMetadata[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const sessions: SessionMetadata[] = [];
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        // Destructure to separate heavy pages data from metadata
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { pages, ...metadata } = cursor.value; 
        sessions.push(metadata);
        cursor.continue();
      } else {
        // Sort by createdAt descending (newest first) as requested
        sessions.sort((a, b) => b.createdAt - a.createdAt);
        resolve(sessions);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};