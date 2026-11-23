import type { RecordingKind } from "@/data/questions";
export type SavedRecording = { kind: RecordingKind; blob: Blob; duration: number; savedAt: string; visible: boolean };
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open("voice-match-recordings", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("recordings", { keyPath: "kind" });
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("別のタブを閉じて再試行してください"));
    request.onsuccess = () => resolve(request.result);
  });
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("recordings", mode);
    const request = operation(tx.objectStore("recordings"));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error ?? request.error); };
  });
}
export const getRecordings = () => transaction("readonly", store => store.getAll()) as Promise<SavedRecording[]>;
export const saveRecording = (recording: SavedRecording) => transaction("readwrite", store => store.put(recording));
export const deleteRecording = (kind: RecordingKind) => transaction("readwrite", store => store.delete(kind));
