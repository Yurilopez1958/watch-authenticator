/**
 * Local reference-photo store backed by IndexedDB.
 *
 * Stores the user's own photos of verified-authentic watches, keyed by
 * brand + caliber + part. IndexedDB handles hundreds of images (far more than
 * localStorage). Everything stays on this device/browser; migrating to Supabase
 * later would sync across devices.
 */

export type RefPhoto = {
  id: string;
  brandId: string;
  caliber: string;
  part: string;
  dataUrl: string;
  label?: string;
  createdAt: number;
};

const DB_NAME = 'watch-auth-gallery';
const STORE = 'reference-photos';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by_brand_caliber', ['brandId', 'caliber'], { unique: false });
        store.createIndex('by_key', ['brandId', 'caliber', 'part'], { unique: false });
      }
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

/** All photos for a brand + caliber + part. */
export function getPhotos(brandId: string, caliber: string, part: string): Promise<RefPhoto[]> {
  return tx<RefPhoto[]>('readonly', (store) =>
    store.index('by_key').getAll([brandId, caliber, part]),
  ).then((rows) => rows.sort((a, b) => b.createdAt - a.createdAt));
}

/** Count of photos stored for a brand + caliber (across all parts). */
export function countByCaliber(brandId: string, caliber: string): Promise<number> {
  return tx<number>('readonly', (store) =>
    store.index('by_brand_caliber').count(IDBKeyRange.only([brandId, caliber])),
  );
}

/** Every stored photo (for export/backup or a global view). */
export function getAllPhotos(): Promise<RefPhoto[]> {
  return tx<RefPhoto[]>('readonly', (store) => store.getAll());
}
