/**
 * Local reference-photo store backed by IndexedDB.
 *
 * Stores the user's own photos of verified-authentic watches, keyed by
 * brand + model + part. IndexedDB handles hundreds of images (far more than
 * localStorage). Everything stays on this device/browser; migrating to Supabase
 * later would sync across devices.
 */

export type RefPhoto = {
  id: string;
  brandId: string;
  modelId: string;
  /** Caliber derived from the model+year, stored for context. */
  caliber: string;
  /** Year of the reference piece, for context. */
  year?: number;
  part: string;
  dataUrl: string;
  label?: string;
  createdAt: number;
};

const DB_NAME = 'watch-auth-gallery';
const STORE = 'reference-photos';
const VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Recreate the store with model-based indexes
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('by_model', ['brandId', 'modelId'], { unique: false });
      store.createIndex('by_model_part', ['brandId', 'modelId', 'part'], { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function savePhoto(p: RefPhoto): Promise<IDBValidKey> {
  return tx('readwrite', (store) => store.put(p));
}

export function deletePhoto(id: string): Promise<undefined> {
  return tx('readwrite', (store) => store.delete(id) as IDBRequest<undefined>);
}

/** All photos for a brand + model + part. */
export function getPhotos(brandId: string, modelId: string, part: string): Promise<RefPhoto[]> {
  return tx<RefPhoto[]>('readonly', (store) =>
    store.index('by_model_part').getAll([brandId, modelId, part]),
  ).then((rows) => rows.sort((a, b) => b.createdAt - a.createdAt));
}

/** Count of photos stored for a brand + model (across all parts). */
export function countByModel(brandId: string, modelId: string): Promise<number> {
  return tx<number>('readonly', (store) =>
    store.index('by_model').count(IDBKeyRange.only([brandId, modelId])),
  );
}

/** Every stored photo (for export/backup or a global view). */
export function getAllPhotos(): Promise<RefPhoto[]> {
  return tx<RefPhoto[]>('readonly', (store) => store.getAll());
}
