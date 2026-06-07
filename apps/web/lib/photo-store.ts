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
      const upgradeTx = req.transaction!; // the versionchange transaction
      // Create the store and indexes idempotently — NEVER delete the store
      // (that would wipe all of the user's reference photos on every migration).
      const store = db.objectStoreNames.contains(STORE)
        ? upgradeTx.objectStore(STORE)
        : db.createObjectStore(STORE, { keyPath: 'id' });
      if (!store.indexNames.contains('by_model')) {
        store.createIndex('by_model', ['brandId', 'modelId'], { unique: false });
      }
      if (!store.indexNames.contains('by_model_part')) {
        store.createIndex('by_model_part', ['brandId', 'modelId', 'part'], { unique: false });
      }
    };
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another open tab.'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Cache the connection: reopening on every operation is slow and multiplies the
// chance of an `onblocked` hang during an upgrade.
let dbPromise: Promise<IDBDatabase> | null = null;
function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB()
      .then((db) => {
        db.onversionchange = () => { db.close(); dbPromise = null; };
        db.onclose = () => { dbPromise = null; };
        return db;
      })
      .catch((e) => { dbPromise = null; throw e; });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return getDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        let result: T;
        req.onsuccess = () => { result = req.result; };
        req.onerror = () => reject(req.error);
        // Resolve on COMMIT (not just request success) so a write that later
        // aborts (e.g. QuotaExceededError) rejects instead of reporting success.
        t.oncomplete = () => resolve(result);
        t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted.'));
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

/** All photos for a brand + model, across every part (newest first). */
export function getPhotosByModel(brandId: string, modelId: string): Promise<RefPhoto[]> {
  return tx<RefPhoto[]>('readonly', (store) =>
    store.index('by_model').getAll([brandId, modelId]),
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
